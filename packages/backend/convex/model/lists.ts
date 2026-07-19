import { ConvexError } from "convex/values";

import type { Doc, Id } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";

type ListId = Id<"lists">;
type ListDoc = Doc<"lists">;

export type AccessibleList = ListDoc & {
	access: "owner" | "shared";
};

export async function ensureDefaultList(ctx: MutationCtx, ownerId: string) {
	const existing = await ctx.db
		.query("lists")
		.withIndex("by_owner_and_default", (q) =>
			q.eq("ownerId", ownerId).eq("isDefault", true),
		)
		.first();

	if (existing) {
		return existing._id;
	}

	const now = Date.now();
	return await ctx.db.insert("lists", {
		ownerId,
		name: "General",
		isDefault: true,
		createdAt: now,
		updatedAt: now,
	});
}

export async function createList(
	ctx: MutationCtx,
	ownerId: string,
	input: { name: string },
) {
	const name = cleanListName(input.name);
	const now = Date.now();

	return await ctx.db.insert("lists", {
		ownerId,
		name,
		isDefault: false,
		createdAt: now,
		updatedAt: now,
	});
}

export async function renameList(
	ctx: MutationCtx,
	ownerId: string,
	input: { listId: ListId; name: string },
) {
	const list = await getListForOwner(ctx, ownerId, input.listId);

	await ctx.db.patch(list._id, {
		name: cleanListName(input.name),
		updatedAt: Date.now(),
	});
	return null;
}

export async function inviteToList(
	ctx: MutationCtx,
	ownerId: string,
	input: { listId: ListId; email: string },
) {
	const list = await getListForOwner(ctx, ownerId, input.listId);
	const email = normalizeEmail(input.email);
	const existingInvite = await ctx.db
		.query("listInvites")
		.withIndex("by_list", (q) => q.eq("listId", list._id))
		.collect();
	const matchingInvite = existingInvite.find(
		(invite) => invite.email === email && invite.acceptedAt === undefined,
	);

	if (matchingInvite) {
		return matchingInvite._id;
	}

	return await ctx.db.insert("listInvites", {
		listId: list._id,
		ownerId,
		email,
		createdAt: Date.now(),
	});
}

export async function acceptInvite(
	ctx: MutationCtx,
	userId: string,
	input: { inviteId: Id<"listInvites">; email: string },
) {
	const invite = await ctx.db.get(input.inviteId);
	if (!invite) {
		throw new ConvexError("Invite not found");
	}
	if (invite.acceptedAt !== undefined) {
		throw new ConvexError("Invite already accepted");
	}
	if (invite.email !== normalizeEmail(input.email)) {
		throw new ConvexError("Invite email does not match");
	}

	const existingShares = await ctx.db
		.query("listShares")
		.withIndex("by_list", (q) => q.eq("listId", invite.listId))
		.collect();
	const existingShare = existingShares.find(
		(share) => share.sharedWithUserId === userId,
	);
	const now = Date.now();

	if (!existingShare) {
		await ctx.db.insert("listShares", {
			listId: invite.listId,
			ownerId: invite.ownerId,
			sharedWithUserId: userId,
			createdAt: now,
		});
	}

	await ctx.db.patch(invite._id, { acceptedAt: now });
	return invite.listId;
}

export async function listAccessibleLists(ctx: QueryCtx, userId: string) {
	const ownedLists = await ctx.db
		.query("lists")
		.withIndex("by_owner", (q) => q.eq("ownerId", userId))
		.collect();
	const shares = await ctx.db
		.query("listShares")
		.withIndex("by_shared_with_user", (q) => q.eq("sharedWithUserId", userId))
		.collect();
	const sharedLists = await Promise.all(
		shares.map(async (share) => await ctx.db.get(share.listId)),
	);

	return [
		...ownedLists.map((list) => ({ ...list, access: "owner" as const })),
		...sharedLists
			.filter((list): list is ListDoc => list !== null)
			.map((list) => ({ ...list, access: "shared" as const })),
	];
}

export async function canAccessList(
	ctx: QueryCtx | MutationCtx,
	userId: string,
	listId: ListId,
) {
	const list = await ctx.db.get(listId);
	if (!list) {
		return false;
	}
	if (list.ownerId === userId) {
		return true;
	}

	const shares = await ctx.db
		.query("listShares")
		.withIndex("by_shared_with_user", (q) => q.eq("sharedWithUserId", userId))
		.collect();
	return shares.some((share) => share.listId === listId);
}

export async function assertCanAccessList(
	ctx: QueryCtx | MutationCtx,
	userId: string,
	listId: ListId,
) {
	if (!(await canAccessList(ctx, userId, listId))) {
		throw new ConvexError("Not authorized");
	}
}

async function getListForOwner(
	ctx: QueryCtx | MutationCtx,
	ownerId: string,
	listId: ListId,
) {
	const list = await ctx.db.get(listId);
	if (!list) {
		throw new ConvexError("List not found");
	}
	if (list.ownerId !== ownerId) {
		throw new ConvexError("Not authorized");
	}

	return list;
}

function cleanListName(name: string) {
	const trimmed = name.trim();
	if (trimmed.length === 0) {
		throw new ConvexError("List name is required");
	}

	return trimmed;
}

function normalizeEmail(email: string) {
	const normalized = email.trim().toLowerCase();
	if (!normalized.includes("@")) {
		throw new ConvexError("Valid email is required");
	}

	return normalized;
}
