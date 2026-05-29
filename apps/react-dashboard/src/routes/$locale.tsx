import { Outlet, createFileRoute, redirect } from "@tanstack/react-router";

import i18n from "../common/i18n";
import { DEFAULT_LOCALE, isSupportedLocale } from "../common/locales";

import type { JSX } from "react";

const LocaleLayout = (): JSX.Element => {
	return <Outlet />;
}

export const Route = createFileRoute("/$locale")({
	beforeLoad: async ({ params }) => {
		if (!isSupportedLocale(params.locale)) {
			throw redirect({
				params: { locale: DEFAULT_LOCALE },
				to: "/$locale",
			});
		}

		await i18n.changeLanguage(params.locale);
	},
	component: LocaleLayout,
});
