import { describe, expect, it } from "vitest";

import { supplierKeys } from "./supplier-keys";

describe("supplierKeys", () => {
	it("scopes supplier list and detail keys by organization id", () => {
		const params = {
			page: 1,
			pageSize: 15,
			sortBy: "name",
			sortOrder: "asc",
		} as const;

		expect(supplierKeys.list("org-1", params)).toEqual([
			"suppliers",
			"org-1",
			"list",
			params,
		]);
		expect(supplierKeys.detail("org-1", "supplier-1")).toEqual([
			"suppliers",
			"org-1",
			"detail",
			"supplier-1",
		]);
	});
});
