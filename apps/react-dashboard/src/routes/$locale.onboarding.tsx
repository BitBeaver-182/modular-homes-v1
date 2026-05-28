/* eslint-disable @typescript-eslint/only-throw-error, no-use-before-define */

import type { JSX } from "react";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { isSupportedLocale } from "@/common/locales";
import { OnboardingPage } from "@/features/auth/onboarding-page";
import { requireAuthenticatedSession } from "@/features/auth/lib/auth-routing";

export const Route = createFileRoute("/$locale/onboarding")({
	beforeLoad: async ({ location, params }) => {
		if (!isSupportedLocale(params.locale)) {
			throw redirect({ to: "/" });
		}

		const session = await requireAuthenticatedSession(
			params.locale,
			location.href
		);
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

		return { session };
	},
	component: OnboardingRoute,
});

function OnboardingRoute(): JSX.Element | null {
	const { locale } = Route.useParams();
	const { session } = Route.useRouteContext();

	if (!isSupportedLocale(locale)) {
		return null;
	}

	return <OnboardingPage locale={locale} session={session} />;
}
