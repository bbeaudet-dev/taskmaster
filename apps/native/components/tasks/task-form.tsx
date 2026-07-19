import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { formatDateField } from "@/lib/tasks/dates";

import { ActionButton, SegmentButton } from "./task-buttons";
import { RecurrencePicker } from "./recurrence-picker";
import type { DateField, TaskFormState } from "./types";

type TaskFormProps = {
	form: TaskFormState;
	isEditing: boolean;
	theme: {
		background: string;
		border: string;
		card: string;
		text: string;
	};
	onChange: (form: TaskFormState) => void;
	onSubmit: () => void;
	onCancel: () => void;
	onOpenDatePicker: (field: DateField) => void;
};

const significances = ["important", "normal", "someday"] as const;

export function TaskForm({
	form,
	isEditing,
	theme,
	onChange,
	onSubmit,
	onCancel,
	onOpenDatePicker,
}: TaskFormProps) {
	return (
		<View
			style={[
				styles.card,
				{ backgroundColor: theme.card, borderColor: theme.border },
			]}
		>
			<Text style={[styles.cardTitle, { color: theme.text }]}>
				{isEditing ? "Edit Task" : "Add Task"}
			</Text>
			<TextInput
				value={form.title}
				onChangeText={(title) => onChange({ ...form, title })}
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
				onChangeText={(notes) => onChange({ ...form, notes })}
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
					onPress={() => onOpenDatePicker("doDate")}
				/>
				<DateFieldButton
					label="Due date"
					value={form.dueDate}
					borderColor={theme.border}
					backgroundColor={theme.background}
					textColor={theme.text}
					onPress={() => onOpenDatePicker("dueDate")}
				/>
			</View>
			<TextInput
				value={form.tags}
				onChangeText={(tags) => onChange({ ...form, tags })}
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
						onPress={() => onChange({ ...form, significance: value })}
					/>
				))}
			</View>
			<RecurrencePicker
				recurrence={form.recurrence}
				textColor={theme.text}
				onChange={(recurrence) => onChange({ ...form, recurrence })}
			/>
			<View style={styles.actionRow}>
				<ActionButton
					label={isEditing ? "Save" : "Add"}
					onPress={onSubmit}
					disabled={form.title.trim().length === 0}
				/>
				{isEditing ? (
					<ActionButton label="Cancel" variant="secondary" onPress={onCancel} />
				) : null}
			</View>
		</View>
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
			style={[styles.dateFieldButton, { borderColor, backgroundColor }]}
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

const styles = StyleSheet.create({
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
	actionRow: {
		flexDirection: "row",
		flexWrap: "wrap",
		gap: 8,
	},
});
