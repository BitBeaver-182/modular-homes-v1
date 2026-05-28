/* eslint-disable @typescript-eslint/only-throw-error, no-use-before-define */

import type { JSX } from "react";
import { Outlet, createFileRoute, redirect } from "@tanstack/react-router";
import { AdminShell } from "../components/layout/AdminShell";
import { isSupportedLocale } from "../common/locales";
import {
	findMembershipBySlug,
	requireAuthenticatedSession,
} from "@/features/auth/lib/auth-routing";

export const Route = createFileRoute("/$locale/o/$organizationSlug/_admin")({
	beforeLoad: async ({ location, params }) => {
		if (!isSupportedLocale(params.locale)) {
			throw redirect({ to: "/" });
		}

		const session = await requireAuthenticatedSession(
			params.locale,
			location.href
		);

		if (session.memberships.length === 0) {
			throw redirect({
				params: { locale: params.locale },
				to: "/$locale/onboarding",
			});
		}

		const activeMembership = findMembershipBySlug(
			session,
			params.organizationSlug
		);

		if (!activeMembership) {
			const firstMembership = session.memberships[0];

			if (firstMembership) {
				throw redirect({
					params: {
						locale: params.locale,
						organizationSlug: firstMembership.organization.slug,
					},
					to: "/$locale/o/$organizationSlug",
				});
			}

			throw redirect({
				params: { locale: params.locale },
				to: "/$locale/onboarding",
			});
		}

		return { activeMembership, session };
	},
	component: AdminLayout,
});

function AdminLayout(): JSX.Element | null {
	const { locale } = Route.useParams();
	const { activeMembership, session } = Route.useRouteContext();

	if (!isSupportedLocale(locale)) {
		return null;
	}

	return (
		<AdminShell
			activeMembership={activeMembership}
			locale={locale}
			memberships={session.memberships}
			user={session.user}
		>
			<Outlet />
		</AdminShell>
	);
}
