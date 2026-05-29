import { describe, expect, it } from "vitest";

import {
	slugifyOrganizationName,
	validateOrganizationSlug,
} from "./organization-slug";

describe("organization slug helpers", () => {
	it("generates a slug from an organization name", () => {
		expect(slugifyOrganizationName(" Northwind Modular Homes! ")).toBe(
			"northwind-modular-homes"
		);
	});

	it("validates required and URL-safe slugs", () => {
		expect(validateOrganizationSlug("")).toBe("Organization slug is required");
		expect(validateOrganizationSlug("Bad Slug")).toBe(
			"Use lowercase letters, numbers, and single hyphens"
		);
		expect(validateOrganizationSlug("good-slug-1")).toBeNull();
	});
});
