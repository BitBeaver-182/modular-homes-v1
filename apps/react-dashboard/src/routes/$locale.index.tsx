/* eslint-disable @typescript-eslint/only-throw-error */

import { createFileRoute, redirect } from "@tanstack/react-router";
import { isSupportedLocale } from "@/common/locales";
import { authStorage } from "@/features/auth/lib/auth-storage";
import { getSession } from "@/lib/moduflow/api";
import { ModuflowRequestError } from "@/lib/moduflow/client";

export const Route = createFileRoute("/$locale/")({
	beforeLoad: async ({ params }) => {
		if (!isSupportedLocale(params.locale)) {
			return;
		}

		if (!authStorage.getToken()) {
			throw redirect({
				params: { locale: params.locale },
				to: "/$locale/login",
			});
		}

		try {
			const session = await getSession();
			const firstMembership = session.memberships[0];

			if (!firstMembership) {
				throw redirect({
					params: { locale: params.locale },
					to: "/$locale/onboarding",
				});
			}

			throw redirect({
				params: {
					locale: params.locale,
					organizationSlug: firstMembership.organization.slug,
				},
				to: "/$locale/o/$organizationSlug",
			});
		} catch (error) {
			if (
				error instanceof ModuflowRequestError &&
				(error.status === 401 || error.status === 403)
			) {
				authStorage.clearToken();
				throw redirect({
					params: { locale: params.locale },
					to: "/$locale/login",
				});
			}

			throw error;
		}
	},
});
