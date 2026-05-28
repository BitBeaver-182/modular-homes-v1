import type { JSX } from "react";
import { Outlet, createFileRoute } from "@tanstack/react-router";

function SettingsGroupLayout(): JSX.Element {
	return <Outlet />;
}

export const Route = createFileRoute(
	"/$locale/o/$organizationSlug/_admin/_settings"
)({
	component: SettingsGroupLayout,
});
