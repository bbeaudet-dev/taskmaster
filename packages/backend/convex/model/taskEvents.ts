import { ConvexError } from "convex/values";

import type { Doc, Id } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";

type TaskId = Id<"tasks">;
type TaskEventDoc = Doc<"taskEvents">;

export async function recordTaskCompleted(
	ctx: MutationCtx,
	ownerId: string,
	taskId: TaskId,
	at: number,
) {
	await ctx.db.insert("taskEvents", {
		taskId,
		ownerId,
		type: "completed",
		at,
	});
}

export async function getTaskCompletionStats(
	ctx: QueryCtx,
	ownerId: string,
	taskId: TaskId,
	now: number,
) {
	const task = await ctx.db.get(taskId);
	if (!task) {
		throw new ConvexError("Task not found");
	}
	if (task.ownerId !== ownerId) {
		throw new ConvexError("Not authorized");
	}

	const events = await ctx.db
		.query("taskEvents")
		.withIndex("by_task", (q) => q.eq("taskId", taskId))
		.collect();
	const completionEvents = events
		.filter((event) => event.ownerId === ownerId && event.type === "completed")
		.sort((left, right) => right.at - left.at);

	return {
		completionCount: completionEvents.length,
		currentStreak: getCurrentDailyStreak(completionEvents, now),
		lastCompletedAt: completionEvents[0]?.at,
	};
}

function getCurrentDailyStreak(events: TaskEventDoc[], now: number) {
	if (events.length === 0) {
		return 0;
	}

	const completedDays = new Set(events.map((event) => toDayKey(event.at)));
	const today = startOfDay(now);
	let cursor = completedDays.has(toDayKey(today)) ? today : addDays(today, -1);
	let streak = 0;

	while (completedDays.has(toDayKey(cursor))) {
		streak += 1;
		cursor = addDays(cursor, -1);
	}

	return streak;
}

function toDayKey(timestamp: number) {
	const date = new Date(timestamp);
	return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

function startOfDay(timestamp: number) {
	const date = new Date(timestamp);
	return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

function addDays(timestamp: number, days: number) {
	const date = new Date(timestamp);
	date.setDate(date.getDate() + days);
	return date.getTime();
}
