import { moduflowRequest } from "./client";

import type {
	AuthResponse,
	AuthSession,
	CreateOrganizationInput,
	LoginInput,
	OrganizationInvitation,
	OrganizationSummary,
	RegisterInput,
} from "./types";

export const sessionQueryKey = ["moduflow", "auth", "session"] as const;
export const invitationsQueryKey = ["moduflow", "invitations", "mine"] as const;

export const registerUser = (input: RegisterInput): Promise<AuthResponse> =>
	moduflowRequest<AuthResponse>("/auth/register", {
		auth: false,
		body: input,
		method: "POST",
	});

export const loginUser = (input: LoginInput): Promise<AuthResponse> =>
	moduflowRequest<AuthResponse>("/auth/login", {
		auth: false,
		body: input,
		method: "POST",
	});

export const getSession = (): Promise<AuthSession> =>
	moduflowRequest<AuthSession>("/auth/session");

export const getMyInvitations = (): Promise<Array<OrganizationInvitation>> =>
	moduflowRequest<Array<OrganizationInvitation>>(
		"/organization-invitations/mine"
	);

export const acceptInvitation = (invitationId: string): Promise<void> =>
	moduflowRequest<void>(
		`/organization-invitations/${encodeURIComponent(invitationId)}/accept`,
		{ method: "POST" }
	);

export const rejectInvitation = (invitationId: string): Promise<void> =>
	moduflowRequest<void>(
		`/organization-invitations/${encodeURIComponent(invitationId)}/reject`,
		{ method: "POST" }
	);

export const createOrganization = (
	input: CreateOrganizationInput
): Promise<OrganizationSummary> =>
	moduflowRequest<OrganizationSummary>("/organizations", {
		body: input,
		method: "POST",
	});
