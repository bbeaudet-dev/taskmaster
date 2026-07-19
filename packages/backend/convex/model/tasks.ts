import { ConvexError } from "convex/values";

import type { Doc, Id } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";
import { authComponent } from "../auth";
import type { Recurrence, TaskSignificance, TaskSource } from "../schema";
import { getNextRecurringDates } from "./recurrence";

type TaskId = Id<"tasks">;
type TaskDoc = Doc<"tasks">;

const fallbackOwnerId = "local-dev-owner";

export type TaskCreateInput = {
	title: string;
	notes?: string;
	dueDate?: number;
	doDate?: number;
	tags?: string[];
	significance?: TaskSignificance;
	source?: TaskSource;
	recurrence?: Recurrence;
};

export type TaskUpdateInput = {
	taskId: TaskId;
	title?: string;
	notes?: string | null;
	dueDate?: number | null;
	doDate?: number | null;
	tags?: string[] | null;
	significance?: TaskSignificance;
	source?: TaskSource;
	recurrence?: Recurrence | null;
};

export type TaskListScope = "open" | "completed" | "all";

export async function requireOwnerId(ctx: QueryCtx | MutationCtx) {
	const authUser = await authComponent.safeGetAuthUser(ctx);
	if (!authUser) {
		return fallbackOwnerId;
	}

	return authUser._id;
}

export async function createTask(
	ctx: MutationCtx,
	ownerId: string,
	input: TaskCreateInput,
) {
	const title = cleanTitle(input.title);
	const now = Date.now();

	return await ctx.db.insert("tasks", {
		ownerId,
		title,
		notes: cleanOptionalText(input.notes),
		dueDate: input.dueDate,
		doDate: input.doDate,
		tags: cleanTags(input.tags),
		significance: input.significance ?? "normal",
		source: input.source ?? "manual",
		recurrence: input.recurrence,
		updatedAt: now,
	});
}

export async function listTasksForOwner(
	ctx: QueryCtx,
	ownerId: string,
	scope: TaskListScope,
) {
	if (scope === "open") {
		return await ctx.db
			.query("tasks")
			.withIndex("by_owner_and_completed", (q) =>
				q.eq("ownerId", ownerId).eq("completedAt", undefined),
			)
			.collect();
	}

	if (scope === "completed") {
		return await ctx.db
			.query("tasks")
			.withIndex("by_owner_and_completed", (q) =>
				q.eq("ownerId", ownerId).gt("completedAt", 0),
			)
			.collect();
	}

	return await ctx.db
		.query("tasks")
		.withIndex("by_owner", (q) => q.eq("ownerId", ownerId))
		.collect();
}

export async function updateTask(
	ctx: MutationCtx,
	ownerId: string,
	input: TaskUpdateInput,
) {
	const task = await getOwnedTask(ctx, ownerId, input.taskId);
	const patch: Partial<TaskDoc> = {
		updatedAt: Date.now(),
	};

	if (input.title !== undefined) {
		patch.title = cleanTitle(input.title);
	}
	if (input.notes !== undefined) {
		patch.notes = cleanNullableText(input.notes);
	}
	if (input.dueDate !== undefined) {
		patch.dueDate = input.dueDate ?? undefined;
	}
	if (input.doDate !== undefined) {
		patch.doDate = input.doDate ?? undefined;
	}
	if (input.tags !== undefined) {
		patch.tags = input.tags === null ? undefined : cleanTags(input.tags);
	}
	if (input.significance !== undefined) {
		patch.significance = input.significance;
	}
	if (input.source !== undefined) {
		patch.source = input.source;
	}
	if (input.recurrence !== undefined) {
		patch.recurrence = input.recurrence ?? undefined;
	}

	await ctx.db.patch(task._id, patch);
	return null;
}

export async function setCompleted(
	ctx: MutationCtx,
	ownerId: string,
	taskId: TaskId,
	completed: boolean,
) {
	const task = await getOwnedTask(ctx, ownerId, taskId);
	const now = Date.now();

	if (completed && task.recurrence) {
		const nextDates = getNextRecurringDates(task, now);
		await ctx.db.patch(task._id, {
			...nextDates,
			completedAt: undefined,
			updatedAt: now,
		});
		return null;
	}

	const completedAt = completed ? (task.completedAt ?? now) : undefined;

	await ctx.db.patch(task._id, {
		completedAt,
		updatedAt: now,
	});
	return null;
}

export async function deleteTask(
	ctx: MutationCtx,
	ownerId: string,
	taskId: TaskId,
) {
	const task = await getOwnedTask(ctx, ownerId, taskId);
	await ctx.db.delete(task._id);
	return null;
}

async function getOwnedTask(
	ctx: QueryCtx | MutationCtx,
	ownerId: string,
	taskId: TaskId,
) {
	const task = await ctx.db.get(taskId);
	if (!task) {
		throw new ConvexError("Task not found");
	}
	if (task.ownerId !== ownerId) {
		throw new ConvexError("Not authorized");
	}

	return task;
}

function cleanTitle(title: string) {
	const trimmed = title.trim();
	if (trimmed.length === 0) {
		throw new ConvexError("Task title is required");
	}

	return trimmed;
}

function cleanOptionalText(value: string | undefined) {
	const trimmed = value?.trim();
	return trimmed && trimmed.length > 0 ? trimmed : undefined;
}

function cleanNullableText(value: string | null) {
	if (value === null) {
		return undefined;
	}

	return cleanOptionalText(value);
}

function cleanTags(tags: string[] | undefined) {
	const cleaned = tags
		?.map((tag) => tag.trim())
		.filter((tag) => tag.length > 0);

	if (!cleaned || cleaned.length === 0) {
		return undefined;
	}

	return Array.from(new Set(cleaned));
}
