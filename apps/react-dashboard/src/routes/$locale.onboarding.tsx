import { createFileRoute, redirect } from "@tanstack/react-router";

import { isSupportedLocale } from "@/common/locales";
import { requireAuthenticatedSession } from "@/features/auth/lib/auth-routing";
import { OnboardingPage } from "@/features/auth/onboarding-page";

import type { JSX } from "react";

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
