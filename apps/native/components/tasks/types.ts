import type { Doc, Id } from "@taskmaster/backend/convex/_generated/dataModel";

export type Task = Doc<"tasks">;
export type TaskId = Id<"tasks">;
export type ListScope = "open" | "completed" | "all";
export type Significance = "important" | "normal" | "someday";
export type DateField = "doDate" | "dueDate";

export type TaskFormState = {
	title: string;
	notes: string;
	dueDate: number | undefined;
	doDate: number | undefined;
	tags: string;
	significance: Significance;
};

export type TaskFormPayload = {
	title: string;
	notes: string | undefined;
	dueDate: number | undefined;
	doDate: number | undefined;
	tags: string[] | undefined;
	significance: Significance;
};

export const emptyTaskForm: TaskFormState = {
	title: "",
	notes: "",
	dueDate: undefined,
	doDate: undefined,
	tags: "",
	significance: "normal",
};

export const listScopes: ListScope[] = ["open", "completed", "all"];
export const significances: Significance[] = ["important", "normal", "someday"];
