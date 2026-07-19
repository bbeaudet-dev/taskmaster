import { ConvexError } from "convex/values";

import type { Doc, Id } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";
import { authComponent } from "../auth";
import type { Recurrence, TaskSignificance, TaskSource } from "../schema";
import {
	assertCanAccessList,
	canAccessList,
	ensureDefaultList,
	listAccessibleLists,
} from "./lists";
import { getNextRecurringDates } from "./recurrence";
import { recordTaskCompleted } from "./taskEvents";

type TaskId = Id<"tasks">;
type ListId = Id<"lists">;
type TaskDoc = Doc<"tasks">;

const fallbackOwnerId = "local-dev-owner";

export type TaskCreateInput = {
	title: string;
	notes?: string;
	dueDate?: number;
	doDate?: number;
	listId?: ListId;
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
	listId?: ListId | null;
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
	const listId = input.listId ?? (await ensureDefaultList(ctx, ownerId));
	await assertCanAccessList(ctx, ownerId, listId);

	return await ctx.db.insert("tasks", {
		ownerId,
		listId,
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
	listId?: ListId,
) {
	if (listId !== undefined) {
		await assertCanAccessList(ctx, ownerId, listId);
		return filterByScope(
			await ctx.db
				.query("tasks")
				.withIndex("by_list_and_completed", (q) => q.eq("listId", listId))
				.collect(),
			scope,
		);
	}

	const ownedTasks = await ctx.db
		.query("tasks")
		.withIndex("by_owner", (q) => q.eq("ownerId", ownerId))
		.collect();
	const sharedLists = (await listAccessibleLists(ctx, ownerId)).filter(
		(list) => list.access === "shared",
	);
	const sharedTasksByList = await Promise.all(
		sharedLists.map(async (list) =>
			await ctx.db
				.query("tasks")
				.withIndex("by_list_and_completed", (q) => q.eq("listId", list._id))
				.collect(),
		),
	);

	return filterByScope([...ownedTasks, ...sharedTasksByList.flat()], scope);
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
	if (input.listId !== undefined) {
		if (input.listId === null) {
			patch.listId = await ensureDefaultList(ctx, ownerId);
		} else {
			await assertCanAccessList(ctx, ownerId, input.listId);
			patch.listId = input.listId;
		}
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
		await recordTaskCompleted(ctx, ownerId, task._id, now);
		await ctx.db.patch(task._id, {
			...nextDates,
			completedAt: undefined,
			updatedAt: now,
		});
		return null;
	}

	const completedAt = completed ? (task.completedAt ?? now) : undefined;
	if (completed && task.completedAt === undefined) {
		await recordTaskCompleted(ctx, ownerId, task._id, now);
	}

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
	if (task.listId !== undefined && (await canAccessList(ctx, ownerId, task.listId))) {
		return task;
	}
	if (task.ownerId !== ownerId) {
		throw new ConvexError("Not authorized");
	}

	return task;
}

function filterByScope(tasks: TaskDoc[], scope: TaskListScope) {
	if (scope === "open") {
		return tasks.filter((task) => task.completedAt === undefined);
	}
	if (scope === "completed") {
		return tasks.filter((task) => task.completedAt !== undefined);
	}

	return tasks;
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
