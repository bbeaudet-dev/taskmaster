import type { Doc } from "../_generated/dataModel";

type TaskDoc = Doc<"tasks">;
type Recurrence = NonNullable<TaskDoc["recurrence"]>;

const oneDayMs = 24 * 60 * 60 * 1000;

export function getNextRecurringDates(task: TaskDoc, completedAt: number) {
	if (!task.recurrence) {
		throw new Error("Task is not recurring");
	}

	const recurrence = task.recurrence;
	const anchor = getRecurrenceAnchor(task, completedAt);
	const fallbackNextDate = getNextOccurrence(recurrence, anchor, completedAt);
	const shouldCreateDoDate = task.dueDate === undefined && task.doDate === undefined;

	return {
		dueDate:
			task.dueDate === undefined
				? undefined
				: getNextOccurrence(recurrence, task.dueDate, completedAt),
		doDate:
			task.doDate === undefined
				? shouldCreateDoDate
					? fallbackNextDate
					: undefined
				: getNextOccurrence(recurrence, task.doDate, completedAt),
	};
}

function getRecurrenceAnchor(task: TaskDoc, completedAt: number) {
	if (task.recurrence?.basis === "completion") {
		return completedAt;
	}

	return task.doDate ?? task.dueDate ?? completedAt;
}

function getNextOccurrence(
	recurrence: Recurrence,
	anchor: number,
	completedAt: number,
) {
	const basisAnchor = recurrence.basis === "completion" ? completedAt : anchor;
	const nextDate = getNextDateAfter(startOfDay(basisAnchor), recurrence, completedAt);

	if (recurrence.until !== undefined && nextDate > endOfDay(recurrence.until)) {
		return undefined;
	}

	return nextDate;
}

function getNextDateAfter(
	anchor: number,
	recurrence: Recurrence,
	completedAt: number,
) {
	if (recurrence.frequency === "weekly" && recurrence.daysOfWeek?.length) {
		return getNextWeeklyDate(anchor, recurrence, completedAt);
	}

	const minimumNextDate = startOfDay(completedAt) + oneDayMs;
	let nextDate = addInterval(anchor, recurrence);
	while (nextDate < minimumNextDate) {
		nextDate = addInterval(nextDate, recurrence);
	}

	return nextDate;
}

function getNextWeeklyDate(
	anchor: number,
	recurrence: Recurrence,
	completedAt: number,
) {
	const selectedDays = Array.from(new Set(recurrence.daysOfWeek)).sort(
		(left, right) => left - right,
	);
	const minimumNextDate = startOfDay(completedAt) + oneDayMs;
	let weekStart = startOfWeek(anchor);

	while (true) {
		for (const dayOfWeek of selectedDays) {
			const candidate = weekStart + dayOfWeek * oneDayMs;
			if (candidate >= minimumNextDate) {
				return candidate;
			}
		}
		weekStart = addWeeks(weekStart, recurrence.interval);
	}
}

function addInterval(date: number, recurrence: Recurrence) {
	switch (recurrence.frequency) {
		case "daily":
			return addDays(date, recurrence.interval);
		case "weekly":
			return addWeeks(date, recurrence.interval);
		case "monthly":
			return addMonths(date, recurrence.interval);
		case "yearly":
			return addYears(date, recurrence.interval);
	}
}

function startOfDay(timestamp: number) {
	const date = new Date(timestamp);
	return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

function endOfDay(timestamp: number) {
	return startOfDay(timestamp) + oneDayMs - 1;
}

function startOfWeek(timestamp: number) {
	const date = new Date(startOfDay(timestamp));
	return addDays(date.getTime(), -date.getDay());
}

function addDays(timestamp: number, days: number) {
	const date = new Date(timestamp);
	date.setDate(date.getDate() + days);
	return date.getTime();
}

function addWeeks(timestamp: number, weeks: number) {
	return addDays(timestamp, weeks * 7);
}

function addMonths(timestamp: number, months: number) {
	const date = new Date(timestamp);
	date.setMonth(date.getMonth() + months);
	return date.getTime();
}

function addYears(timestamp: number, years: number) {
	const date = new Date(timestamp);
	date.setFullYear(date.getFullYear() + years);
	return date.getTime();
}
