import { createFileRoute } from "@tanstack/react-router";

import { RoutePlaceholder } from "../components/layout/RoutePlaceholder";

import type { JSX } from "react";

const MarketingCalendarRoute = (): JSX.Element => {
	return <RoutePlaceholder title="marketing/calendar" />;
}

export const Route = createFileRoute(
	"/$locale/o/$organizationSlug/_admin/_marketing/marketing/calendar"
)({
	component: MarketingCalendarRoute,
});
