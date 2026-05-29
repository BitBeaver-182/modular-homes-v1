import { describe, expect, it } from "vitest";

import type { AuthSession } from "@/lib/moduflow/types";

import { getFirstOrganizationPath, resolvePostAuthPath } from "./auth-routing";

const session: AuthSession = {
	user: {
		id: "1",
		email: "owner@example.com",
		name: "Owner",
		avatarUrl: null,
	},
	memberships: [
		{
			id: "10",
			governanceRole: "owner",
			organization: {
				id: "2",
				name: "Acme",
				slug: "acme",
			},
		},
	],
};

describe("auth routing", () => {
	it("builds the first organization dashboard path", () => {
		expect(getFirstOrganizationPath(session, "en")).toBe("/en/o/acme");
	});

	it("uses a valid dashboard redirect after auth", () => {
		expect(resolvePostAuthPath(session, "en", "/en/o/acme/suppliers")).toBe(
			"/en/o/acme/suppliers"
		);
	});

	it("falls back to onboarding when the user has no memberships", () => {
		expect(resolvePostAuthPath({ ...session, memberships: [] }, "en")).toBe(
			"/en/onboarding"
		);
	});
});
