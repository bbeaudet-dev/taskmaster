import { StyleSheet, Text, View } from "react-native";

import { ActionButton, SegmentButton } from "./task-buttons";
import type { Recurrence } from "./types";

type RecurrencePickerProps = {
	recurrence: Recurrence | undefined;
	textColor: string;
	onChange: (recurrence: Recurrence | undefined) => void;
};

const repeatFrequencies: Array<Recurrence["frequency"] | "none"> = [
	"none",
	"daily",
	"weekly",
	"monthly",
	"yearly",
];
const recurrenceBases: Recurrence["basis"][] = ["schedule", "completion"];
const weekdays = [
	{ label: "Sun", value: 0 },
	{ label: "Mon", value: 1 },
	{ label: "Tue", value: 2 },
	{ label: "Wed", value: 3 },
	{ label: "Thu", value: 4 },
	{ label: "Fri", value: 5 },
	{ label: "Sat", value: 6 },
];

export function RecurrencePicker({
	recurrence,
	textColor,
	onChange,
}: RecurrencePickerProps) {
	const updateRecurrence = (update: (recurrence: Recurrence) => Recurrence) => {
		if (!recurrence) {
			return;
		}

		onChange(update(recurrence));
	};

	return (
		<View style={styles.section}>
			<Text style={[styles.sectionLabel, { color: textColor }]}>Repeat</Text>
			<View style={styles.segmentRow}>
				{repeatFrequencies.map((frequency) => (
					<SegmentButton
						key={frequency}
						label={frequency}
						active={
							frequency === "none"
								? recurrence === undefined
								: recurrence?.frequency === frequency
						}
						onPress={() =>
							onChange(
								frequency === "none"
									? undefined
									: createDefaultRecurrence(frequency, recurrence),
							)
						}
					/>
				))}
			</View>
			{recurrence ? (
				<>
					<View style={styles.intervalRow}>
						<Text style={[styles.intervalLabel, { color: textColor }]}>
							Every {recurrence.interval} {getIntervalLabel(recurrence)}
						</Text>
						<View style={styles.intervalActions}>
							<ActionButton
								label="-"
								variant="secondary"
								disabled={recurrence.interval <= 1}
								onPress={() =>
									updateRecurrence((current) => ({
										...current,
										interval: Math.max(1, current.interval - 1),
									}))
								}
							/>
							<ActionButton
								label="+"
								variant="secondary"
								onPress={() =>
									updateRecurrence((current) => ({
										...current,
										interval: current.interval + 1,
									}))
								}
							/>
						</View>
					</View>
					<View style={styles.segmentRow}>
						{recurrenceBases.map((basis) => (
							<SegmentButton
								key={basis}
								label={basis === "schedule" ? "calendar" : "after done"}
								active={recurrence.basis === basis}
								onPress={() =>
									updateRecurrence((current) => ({
										...current,
										basis,
									}))
								}
							/>
						))}
					</View>
					{recurrence.frequency === "weekly" ? (
						<View style={styles.segmentRow}>
							{weekdays.map((weekday) => {
								const selectedDays = recurrence.daysOfWeek ?? [];
								const isSelected = selectedDays.includes(weekday.value);

								return (
									<SegmentButton
										key={weekday.value}
										label={weekday.label}
										active={isSelected}
										onPress={() =>
											updateRecurrence((current) => ({
												...current,
												daysOfWeek: toggleWeekday(
													selectedDays,
													weekday.value,
												),
											}))
										}
									/>
								);
							})}
						</View>
					) : null}
				</>
			) : null}
		</View>
	);
}

function createDefaultRecurrence(
	frequency: Recurrence["frequency"],
	current: Recurrence | undefined,
): Recurrence {
	return {
		frequency,
		interval: current?.interval ?? 1,
		basis: current?.basis ?? "schedule",
		daysOfWeek:
			frequency === "weekly"
				? current?.daysOfWeek ?? [new Date().getDay()]
				: undefined,
	};
}

function getIntervalLabel(recurrence: Recurrence) {
	const plural = recurrence.interval === 1 ? "" : "s";
	switch (recurrence.frequency) {
		case "daily":
			return `day${plural}`;
		case "weekly":
			return `week${plural}`;
		case "monthly":
			return `month${plural}`;
		case "yearly":
			return `year${plural}`;
	}
}

function toggleWeekday(selectedDays: number[], day: number) {
	if (selectedDays.includes(day)) {
		const nextDays = selectedDays.filter((selectedDay) => selectedDay !== day);
		return nextDays.length > 0 ? nextDays : [day];
	}

	return [...selectedDays, day].sort((left, right) => left - right);
}

const styles = StyleSheet.create({
	section: {
		gap: 8,
	},
	sectionLabel: {
		fontSize: 12,
		fontWeight: "700",
		opacity: 0.7,
		textTransform: "uppercase",
	},
	segmentRow: {
		flexDirection: "row",
		flexWrap: "wrap",
		gap: 8,
	},
	intervalRow: {
		alignItems: "center",
		flexDirection: "row",
		justifyContent: "space-between",
		gap: 8,
	},
	intervalLabel: {
		flex: 1,
		fontSize: 15,
		fontWeight: "600",
	},
	intervalActions: {
		flexDirection: "row",
		gap: 8,
	},
});
