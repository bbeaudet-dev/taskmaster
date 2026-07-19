import { Pressable, StyleSheet, Text, View } from "react-native";

import { formatTaskDateMeta } from "@/lib/tasks/dates";

import { IconButton } from "./task-buttons";
import type { Task } from "./types";

type TaskCardProps = {
	task: Task;
	theme: {
		border: string;
		card: string;
		text: string;
	};
	onToggleCompleted: (task: Task) => void;
	onEdit: (task: Task) => void;
	onDelete: (task: Task) => void;
};

export function TaskCard({
	task,
	theme,
	onToggleCompleted,
	onEdit,
	onDelete,
}: TaskCardProps) {
	return (
		<View
			style={[
				styles.card,
				{
					backgroundColor: theme.card,
					borderColor: task.completedAt ? "#10b981" : theme.border,
				},
			]}
		>
			<View style={styles.header}>
				<Pressable
					style={styles.titleButton}
					onPress={() => onToggleCompleted(task)}
				>
					<Text
						style={[
							styles.title,
							{
								color: theme.text,
								textDecorationLine: task.completedAt ? "line-through" : "none",
							},
						]}
					>
						{task.completedAt ? "✓ " : "○ "}
						{task.title}
					</Text>
				</Pressable>
				<View style={styles.iconActions}>
					<IconButton
						name="pencil-outline"
						label="Edit task"
						color={theme.text}
						onPress={() => onEdit(task)}
					/>
					<IconButton
						name="trash-outline"
						label="Delete task"
						color="#dc2626"
						onPress={() => onDelete(task)}
					/>
				</View>
			</View>
			{task.notes ? (
				<Text style={[styles.notes, { color: theme.text }]}>{task.notes}</Text>
			) : null}
			<TaskDates doDate={task.doDate} dueDate={task.dueDate} />
		</View>
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

	return <Text style={styles.meta}>{formatTaskDateMeta(doDate, dueDate)}</Text>;
}

const styles = StyleSheet.create({
	card: {
		borderWidth: 1,
		borderRadius: 16,
		padding: 16,
		gap: 10,
	},
	header: {
		alignItems: "flex-start",
		flexDirection: "row",
		gap: 10,
	},
	titleButton: {
		flex: 1,
	},
	title: {
		fontSize: 18,
		fontWeight: "700",
	},
	iconActions: {
		alignItems: "center",
		flexDirection: "row",
		gap: 4,
		marginLeft: "auto",
	},
	notes: {
		fontSize: 14,
		opacity: 0.75,
	},
	meta: {
		color: "#6b7280",
		fontSize: 12,
		fontWeight: "600",
	},
});
