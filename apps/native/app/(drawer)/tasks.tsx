import { Ionicons } from "@expo/vector-icons";
import { api } from "@taskmaster/backend/convex/_generated/api";
import type { Id } from "@taskmaster/backend/convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import { useEffect, useState } from "react";
import {
	Modal,
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
	dueDate: number | undefined;
	doDate: number | undefined;
	tags: string;
	significance: Significance;
};

type DateField = "doDate" | "dueDate";

const emptyForm: FormState = {
	title: "",
	notes: "",
	dueDate: undefined,
	doDate: undefined,
	tags: "",
	significance: "normal",
};

const scopes: ListScope[] = ["open", "completed", "all"];
const significances: Significance[] = ["important", "normal", "someday"];

export default function TasksScreen() {
	const { colorScheme } = useColorScheme();
	const theme = colorScheme === "dark" ? NAV_THEME.dark : NAV_THEME.light;
	const [scope, setScope] = useState<ListScope>("all");
	const [form, setForm] = useState<FormState>(emptyForm);
	const [activeDateField, setActiveDateField] = useState<DateField | null>(
		null,
	);
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
			dueDate: form.dueDate,
			doDate: form.doDate,
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
							<DateFieldButton
								label="Do date"
								value={form.doDate}
								borderColor={theme.border}
								backgroundColor={theme.background}
								textColor={theme.text}
								onPress={() => setActiveDateField("doDate")}
							/>
							<DateFieldButton
								label="Due date"
								value={form.dueDate}
								borderColor={theme.border}
								backgroundColor={theme.background}
								textColor={theme.text}
								onPress={() => setActiveDateField("dueDate")}
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
								<View style={styles.taskHeader}>
									<Pressable
										style={styles.taskTitleButton}
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
									<View style={styles.taskIconActions}>
										<IconButton
											name="pencil-outline"
											label="Edit task"
											color={theme.text}
											onPress={() => {
												setEditingTaskId(task._id);
												setForm({
													title: task.title,
													notes: task.notes ?? "",
													dueDate: task.dueDate,
													doDate: task.doDate,
													tags: task.tags?.join(", ") ?? "",
													significance: task.significance,
												});
											}}
										/>
										<IconButton
											name="trash-outline"
											label="Delete task"
											color="#dc2626"
											onPress={() => removeTask({ taskId: task._id })}
										/>
									</View>
								</View>
								{task.notes ? (
									<Text style={[styles.taskNotes, { color: theme.text }]}>
										{task.notes}
									</Text>
								) : null}
								<TaskDates doDate={task.doDate} dueDate={task.dueDate} />
							</View>
						))
					)}
				</View>
			</ScrollView>
			<DatePickerSheet
				field={activeDateField}
				value={activeDateField ? form[activeDateField] : undefined}
				onClose={() => setActiveDateField(null)}
				onSelect={(date) => {
					if (!activeDateField) {
						return;
					}

					setForm((current) => ({
						...current,
						[activeDateField]: date,
					}));
					setActiveDateField(null);
				}}
			/>
		</Container>
	);
}

function DateFieldButton({
	label,
	value,
	borderColor,
	backgroundColor,
	textColor,
	onPress,
}: {
	label: string;
	value: number | undefined;
	borderColor: string;
	backgroundColor: string;
	textColor: string;
	onPress: () => void;
}) {
	return (
		<Pressable
			accessibilityRole="button"
			onPress={onPress}
			style={[
				styles.dateFieldButton,
				{ borderColor, backgroundColor },
			]}
		>
			<Text style={[styles.dateFieldLabel, { color: textColor }]}>{label}</Text>
			<Text
				numberOfLines={1}
				style={[
					styles.dateFieldValue,
					{ color: value === undefined ? textColor + "80" : textColor },
				]}
			>
				{value === undefined ? "Pick a date" : formatDateField(value)}
			</Text>
		</Pressable>
	);
}

function DatePickerSheet({
	field,
	value,
	onClose,
	onSelect,
}: {
	field: DateField | null;
	value: number | undefined;
	onClose: () => void;
	onSelect: (date: number | undefined) => void;
}) {
	const [visibleMonth, setVisibleMonth] = useState(() =>
		startOfMonth(new Date(value ?? Date.now())),
	);
	const title = field === "dueDate" ? "Due date" : "Do date";
	const selectedDay =
		value === undefined ? undefined : startOfDay(new Date(value)).getTime();
	const today = startOfToday().getTime();

	useEffect(() => {
		if (field !== null) {
			setVisibleMonth(startOfMonth(new Date(value ?? Date.now())));
		}
	}, [field, value]);

	return (
		<Modal
			animationType="slide"
			transparent
			visible={field !== null}
			onRequestClose={onClose}
		>
			<Pressable style={styles.sheetBackdrop} onPress={onClose}>
				<Pressable style={styles.sheet} onPress={(event) => event.stopPropagation()}>
					<View style={styles.sheetHandle} />
					<View style={styles.sheetHeader}>
						<Pressable
							accessibilityLabel="Previous year"
							accessibilityRole="button"
							onPress={() => setVisibleMonth((month) => addYears(month, -1))}
							style={styles.iconButton}
						>
							<Ionicons name="play-back-outline" size={21} color="#111827" />
						</Pressable>
						<Pressable
							accessibilityLabel="Previous month"
							accessibilityRole="button"
							onPress={() => setVisibleMonth((month) => addMonths(month, -1))}
							style={styles.iconButton}
						>
							<Ionicons name="chevron-back-outline" size={24} color="#111827" />
						</Pressable>
						<View style={styles.sheetTitleGroup}>
							<Text style={styles.sheetTitle}>{title}</Text>
							<Text style={styles.sheetSubtitle}>
								{formatCalendarMonth(visibleMonth)}
							</Text>
						</View>
						<Pressable
							accessibilityLabel="Next month"
							accessibilityRole="button"
							onPress={() => setVisibleMonth((month) => addMonths(month, 1))}
							style={styles.iconButton}
						>
							<Ionicons name="chevron-forward-outline" size={24} color="#111827" />
						</Pressable>
						<Pressable
							accessibilityLabel="Next year"
							accessibilityRole="button"
							onPress={() => setVisibleMonth((month) => addYears(month, 1))}
							style={styles.iconButton}
						>
							<Ionicons name="play-forward-outline" size={21} color="#111827" />
						</Pressable>
						<Pressable onPress={onClose} style={styles.iconButton}>
							<Ionicons name="close-outline" size={24} color="#111827" />
						</Pressable>
					</View>
					<View style={styles.weekdayRow}>
						{["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
							<Text key={day} style={styles.weekdayText}>
								{day}
							</Text>
						))}
					</View>
					<View style={styles.calendarGrid}>
						{getCalendarDays(visibleMonth).map((date) => {
							const day = date.getTime();
							const isCurrentMonth =
								date.getMonth() === visibleMonth.getMonth() &&
								date.getFullYear() === visibleMonth.getFullYear();
							const isSelected = selectedDay === day;
							const isToday = today === day;

							return (
								<Pressable
									key={day}
									accessibilityLabel={formatDateField(day)}
									accessibilityRole="button"
									onPress={() => onSelect(day)}
									style={[
										styles.calendarDay,
										isSelected ? styles.calendarDaySelected : null,
										isToday && !isSelected ? styles.calendarDayToday : null,
									]}
								>
									<Text
										style={[
											styles.calendarDayText,
											!isCurrentMonth ? styles.calendarDayOutsideText : null,
											isSelected ? styles.calendarDaySelectedText : null,
										]}
									>
										{date.getDate()}
									</Text>
								</Pressable>
							);
						})}
					</View>
					<View style={styles.sheetActions}>
						<Pressable onPress={() => onSelect(today)} style={styles.todayButton}>
							<Text style={styles.todayButtonText}>Today</Text>
						</Pressable>
						<Pressable
							onPress={() => onSelect(undefined)}
							style={styles.clearDateButton}
						>
							<Text style={styles.clearDateText}>Clear date</Text>
						</Pressable>
					</View>
				</Pressable>
			</Pressable>
		</Modal>
	);
}

function IconButton({
	name,
	label,
	color,
	onPress,
}: {
	name: keyof typeof Ionicons.glyphMap;
	label: string;
	color: string;
	onPress: () => void;
}) {
	return (
		<Pressable
			accessibilityLabel={label}
			accessibilityRole="button"
			onPress={onPress}
			style={styles.iconButton}
		>
			<Ionicons name={name} size={21} color={color} />
		</Pressable>
	);
}

function TaskDates({
	doDate,
	dueDate,
}: {
	doDate: number | undefined;
	dueDate: number | undefined;
}) {
	if (doDate === undefined && dueDate === undefined) {
		return null;
	}

	return (
		<Text style={styles.metaText}>
			{formatTaskDateMeta(doDate, dueDate)}
		</Text>
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

function parseTags(value: string) {
	const tags = value
		.split(",")
		.map((tag) => tag.trim())
		.filter((tag) => tag.length > 0);

	return tags.length > 0 ? tags : undefined;
}

function formatTaskDate(value: number) {
	const date = new Date(value);
	const today = startOfToday();
	const target = startOfDay(date);
	const dayDifference = Math.round(
		(target.getTime() - today.getTime()) / (24 * 60 * 60 * 1000),
	);

	if (dayDifference === 0) {
		return "Today";
	}
	if (dayDifference === 1) {
		return "Tomorrow";
	}
	if (dayDifference === -1) {
		return "Yesterday";
	}

	return new Intl.DateTimeFormat(undefined, {
		month: "short",
		day: "numeric",
		year: date.getFullYear() === today.getFullYear() ? undefined : "numeric",
	}).format(date);
}

function formatTaskDateMeta(
	doDate: number | undefined,
	dueDate: number | undefined,
) {
	const parts = [];
	if (doDate !== undefined) {
		parts.push(`Do ${formatTaskDate(doDate)}`);
	}
	if (dueDate !== undefined) {
		parts.push(`Due ${formatTaskDate(dueDate)}`);
	}

	return parts.join(" · ");
}

function formatDateField(value: number) {
	const date = new Date(value);
	return new Intl.DateTimeFormat(undefined, {
		weekday: "short",
		month: "short",
		day: "numeric",
		year: date.getFullYear() === new Date().getFullYear() ? undefined : "numeric",
	}).format(date);
}

function formatCalendarMonth(value: Date) {
	return new Intl.DateTimeFormat(undefined, {
		month: "long",
		year: "numeric",
	}).format(value);
}

function getCalendarDays(month: Date) {
	const firstDay = startOfMonth(month);
	const start = addDays(firstDay, -firstDay.getDay());

	return Array.from({ length: 42 }, (_, offset) =>
		startOfDay(addDays(start, offset)),
	);
}

function addDays(date: Date, days: number) {
	const next = new Date(date);
	next.setDate(date.getDate() + days);
	return next;
}

function addMonths(date: Date, months: number) {
	return new Date(date.getFullYear(), date.getMonth() + months, 1);
}

function addYears(date: Date, years: number) {
	return new Date(date.getFullYear() + years, date.getMonth(), 1);
}

function startOfMonth(date: Date) {
	return new Date(date.getFullYear(), date.getMonth(), 1);
}

function startOfToday() {
	return startOfDay(new Date());
}

function startOfDay(date: Date) {
	return new Date(date.getFullYear(), date.getMonth(), date.getDate());
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
		flexWrap: "wrap",
		gap: 8,
	},
	dateFieldButton: {
		borderWidth: 1,
		borderRadius: 12,
		flex: 1,
		minWidth: 140,
		paddingHorizontal: 12,
		paddingVertical: 10,
	},
	dateFieldLabel: {
		fontSize: 12,
		fontWeight: "700",
		opacity: 0.7,
		textTransform: "uppercase",
	},
	dateFieldValue: {
		fontSize: 16,
		fontWeight: "600",
		marginTop: 2,
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
	taskHeader: {
		alignItems: "flex-start",
		flexDirection: "row",
		gap: 10,
	},
	taskTitleButton: {
		flex: 1,
	},
	taskIconActions: {
		alignItems: "center",
		flexDirection: "row",
		gap: 4,
		marginLeft: "auto",
	},
	iconButton: {
		borderRadius: 999,
		padding: 6,
	},
	taskNotes: {
		fontSize: 14,
		opacity: 0.75,
	},
	metaText: {
		color: "#6b7280",
		fontSize: 12,
		fontWeight: "600",
	},
	sheetBackdrop: {
		backgroundColor: "rgba(0, 0, 0, 0.35)",
		flex: 1,
		justifyContent: "flex-end",
	},
	sheet: {
		backgroundColor: "#ffffff",
		borderTopLeftRadius: 24,
		borderTopRightRadius: 24,
		paddingBottom: 28,
		paddingHorizontal: 20,
		paddingTop: 10,
	},
	sheetHandle: {
		alignSelf: "center",
		backgroundColor: "#d1d5db",
		borderRadius: 999,
		height: 4,
		marginBottom: 14,
		width: 44,
	},
	sheetHeader: {
		alignItems: "center",
		flexDirection: "row",
		gap: 4,
		marginBottom: 12,
	},
	sheetTitleGroup: {
		alignItems: "center",
		flex: 1,
	},
	sheetTitle: {
		color: "#111827",
		fontSize: 14,
		fontWeight: "800",
		textTransform: "uppercase",
	},
	sheetSubtitle: {
		color: "#111827",
		fontSize: 19,
		fontWeight: "800",
		marginTop: 2,
	},
	weekdayRow: {
		flexDirection: "row",
		marginBottom: 6,
	},
	weekdayText: {
		color: "#6b7280",
		flex: 1,
		fontSize: 12,
		fontWeight: "800",
		textAlign: "center",
	},
	calendarGrid: {
		flexDirection: "row",
		flexWrap: "wrap",
	},
	calendarDay: {
		alignItems: "center",
		aspectRatio: 1,
		borderRadius: 999,
		justifyContent: "center",
		width: "14.2857%",
	},
	calendarDayToday: {
		borderColor: "#2563eb",
		borderWidth: 1,
	},
	calendarDaySelected: {
		backgroundColor: "#2563eb",
	},
	calendarDayText: {
		color: "#111827",
		fontSize: 16,
		fontWeight: "800",
	},
	calendarDayOutsideText: {
		color: "#d1d5db",
	},
	calendarDaySelectedText: {
		color: "#ffffff",
	},
	sheetActions: {
		flexDirection: "row",
		gap: 8,
		marginTop: 12,
	},
	todayButton: {
		alignItems: "center",
		backgroundColor: "#f3f4f6",
		borderRadius: 12,
		flex: 1,
		paddingVertical: 12,
	},
	todayButtonText: {
		color: "#111827",
		fontWeight: "800",
	},
	clearDateButton: {
		alignItems: "center",
		borderRadius: 12,
		flex: 1,
		paddingVertical: 12,
	},
	clearDateText: {
		color: "#dc2626",
		fontWeight: "800",
	},
	mutedText: {
		opacity: 0.7,
	},
});
