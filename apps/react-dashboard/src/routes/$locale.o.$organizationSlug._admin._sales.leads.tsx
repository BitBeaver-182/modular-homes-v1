import { createFileRoute } from "@tanstack/react-router";

import { RoutePlaceholder } from "../components/layout/RoutePlaceholder";

import type { JSX } from "react";

const LeadsRoute = (): JSX.Element => {
	return <RoutePlaceholder title="leads" />;
}

export const Route = createFileRoute(
	"/$locale/o/$organizationSlug/_admin/_sales/leads"
)({
	component: LeadsRoute,
});
