import { createFileRoute } from "@tanstack/react-router";

import { RoutePlaceholder } from "../components/layout/RoutePlaceholder";

import type { JSX } from "react";

const AccountRoute = (): JSX.Element => {
	return <RoutePlaceholder title="account" />;
}

export const Route = createFileRoute(
	"/$locale/o/$organizationSlug/_admin/_settings/account"
)({
	component: AccountRoute,
});
