import type { JSX } from "react";
import { Outlet, createFileRoute } from "@tanstack/react-router";

function MarketingGroupLayout(): JSX.Element {
	return <Outlet />;
}

export const Route = createFileRoute(
	"/$locale/o/$organizationSlug/_admin/_marketing"
)({
	component: MarketingGroupLayout,
});
