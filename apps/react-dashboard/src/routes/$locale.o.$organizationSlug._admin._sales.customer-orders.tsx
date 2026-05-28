import type { JSX } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { RoutePlaceholder } from "../components/layout/RoutePlaceholder";

function CustomerOrdersRoute(): JSX.Element {
	return <RoutePlaceholder title="customer-orders" />;
}

export const Route = createFileRoute(
	"/$locale/o/$organizationSlug/_admin/_sales/customer-orders"
)({
	component: CustomerOrdersRoute,
});
