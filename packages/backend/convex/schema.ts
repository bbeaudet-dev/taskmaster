import { defineSchema, defineTable } from "convex/server";
import { type Infer, v } from "convex/values";

// Where a task came from. Defined once and reused across the schema and
// function args so there is a single source of truth for the shape.
export const taskSource = v.union(
  v.literal("manual"), // typed into the UI
  v.literal("nfc"), // created by an NFC tag tap
  v.literal("shortcut"), // Apple Shortcuts / App Intent
  v.literal("chat"), // Telegram / chat interface
  v.literal("generated"), // inferred by the system (calendar, LLM, nudges)
);
export type TaskSource = Infer<typeof taskSource>;

// How much a task matters. Intentionally not a numeric priority ladder:
// it captures meaning ("this matters" vs "parking-lot idea"), which the
// future urgency engine can combine with due/do dates.
export const taskSignificance = v.union(
  v.literal("important"), // matters, treat with weight
  v.literal("normal"), // default
  v.literal("someday"), // just want to remember; not urgent at all
);
export type TaskSignificance = Infer<typeof taskSignificance>;

export const taskEventType = v.union(v.literal("completed"));
export type TaskEventType = Infer<typeof taskEventType>;

export const listFields = {
  ownerId: v.string(),
  name: v.string(),
  isDefault: v.boolean(),
  createdAt: v.number(),
  updatedAt: v.number(),
};

export const listShareFields = {
  listId: v.id("lists"),
  ownerId: v.string(),
  sharedWithUserId: v.string(),
  createdAt: v.number(),
};

export const listInviteFields = {
  listId: v.id("lists"),
  ownerId: v.string(),
  email: v.string(),
  createdAt: v.number(),
  acceptedAt: v.optional(v.number()),
};

// A simplified, structured repeat rule (not raw iCal RRULE — easier to build
// UI and logic against; RRULE stays available as a future escape hatch).
// Model: a recurring task is a single row whose dates advance on completion,
// rather than spawning duplicate rows.
export const recurrence = v.object({
  frequency: v.union(
    v.literal("daily"),
    v.literal("weekly"),
    v.literal("monthly"),
    v.literal("yearly"),
  ),
  // Repeat every N units (e.g. 2 with "weekly" => every other week).
  interval: v.number(),
  // For weekly rules: which weekdays (0=Sun..6=Sat). Omit => same weekday
  // as the anchor date.
  daysOfWeek: v.optional(v.array(v.number())),
  // Fixed schedule ("every Tuesday") vs floating ("N days after I finish").
  // Defaults to "schedule" in logic; safe to ignore until needed.
  basis: v.union(v.literal("schedule"), v.literal("completion")),
  // Optional stop condition (ms epoch).
  until: v.optional(v.number()),
});
export type Recurrence = Infer<typeof recurrence>;

export const taskFields = {
  // The task's owner (Better-Auth subject id). Kept separate from access:
  // sharing with other people will live in its own join table later.
  ownerId: v.string(),
  listId: v.optional(v.id("lists")),
  title: v.string(),
  // Doubles as the description for now.
  notes: v.optional(v.string()),
  // Hard deadline (ms epoch). Past this = genuinely urgent.
  dueDate: v.optional(v.number()),
  // Optimistic "I'll get to it by" date, independent of the hard deadline.
  // Also serves as a visible "I've committed to this" signal.
  doDate: v.optional(v.number()),
  // Inline for now; can migrate to a tags table + join when they need
  // colors / renaming / counts.
  tags: v.optional(v.array(v.string())),
  significance: taskSignificance,
  source: taskSource,
  // Repeat rule. Absent => one-off task.
  recurrence: v.optional(recurrence),
  // null/undefined => open. Re-completing overwrites; if completion history
  // is ever needed, add an append-only taskEvents log rather than columns.
  completedAt: v.optional(v.number()),
  // Set in every mutation (created-at comes free from _creationTime).
  updatedAt: v.number(),
};

export const taskEventFields = {
  taskId: v.id("tasks"),
  ownerId: v.string(),
  type: taskEventType,
  at: v.number(),
};

export default defineSchema({
  lists: defineTable(listFields)
    .index("by_owner", ["ownerId"])
    .index("by_owner_and_default", ["ownerId", "isDefault"]),
  listShares: defineTable(listShareFields)
    .index("by_list", ["listId"])
    .index("by_shared_with_user", ["sharedWithUserId"])
    .index("by_owner", ["ownerId"]),
  listInvites: defineTable(listInviteFields)
    .index("by_email", ["email"])
    .index("by_list", ["listId"]),
  tasks: defineTable(taskFields)
    .index("by_owner", ["ownerId"])
    .index("by_owner_and_completed", ["ownerId", "completedAt"])
    .index("by_owner_and_due", ["ownerId", "dueDate"])
    .index("by_owner_and_do", ["ownerId", "doDate"])
    .index("by_list_and_completed", ["listId", "completedAt"]),
  taskEvents: defineTable(taskEventFields)
    .index("by_task", ["taskId"])
    .index("by_owner", ["ownerId"]),
});
