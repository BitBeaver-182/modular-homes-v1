/* eslint-disable no-use-before-define */

import type { JSX } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { isSupportedLocale } from "@/common/locales";
import { LoginPage } from "@/features/auth/login-page";

const loginSearchSchema = z.object({
	redirect: z.string().optional(),
});

export const Route = createFileRoute("/$locale/login")({
	validateSearch: loginSearchSchema,
	component: LoginRoute,
});

function LoginRoute(): JSX.Element | null {
	const { locale } = Route.useParams();
	const { redirect } = Route.useSearch();

	if (!isSupportedLocale(locale)) {
		return null;
	}

	return <LoginPage locale={locale} redirectPath={redirect} />;
}
