import type { JSX } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { RoutePlaceholder } from "../components/layout/RoutePlaceholder";

function DashboardRoute(): JSX.Element {
	return <RoutePlaceholder title="dashboard" />;
}

export const Route = createFileRoute(
	"/$locale/o/$organizationSlug/_admin/_general/"
)({
	component: DashboardRoute,
});
