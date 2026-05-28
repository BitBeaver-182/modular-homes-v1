import { describe, expect, it } from "vitest";

import { endOfDayLocal, formatYmdLocal, parseYmdLocal, startOfDayLocal } from "./date-ymd";

describe("date-ymd", () => {
	describe("parseYmdLocal", () => {
		it("returns null for empty or malformed input", () => {
			expect(parseYmdLocal("")).toBeNull();
			expect(parseYmdLocal("2026-01")).toBeNull();
			expect(parseYmdLocal("2026-01-01-01")).toBeNull();
			expect(parseYmdLocal("not-a-date")).toBeNull();
			expect(parseYmdLocal("2026-aa-01")).toBeNull();
			expect(parseYmdLocal("2026-NaN-01")).toBeNull();
		});

		it("returns a Date for well-formed Y-M-D", () => {
			const d = parseYmdLocal("2026-04-24");
			expect(d).toBeInstanceOf(Date);
			expect(d?.getFullYear()).toBe(2026);
			expect(d?.getMonth()).toBe(3);
			expect(d?.getDate()).toBe(24);
		});

		it("accepts non-zero-padded month/day (edge case)", () => {
			const d = parseYmdLocal("2026-4-2");
			expect(d).toBeInstanceOf(Date);
			expect(d?.getFullYear()).toBe(2026);
			expect(d?.getMonth()).toBe(3);
			expect(d?.getDate()).toBe(2);
		});

		it("normalizes out-of-range dates per JS Date behavior (edge case)", () => {
			// JS Date will normalize Feb 30 -> Mar 2 (non-leap year)
			const d = parseYmdLocal("2026-02-30");
			expect(d).toBeInstanceOf(Date);
			expect(d?.getFullYear()).toBe(2026);
			expect(d?.getMonth()).toBe(2);
			expect(d?.getDate()).toBe(2);
		});

		it("returns null for out-of-range years that produce Invalid Date (edge case)", () => {
			expect(parseYmdLocal("1000000-01-01")).toBeNull();
		});
	});

	describe("formatYmdLocal", () => {
		it("formats as YYYY-MM-DD with zero padding", () => {
			const d = new Date(2026, 0, 5);
			expect(formatYmdLocal(d)).toBe("2026-01-05");
		});
	});

	describe("startOfDayLocal / endOfDayLocal", () => {
		it("returns boundaries of the local day", () => {
			const d = new Date(2026, 3, 24, 12, 34, 56, 789);
			const start = startOfDayLocal(d);
			const end = endOfDayLocal(d);

			expect(start.getFullYear()).toBe(2026);
			expect(start.getMonth()).toBe(3);
			expect(start.getDate()).toBe(24);
			expect(start.getHours()).toBe(0);
			expect(start.getMinutes()).toBe(0);
			expect(start.getSeconds()).toBe(0);
			expect(start.getMilliseconds()).toBe(0);

			expect(end.getFullYear()).toBe(2026);
			expect(end.getMonth()).toBe(3);
			expect(end.getDate()).toBe(24);
			expect(end.getHours()).toBe(23);
			expect(end.getMinutes()).toBe(59);
			expect(end.getSeconds()).toBe(59);
			expect(end.getMilliseconds()).toBe(999);
		});
	});
});

