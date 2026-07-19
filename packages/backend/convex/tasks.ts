import { v } from "convex/values";

import { mutation, query } from "./_generated/server";
import {
	createTask,
	deleteTask,
	listTasksForOwner,
	requireOwnerId,
	setCompleted as setTaskCompleted,
	updateTask,
} from "./model/tasks";
import { getTaskCompletionStats } from "./model/taskEvents";
import { recurrence, taskFields, taskSignificance, taskSource } from "./schema";

const listScope = v.union(
	v.literal("open"),
	v.literal("completed"),
	v.literal("all"),
);

const taskDoc = v.object({
	_id: v.id("tasks"),
	_creationTime: v.number(),
	...taskFields,
});

export const create = mutation({
	args: {
		title: v.string(),
		notes: v.optional(v.string()),
		dueDate: v.optional(v.number()),
		doDate: v.optional(v.number()),
		listId: v.optional(v.id("lists")),
		tags: v.optional(v.array(v.string())),
		significance: v.optional(taskSignificance),
		source: v.optional(taskSource),
		recurrence: v.optional(recurrence),
	},
	returns: v.id("tasks"),
	handler: async (ctx, args) => {
		const ownerId = await requireOwnerId(ctx);
		return await createTask(ctx, ownerId, args);
	},
});

export const list = query({
	args: {
		scope: v.optional(listScope),
		listId: v.optional(v.id("lists")),
	},
	returns: v.array(taskDoc),
	handler: async (ctx, args) => {
		const ownerId = await requireOwnerId(ctx);
		return await listTasksForOwner(ctx, ownerId, args.scope ?? "open", args.listId);
	},
});

export const update = mutation({
	args: {
		taskId: v.id("tasks"),
		title: v.optional(v.string()),
		notes: v.optional(v.union(v.string(), v.null())),
		dueDate: v.optional(v.union(v.number(), v.null())),
		doDate: v.optional(v.union(v.number(), v.null())),
		listId: v.optional(v.union(v.id("lists"), v.null())),
		tags: v.optional(v.union(v.array(v.string()), v.null())),
		significance: v.optional(taskSignificance),
		source: v.optional(taskSource),
		recurrence: v.optional(v.union(recurrence, v.null())),
	},
	returns: v.null(),
	handler: async (ctx, args) => {
		const ownerId = await requireOwnerId(ctx);
		return await updateTask(ctx, ownerId, args);
	},
});

export const setCompleted = mutation({
	args: {
		taskId: v.id("tasks"),
		completed: v.boolean(),
	},
	returns: v.null(),
	handler: async (ctx, args) => {
		const ownerId = await requireOwnerId(ctx);
		return await setTaskCompleted(ctx, ownerId, args.taskId, args.completed);
	},
});

export const completionStats = query({
	args: {
		taskId: v.id("tasks"),
		now: v.number(),
	},
	returns: v.object({
		completionCount: v.number(),
		currentStreak: v.number(),
		lastCompletedAt: v.optional(v.number()),
	}),
	handler: async (ctx, args) => {
		const ownerId = await requireOwnerId(ctx);
		return await getTaskCompletionStats(ctx, ownerId, args.taskId, args.now);
	},
});

export const remove = mutation({
	args: {
		taskId: v.id("tasks"),
	},
	returns: v.null(),
	handler: async (ctx, args) => {
		const ownerId = await requireOwnerId(ctx);
		return await deleteTask(ctx, ownerId, args.taskId);
	},
});
