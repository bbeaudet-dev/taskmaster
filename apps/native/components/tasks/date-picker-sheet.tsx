import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";

import {
	addMonths,
	addYears,
	formatCalendarMonth,
	formatDateField,
	getCalendarDays,
	startOfDay,
	startOfMonth,
	startOfToday,
} from "@/lib/tasks/dates";

import type { DateField } from "./types";

type DatePickerSheetProps = {
	field: DateField | null;
	value: number | undefined;
	onClose: () => void;
	onSelect: (date: number | undefined) => void;
};

export function DatePickerSheet({
	field,
	value,
	onClose,
	onSelect,
}: DatePickerSheetProps) {
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
			<Pressable style={styles.backdrop} onPress={onClose}>
				<Pressable style={styles.sheet} onPress={(event) => event.stopPropagation()}>
					<View style={styles.handle} />
					<View style={styles.header}>
						<CalendarNavButton
							label="Previous year"
							icon="play-back-outline"
							onPress={() => setVisibleMonth((month) => addYears(month, -1))}
						/>
						<CalendarNavButton
							label="Previous month"
							icon="chevron-back-outline"
							onPress={() => setVisibleMonth((month) => addMonths(month, -1))}
						/>
						<View style={styles.titleGroup}>
							<Text style={styles.title}>{title}</Text>
							<Text style={styles.subtitle}>
								{formatCalendarMonth(visibleMonth)}
							</Text>
						</View>
						<CalendarNavButton
							label="Next month"
							icon="chevron-forward-outline"
							onPress={() => setVisibleMonth((month) => addMonths(month, 1))}
						/>
						<CalendarNavButton
							label="Next year"
							icon="play-forward-outline"
							onPress={() => setVisibleMonth((month) => addYears(month, 1))}
						/>
						<CalendarNavButton
							label="Close date picker"
							icon="close-outline"
							onPress={onClose}
						/>
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
					<View style={styles.actions}>
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

function CalendarNavButton({
	label,
	icon,
	onPress,
}: {
	label: string;
	icon: keyof typeof Ionicons.glyphMap;
	onPress: () => void;
}) {
	return (
		<Pressable
			accessibilityLabel={label}
			accessibilityRole="button"
			onPress={onPress}
			style={styles.iconButton}
		>
			<Ionicons name={icon} size={22} color="#111827" />
		</Pressable>
	);
}

const styles = StyleSheet.create({
	backdrop: {
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
	handle: {
		alignSelf: "center",
		backgroundColor: "#d1d5db",
		borderRadius: 999,
		height: 4,
		marginBottom: 14,
		width: 44,
	},
	header: {
		alignItems: "center",
		flexDirection: "row",
		gap: 4,
		marginBottom: 12,
	},
	iconButton: {
		borderRadius: 999,
		padding: 6,
	},
	titleGroup: {
		alignItems: "center",
		flex: 1,
	},
	title: {
		color: "#111827",
		fontSize: 14,
		fontWeight: "800",
		textTransform: "uppercase",
	},
	subtitle: {
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
	actions: {
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
});
