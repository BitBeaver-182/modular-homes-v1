export type GovernanceRole = "owner" | "member";

export type AuthUser = {
	id: string;
	email: string;
	name: string | null;
	avatarUrl: string | null;
};

export type OrganizationSummary = {
	id: string;
	name: string;
	slug: string;
};

export type OrganizationMembership = {
	id: string;
	governanceRole: GovernanceRole;
	organization: OrganizationSummary;
};

export type AuthSession = {
	user: AuthUser;
	memberships: Array<OrganizationMembership>;
};

export type AuthResponse = {
	access_token: string;
	user: AuthUser;
};

export type OrganizationInvitation = {
	id: string;
	email: string;
	governanceRole: GovernanceRole;
	status: "pending" | "accepted" | "expired" | "revoked" | "rejected";
	organization?: OrganizationSummary;
};

export type LoginInput = {
	email: string;
	password: string;
};

export type RegisterInput = LoginInput & {
	name?: string;
};

export type CreateOrganizationInput = {
	name: string;
	slug: string;
};
