export type GovernanceRole = "owner" | "member";

export interface AuthUser {
	id: string;
	email: string;
	name: string | null;
	avatarUrl: string | null;
}

export interface OrganizationSummary {
	id: string;
	name: string;
	slug: string;
}

export interface OrganizationMembership {
	id: string;
	governanceRole: GovernanceRole;
	organization: OrganizationSummary;
}

export interface AuthSession {
	user: AuthUser;
	memberships: Array<OrganizationMembership>;
}

export interface AuthResponse {
	access_token: string;
	user: AuthUser;
}

export interface OrganizationInvitation {
	id: string;
	email: string;
	governanceRole: GovernanceRole;
	status: "pending" | "accepted" | "expired" | "revoked" | "rejected";
	organization?: OrganizationSummary;
}

export interface LoginInput {
	email: string;
	password: string;
}

export type RegisterInput = LoginInput & {
	name?: string;
};

export interface CreateOrganizationInput {
	name: string;
	slug: string;
}
