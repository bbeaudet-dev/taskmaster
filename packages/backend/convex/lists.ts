import { v } from "convex/values";

import { mutation, query } from "./_generated/server";
import {
	acceptInvite as acceptListInvite,
	createList,
	ensureDefaultList,
	inviteToList,
	listAccessibleLists,
	renameList,
} from "./model/lists";
import { requireOwnerId } from "./model/tasks";
import { listFields } from "./schema";

const listDoc = v.object({
	_id: v.id("lists"),
	_creationTime: v.number(),
	...listFields,
	access: v.union(v.literal("owner"), v.literal("shared")),
});

export const list = query({
	args: {},
	returns: v.array(listDoc),
	handler: async (ctx) => {
		const ownerId = await requireOwnerId(ctx);
		return await listAccessibleLists(ctx, ownerId);
	},
});

export const create = mutation({
	args: {
		name: v.string(),
	},
	returns: v.id("lists"),
	handler: async (ctx, args) => {
		const ownerId = await requireOwnerId(ctx);
		return await createList(ctx, ownerId, args);
	},
});

export const ensureDefault = mutation({
	args: {},
	returns: v.id("lists"),
	handler: async (ctx) => {
		const ownerId = await requireOwnerId(ctx);
		return await ensureDefaultList(ctx, ownerId);
	},
});

export const rename = mutation({
	args: {
		listId: v.id("lists"),
		name: v.string(),
	},
	returns: v.null(),
	handler: async (ctx, args) => {
		const ownerId = await requireOwnerId(ctx);
		return await renameList(ctx, ownerId, args);
	},
});

export const invite = mutation({
	args: {
		listId: v.id("lists"),
		email: v.string(),
	},
	returns: v.id("listInvites"),
	handler: async (ctx, args) => {
		const ownerId = await requireOwnerId(ctx);
		return await inviteToList(ctx, ownerId, args);
	},
});

export const acceptInvite = mutation({
	args: {
		inviteId: v.id("listInvites"),
		email: v.string(),
	},
	returns: v.id("lists"),
	handler: async (ctx, args) => {
		const ownerId = await requireOwnerId(ctx);
		return await acceptListInvite(ctx, ownerId, args);
	},
});
