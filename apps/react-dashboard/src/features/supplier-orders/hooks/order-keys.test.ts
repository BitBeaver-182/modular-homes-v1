import { describe, expect, it } from "vitest";

import { orderKeys } from "./order-keys";

describe("orderKeys", () => {
	it("includes organization scope in detail keys when provided", () => {
		expect(orderKeys.detail("101", "42")).toEqual([
			"supplier-orders",
			"detail",
			"101",
			{ organizationId: "42" },
		]);
	});

	it("keeps the legacy detail prefix for broad invalidation", () => {
		expect(orderKeys.detail("101")).toEqual([
			"supplier-orders",
			"detail",
			"101",
		]);
	});
});
