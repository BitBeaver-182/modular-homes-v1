import type { JSX } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { RoutePlaceholder } from "../components/layout/RoutePlaceholder";

function MarketingCalendarRoute(): JSX.Element {
	return <RoutePlaceholder title="marketing/calendar" />;
}

export const Route = createFileRoute(
	"/$locale/o/$organizationSlug/_admin/_marketing/marketing/calendar"
)({
	component: MarketingCalendarRoute,
});
