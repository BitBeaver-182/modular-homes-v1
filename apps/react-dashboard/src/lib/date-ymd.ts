/** Local-calendar YYYY-MM-DD parsing and formatting (not tied to any domain). */

export function parseYmdLocal(ymd: string): Date | null {
	if (!ymd) {
		return null;
	}

	const parts = ymd.split("-").map(Number);
	if (parts.length !== 3) {
		return null;
	}

	const [y, m, d] = parts as [number, number, number];
	if (!Number.isFinite(y) || !Number.isFinite(m) || !Number.isFinite(d)) {
		return null;
	}

	const dt = new Date(y, m - 1, d);
	return Number.isNaN(dt.getTime()) ? null : dt;
}

/** Local calendar date as YYYY-MM-DD (for form fields). */
export function formatYmdLocal(d: Date): string {
	const y = d.getFullYear();
	const m = String(d.getMonth() + 1).padStart(2, "0");
	const day = String(d.getDate()).padStart(2, "0");
	return `${y}-${m}-${day}`;
}

export function startOfDayLocal(d: Date): Date {
	return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
}

export function endOfDayLocal(d: Date): Date {
	return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
}
