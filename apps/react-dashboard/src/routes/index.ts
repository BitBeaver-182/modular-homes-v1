import { createFileRoute, redirect } from "@tanstack/react-router";
import { DEFAULT_LOCALE } from "../common/locales";

export const Route = createFileRoute("/")({
	beforeLoad: () => {
		throw redirect({
			params: { locale: DEFAULT_LOCALE },
			to: "/$locale",
		});
	},
});
