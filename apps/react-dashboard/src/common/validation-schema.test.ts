import { describe, expect, it } from "vitest";
import { z } from "zod";

import {
	createRequiredSortSchema,
	createSortSchema,
	createTableSchema,
	dateRangeSchema,
	numberRangeSchema,
} from "./validation-schema";

describe("validation-schema", () => {
	describe("createSortSchema", () => {
		it("accepts missing fields (all optional)", () => {
			const schema = createSortSchema(["id", "name"] as const);
			expect(schema.parse({})).toEqual({});
		});

		it("accepts valid sortBy and sortOrder", () => {
			const schema = createSortSchema(["id", "name"] as const);
			expect(schema.parse({ sortBy: "name", sortOrder: "asc" })).toEqual({
				sortBy: "name",
				sortOrder: "asc",
			});
		});

		it("rejects invalid sortBy", () => {
			const schema = createSortSchema(["id", "name"] as const);
			const res = schema.safeParse({ sortBy: "nope" });
			expect(res.success).toBe(false);
		});
	});

	describe("createRequiredSortSchema", () => {
		it("requires sortBy", () => {
			const schema = createRequiredSortSchema(["id", "name"] as const);
			const res = schema.safeParse({});
			expect(res.success).toBe(false);
		});

		it("allows sortOrder to be omitted", () => {
			const schema = createRequiredSortSchema(["id", "name"] as const);
			expect(schema.parse({ sortBy: "id" })).toEqual({ sortBy: "id" });
		});
	});

	describe("createTableSchema", () => {
		it("defaults page and pageSize (and catches invalid)", () => {
			const schema = createTableSchema();
			expect(schema.parse({})).toEqual({ page: 1, pageSize: 15 });
			expect(schema.parse({ page: "0", pageSize: "0" })).toEqual({
				page: 1,
				pageSize: 15,
			});
			expect(schema.parse({ page: "abc", pageSize: "abc" })).toEqual({
				page: 1,
				pageSize: 15,
			});
		});

		it("uses provided default pageSize", () => {
			const schema = createTableSchema(50);
			expect(schema.parse({})).toEqual({ page: 1, pageSize: 50 });
			expect(schema.parse({ pageSize: "0" })).toEqual({ page: 1, pageSize: 50 });
		});

		it("coerces valid page and pageSize", () => {
			const schema = createTableSchema();
			expect(schema.parse({ page: "2", pageSize: "25" })).toEqual({
				page: 2,
				pageSize: 25,
			});
		});

		it("coerces search to string when provided", () => {
			const schema = createTableSchema();
			expect(schema.parse({ search: 123 })).toEqual({
				page: 1,
				pageSize: 15,
				search: "123",
			});
		});
	});

	describe("dateRangeSchema", () => {
		it("defaults invalid inputs to undefined", () => {
			expect(dateRangeSchema.parse({})).toEqual({ from: undefined, to: undefined });
			expect(dateRangeSchema.parse({ from: 123, to: 456 })).toEqual({
				from: undefined,
				to: undefined,
			});
		});

		it("accepts strings", () => {
			expect(dateRangeSchema.parse({ from: "2026-01-01", to: "2026-12-31" })).toEqual({
				from: "2026-01-01",
				to: "2026-12-31",
			});
		});
	});

	describe("numberRangeSchema", () => {
		it("coerces numbers and allows missing", () => {
			expect(numberRangeSchema.parse({})).toEqual({});
			expect(numberRangeSchema.parse({ min: "1", max: "2" })).toEqual({
				min: 1,
				max: 2,
			});
		});

		it("fails for non-coercible numbers (edge case)", () => {
			const res = numberRangeSchema.safeParse({ min: "nope" });
			expect(res.success).toBe(false);
			if (!res.success) {
				expect(res.error).toBeInstanceOf(z.ZodError);
			}
		});
	});
});

