/* eslint-disable no-use-before-define */

import type { JSX } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { isSupportedLocale } from "@/common/locales";
import { RegisterPage } from "@/features/auth/register-page";

export const Route = createFileRoute("/$locale/register")({
	component: RegisterRoute,
});

function RegisterRoute(): JSX.Element | null {
	const { locale } = Route.useParams();

	if (!isSupportedLocale(locale)) {
		return null;
	}

	return <RegisterPage locale={locale} />;
}
