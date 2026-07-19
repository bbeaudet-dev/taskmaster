import { api } from "@taskmaster/backend/convex/_generated/api";
import type { Id } from "@taskmaster/backend/convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import { useState } from "react";
import {
	Pressable,
	ScrollView,
	StyleSheet,
	Text,
	TextInput,
	View,
} from "react-native";

import { Container } from "@/components/container";
import { NAV_THEME } from "@/lib/constants";
import { useColorScheme } from "@/lib/use-color-scheme";

type ListScope = "open" | "completed" | "all";
type Significance = "important" | "normal" | "someday";

type FormState = {
	title: string;
	notes: string;
	dueDate: string;
	doDate: string;
	tags: string;
	significance: Significance;
};

const emptyForm: FormState = {
	title: "",
	notes: "",
	dueDate: "",
	doDate: "",
	tags: "",
	significance: "normal",
};

const scopes: ListScope[] = ["open", "completed", "all"];
const significances: Significance[] = ["important", "normal", "someday"];

export default function TasksScreen() {
	const { colorScheme } = useColorScheme();
	const theme = colorScheme === "dark" ? NAV_THEME.dark : NAV_THEME.light;
	const [scope, setScope] = useState<ListScope>("open");
	const [form, setForm] = useState<FormState>(emptyForm);
	const [editingTaskId, setEditingTaskId] = useState<Id<"tasks"> | null>(null);
	const tasks = useQuery(api.tasks.list, { scope });
	const createTask = useMutation(api.tasks.create);
	const updateTask = useMutation(api.tasks.update);
	const setCompleted = useMutation(api.tasks.setCompleted);
	const removeTask = useMutation(api.tasks.remove);

	const resetForm = () => {
		setForm(emptyForm);
		setEditingTaskId(null);
	};

	const submitTask = async () => {
		const title = form.title.trim();
		if (title.length === 0) {
			return;
		}

		const payload = {
			title,
			notes: optionalText(form.notes),
			dueDate: parseDate(form.dueDate),
			doDate: parseDate(form.doDate),
			tags: parseTags(form.tags),
			significance: form.significance,
		};

		if (editingTaskId) {
			await updateTask({ taskId: editingTaskId, ...payload });
		} else {
			await createTask(payload);
		}

		resetForm();
	};

	return (
		<Container>
			<ScrollView style={styles.scrollView} contentInsetAdjustmentBehavior="never">
				<View style={styles.content}>
					<Text style={[styles.heading, { color: theme.text }]}>Tasks</Text>

					<View
						style={[
							styles.card,
							{ backgroundColor: theme.card, borderColor: theme.border },
						]}
					>
						<Text style={[styles.cardTitle, { color: theme.text }]}>
							{editingTaskId ? "Edit Task" : "Add Task"}
						</Text>
						<TextInput
							value={form.title}
							onChangeText={(title) => setForm((current) => ({ ...current, title }))}
							placeholder="Task title"
							placeholderTextColor={theme.text + "80"}
							style={[
								styles.input,
								{
									borderColor: theme.border,
									color: theme.text,
									backgroundColor: theme.background,
								},
							]}
						/>
						<TextInput
							value={form.notes}
							onChangeText={(notes) => setForm((current) => ({ ...current, notes }))}
							placeholder="Notes"
							placeholderTextColor={theme.text + "80"}
							multiline
							style={[
								styles.input,
								styles.notesInput,
								{
									borderColor: theme.border,
									color: theme.text,
									backgroundColor: theme.background,
								},
							]}
						/>
						<View style={styles.dateRow}>
							<TextInput
								value={form.doDate}
								onChangeText={(doDate) =>
									setForm((current) => ({ ...current, doDate }))
								}
								placeholder="Do date (YYYY-MM-DD)"
								placeholderTextColor={theme.text + "80"}
								style={[
									styles.input,
									styles.dateInput,
									{
										borderColor: theme.border,
										color: theme.text,
										backgroundColor: theme.background,
									},
								]}
							/>
							<TextInput
								value={form.dueDate}
								onChangeText={(dueDate) =>
									setForm((current) => ({ ...current, dueDate }))
								}
								placeholder="Due date (YYYY-MM-DD)"
								placeholderTextColor={theme.text + "80"}
								style={[
									styles.input,
									styles.dateInput,
									{
										borderColor: theme.border,
										color: theme.text,
										backgroundColor: theme.background,
									},
								]}
							/>
						</View>
						<TextInput
							value={form.tags}
							onChangeText={(tags) => setForm((current) => ({ ...current, tags }))}
							placeholder="Tags (comma-separated)"
							placeholderTextColor={theme.text + "80"}
							style={[
								styles.input,
								{
									borderColor: theme.border,
									color: theme.text,
									backgroundColor: theme.background,
								},
							]}
						/>
						<View style={styles.segmentRow}>
							{significances.map((value) => (
								<SegmentButton
									key={value}
									label={value}
									active={form.significance === value}
									onPress={() =>
										setForm((current) => ({
											...current,
											significance: value,
										}))
									}
								/>
							))}
						</View>
						<View style={styles.actionRow}>
							<ActionButton
								label={editingTaskId ? "Save" : "Add"}
								onPress={submitTask}
								disabled={form.title.trim().length === 0}
							/>
							{editingTaskId ? (
								<ActionButton label="Cancel" variant="secondary" onPress={resetForm} />
							) : null}
						</View>
					</View>

					<View style={styles.segmentRow}>
						{scopes.map((value) => (
							<SegmentButton
								key={value}
								label={value}
								active={scope === value}
								onPress={() => setScope(value)}
							/>
						))}
					</View>

					{tasks === undefined ? (
						<Text style={[styles.mutedText, { color: theme.text }]}>
							Loading tasks...
						</Text>
					) : tasks.length === 0 ? (
						<Text style={[styles.mutedText, { color: theme.text }]}>
							No {scope === "all" ? "" : scope} tasks yet.
						</Text>
					) : (
						tasks.map((task) => (
							<View
								key={task._id}
								style={[
									styles.card,
									{
										backgroundColor: theme.card,
										borderColor: task.completedAt ? "#10b981" : theme.border,
									},
								]}
							>
								<Pressable
									onPress={() =>
										setCompleted({
											taskId: task._id,
											completed: task.completedAt === undefined,
										})
									}
								>
									<Text
										style={[
											styles.taskTitle,
											{
												color: theme.text,
												textDecorationLine: task.completedAt
													? "line-through"
													: "none",
											},
										]}
									>
										{task.completedAt ? "✓ " : "○ "}
										{task.title}
									</Text>
								</Pressable>
								{task.notes ? (
									<Text style={[styles.taskNotes, { color: theme.text }]}>
										{task.notes}
									</Text>
								) : null}
								<Text style={[styles.metaText, { color: theme.text }]}>
									{formatMeta(task.doDate, task.dueDate, task.significance)}
								</Text>
								<View style={styles.actionRow}>
									<ActionButton
										label="Edit"
										variant="secondary"
										onPress={() => {
											setEditingTaskId(task._id);
											setForm({
												title: task.title,
												notes: task.notes ?? "",
												dueDate: formatDateInput(task.dueDate),
												doDate: formatDateInput(task.doDate),
												tags: task.tags?.join(", ") ?? "",
												significance: task.significance,
											});
										}}
									/>
									<ActionButton
										label="Delete"
										variant="danger"
										onPress={() => removeTask({ taskId: task._id })}
									/>
								</View>
							</View>
						))
					)}
				</View>
			</ScrollView>
		</Container>
	);
}

function SegmentButton({
	label,
	active,
	onPress,
}: {
	label: string;
	active: boolean;
	onPress: () => void;
}) {
	return (
		<Pressable
			onPress={onPress}
			style={[styles.segmentButton, active ? styles.segmentButtonActive : null]}
		>
			<Text style={active ? styles.segmentTextActive : styles.segmentText}>
				{label}
			</Text>
		</Pressable>
	);
}

function ActionButton({
	label,
	onPress,
	variant = "primary",
	disabled = false,
}: {
	label: string;
	onPress: () => void;
	variant?: "primary" | "secondary" | "danger";
	disabled?: boolean;
}) {
	return (
		<Pressable
			disabled={disabled}
			onPress={onPress}
			style={[
				styles.actionButton,
				styles[`${variant}Button`],
				disabled ? styles.disabledButton : null,
			]}
		>
			<Text style={styles.actionButtonText}>{label}</Text>
		</Pressable>
	);
}

function optionalText(value: string) {
	const trimmed = value.trim();
	return trimmed.length > 0 ? trimmed : undefined;
}

function parseDate(value: string) {
	const trimmed = value.trim();
	if (trimmed.length === 0) {
		return undefined;
	}

	const timestamp = new Date(`${trimmed}T00:00:00`).getTime();
	return Number.isNaN(timestamp) ? undefined : timestamp;
}

function parseTags(value: string) {
	const tags = value
		.split(",")
		.map((tag) => tag.trim())
		.filter((tag) => tag.length > 0);

	return tags.length > 0 ? tags : undefined;
}

function formatDateInput(value: number | undefined) {
	if (value === undefined) {
		return "";
	}

	return new Date(value).toISOString().slice(0, 10);
}

function formatMeta(
	doDate: number | undefined,
	dueDate: number | undefined,
	significance: Significance,
) {
	const parts = [`${significance}`];
	if (doDate !== undefined) {
		parts.push(`do ${formatShortDate(doDate)}`);
	}
	if (dueDate !== undefined) {
		parts.push(`due ${formatShortDate(dueDate)}`);
	}

	return parts.join(" · ");
}

function formatShortDate(value: number) {
	return new Intl.DateTimeFormat(undefined, {
		month: "short",
		day: "numeric",
	}).format(new Date(value));
}

const styles = StyleSheet.create({
	scrollView: {
		flex: 1,
	},
	content: {
		paddingHorizontal: 20,
		paddingTop: 28,
		paddingBottom: 32,
		gap: 16,
	},
	heading: {
		fontSize: 28,
		fontWeight: "700",
	},
	card: {
		borderWidth: 1,
		borderRadius: 16,
		padding: 16,
		gap: 10,
	},
	cardTitle: {
		fontSize: 18,
		fontWeight: "700",
	},
	input: {
		borderWidth: 1,
		borderRadius: 12,
		paddingHorizontal: 12,
		paddingVertical: 10,
		fontSize: 16,
	},
	notesInput: {
		minHeight: 72,
		textAlignVertical: "top",
	},
	dateRow: {
		flexDirection: "row",
		gap: 8,
	},
	dateInput: {
		flex: 1,
	},
	segmentRow: {
		flexDirection: "row",
		flexWrap: "wrap",
		gap: 8,
	},
	segmentButton: {
		borderRadius: 999,
		borderWidth: 1,
		borderColor: "#6b7280",
		paddingHorizontal: 12,
		paddingVertical: 8,
	},
	segmentButtonActive: {
		backgroundColor: "#2563eb",
		borderColor: "#2563eb",
	},
	segmentText: {
		color: "#6b7280",
		fontWeight: "600",
		textTransform: "capitalize",
	},
	segmentTextActive: {
		color: "#ffffff",
		fontWeight: "700",
		textTransform: "capitalize",
	},
	actionRow: {
		flexDirection: "row",
		flexWrap: "wrap",
		gap: 8,
	},
	actionButton: {
		borderRadius: 12,
		paddingHorizontal: 14,
		paddingVertical: 10,
	},
	primaryButton: {
		backgroundColor: "#2563eb",
	},
	secondaryButton: {
		backgroundColor: "#4b5563",
	},
	dangerButton: {
		backgroundColor: "#dc2626",
	},
	disabledButton: {
		opacity: 0.4,
	},
	actionButtonText: {
		color: "#ffffff",
		fontWeight: "700",
	},
	taskTitle: {
		fontSize: 18,
		fontWeight: "700",
	},
	taskNotes: {
		fontSize: 14,
		opacity: 0.75,
	},
	metaText: {
		fontSize: 12,
		opacity: 0.65,
		textTransform: "capitalize",
	},
	mutedText: {
		opacity: 0.7,
	},
});
