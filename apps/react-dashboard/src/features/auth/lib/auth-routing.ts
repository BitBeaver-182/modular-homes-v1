 

import { redirect } from "@tanstack/react-router";

import type { SupportedLocale } from "@/common/locales";
import { getSession } from "@/lib/moduflow/api";
import { ModuflowRequestError } from "@/lib/moduflow/client";
import type { AuthSession, OrganizationMembership } from "@/lib/moduflow/types";

import { authStorage } from "./auth-storage";

export const getOrganizationDashboardPath = (
	locale: SupportedLocale,
	organizationSlug: string,
	suffix = ""
): string => `/${locale}/o/${organizationSlug}${suffix}`;

export const findMembershipBySlug = (
	session: AuthSession,
	organizationSlug: string
): OrganizationMembership | undefined =>
	session.memberships.find(
		(membership) => membership.organization.slug === organizationSlug
	);

export const getFirstOrganizationPath = (
	session: AuthSession,
	locale: SupportedLocale
): string | null => {
	const firstMembership = session.memberships[0];

	if (!firstMembership) {
		return null;
	}

	return getOrganizationDashboardPath(
		locale,
		firstMembership.organization.slug
	);
};

export const resolvePostAuthPath = (
	session: AuthSession,
	locale: SupportedLocale,
	redirectPath?: string
): string => {
	const redirectMatch = redirectPath?.match(/^\/([^/]+)\/o\/([^/]+)(?:\/.*)?$/);
	const redirectLocale = redirectMatch?.[1];
	const redirectOrganizationSlug = redirectMatch?.[2];

	if (
		redirectPath &&
		redirectLocale === locale &&
		redirectOrganizationSlug &&
		findMembershipBySlug(session, redirectOrganizationSlug)
	) {
		return redirectPath;
	}

	return getFirstOrganizationPath(session, locale) ?? `/${locale}/onboarding`;
};

export const requireAuthenticatedSession = async (
	locale: SupportedLocale,
	redirectPath: string
): Promise<AuthSession> => {
	if (!authStorage.getToken()) {
		throw redirect({
			params: { locale },
			search: { redirect: redirectPath },
			to: "/$locale/login",
		});
	}

	try {
		return await getSession();
	} catch (error) {
		if (
			error instanceof ModuflowRequestError &&
			(error.status === 401 || error.status === 403)
		) {
			authStorage.clearToken();
			throw redirect({
				params: { locale },
				search: { redirect: redirectPath },
				to: "/$locale/login",
			});
		}

		throw error;
	}
};

export const redirectToPostAuthDestination = (
	session: AuthSession,
	locale: SupportedLocale
): never => {
	const organizationPath = getFirstOrganizationPath(session, locale);

	if (organizationPath) {
		throw redirect({ href: organizationPath });
	}

	throw redirect({
		params: { locale },
		to: "/$locale/onboarding",
	});
};
