import { api } from "@taskmaster/backend/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";

import { Container } from "@/components/container";
import { DatePickerSheet } from "@/components/tasks/date-picker-sheet";
import { SegmentButton } from "@/components/tasks/task-buttons";
import { TaskCard } from "@/components/tasks/task-card";
import { TaskForm } from "@/components/tasks/task-form";
import {
	type DateField,
	type ListScope,
	type Task,
	type TaskFormPayload,
	type TaskFormState,
	type TaskId,
	emptyTaskForm,
	listScopes,
} from "@/components/tasks/types";
import { NAV_THEME } from "@/lib/constants";
import { useColorScheme } from "@/lib/use-color-scheme";

export default function TasksScreen() {
	const { colorScheme } = useColorScheme();
	const theme = colorScheme === "dark" ? NAV_THEME.dark : NAV_THEME.light;
	const [scope, setScope] = useState<ListScope>("all");
	const [form, setForm] = useState<TaskFormState>(emptyTaskForm);
	const [activeDateField, setActiveDateField] = useState<DateField | null>(
		null,
	);
	const [editingTaskId, setEditingTaskId] = useState<TaskId | null>(null);
	const tasks = useQuery(api.tasks.list, { scope });
	const createTask = useMutation(api.tasks.create);
	const updateTask = useMutation(api.tasks.update);
	const setCompleted = useMutation(api.tasks.setCompleted);
	const removeTask = useMutation(api.tasks.remove);

	const resetForm = () => {
		setForm(emptyTaskForm);
		setEditingTaskId(null);
	};

	const submitTask = async () => {
		const payload = buildTaskPayload(form);
		if (!payload) {
			return;
		}

		if (editingTaskId) {
			await updateTask({ taskId: editingTaskId, ...payload });
		} else {
			await createTask(payload);
		}

		resetForm();
	};

	const editTask = (task: Task) => {
		setEditingTaskId(task._id);
		setForm({
			title: task.title,
			notes: task.notes ?? "",
			dueDate: task.dueDate,
			doDate: task.doDate,
			tags: task.tags?.join(", ") ?? "",
			significance: task.significance,
		});
	};

	return (
		<Container>
			<ScrollView style={styles.scrollView} contentInsetAdjustmentBehavior="never">
				<View style={styles.content}>
					<Text style={[styles.heading, { color: theme.text }]}>Tasks</Text>

					<TaskForm
						form={form}
						isEditing={editingTaskId !== null}
						theme={theme}
						onChange={setForm}
						onSubmit={submitTask}
						onCancel={resetForm}
						onOpenDatePicker={setActiveDateField}
					/>

					<View style={styles.segmentRow}>
						{listScopes.map((value) => (
							<SegmentButton
								key={value}
								label={value}
								active={scope === value}
								onPress={() => setScope(value)}
							/>
						))}
					</View>

					<TaskList
						tasks={tasks}
						scope={scope}
						theme={theme}
						onToggleCompleted={(task) =>
							setCompleted({
								taskId: task._id,
								completed: task.completedAt === undefined,
							})
						}
						onEdit={editTask}
						onDelete={(task) => removeTask({ taskId: task._id })}
					/>
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

function TaskList({
	tasks,
	scope,
	theme,
	onToggleCompleted,
	onEdit,
	onDelete,
}: {
	tasks: Task[] | undefined;
	scope: ListScope;
	theme: {
		border: string;
		card: string;
		text: string;
	};
	onToggleCompleted: (task: Task) => void;
	onEdit: (task: Task) => void;
	onDelete: (task: Task) => void;
}) {
	if (tasks === undefined) {
		return <Text style={[styles.mutedText, { color: theme.text }]}>Loading tasks...</Text>;
	}

	if (tasks.length === 0) {
		return (
			<Text style={[styles.mutedText, { color: theme.text }]}>
				No {scope === "all" ? "" : scope} tasks yet.
			</Text>
		);
	}

	return tasks.map((task) => (
		<TaskCard
			key={task._id}
			task={task}
			theme={theme}
			onToggleCompleted={onToggleCompleted}
			onEdit={onEdit}
			onDelete={onDelete}
		/>
	));
}

function buildTaskPayload(form: TaskFormState): TaskFormPayload | null {
	const title = form.title.trim();
	if (title.length === 0) {
		return null;
	}

	return {
		title,
		notes: optionalText(form.notes),
		dueDate: form.dueDate,
		doDate: form.doDate,
		tags: parseTags(form.tags),
		significance: form.significance,
	};
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
	segmentRow: {
		flexDirection: "row",
		flexWrap: "wrap",
		gap: 8,
	},
	mutedText: {
		opacity: 0.7,
	},
});
