export function formatTaskDate(value: number) {
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

export function formatTaskDateMeta(
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

export function formatDateField(value: number) {
	const date = new Date(value);
	return new Intl.DateTimeFormat(undefined, {
		weekday: "short",
		month: "short",
		day: "numeric",
		year: date.getFullYear() === new Date().getFullYear() ? undefined : "numeric",
	}).format(date);
}

export function formatCalendarMonth(value: Date) {
	return new Intl.DateTimeFormat(undefined, {
		month: "long",
		year: "numeric",
	}).format(value);
}

export function getCalendarDays(month: Date) {
	const firstDay = startOfMonth(month);
	const start = addDays(firstDay, -firstDay.getDay());

	return Array.from({ length: 42 }, (_, offset) =>
		startOfDay(addDays(start, offset)),
	);
}

export function addDays(date: Date, days: number) {
	const next = new Date(date);
	next.setDate(date.getDate() + days);
	return next;
}

export function addMonths(date: Date, months: number) {
	return new Date(date.getFullYear(), date.getMonth() + months, 1);
}

export function addYears(date: Date, years: number) {
	return new Date(date.getFullYear() + years, date.getMonth(), 1);
}

export function startOfMonth(date: Date) {
	return new Date(date.getFullYear(), date.getMonth(), 1);
}

export function startOfToday() {
	return startOfDay(new Date());
}

export function startOfDay(date: Date) {
	return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}
