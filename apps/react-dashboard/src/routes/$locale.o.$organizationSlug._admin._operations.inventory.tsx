import type { JSX } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { RoutePlaceholder } from "../components/layout/RoutePlaceholder";

function InventoryRoute(): JSX.Element {
	return <RoutePlaceholder title="inventory" />;
}

export const Route = createFileRoute(
	"/$locale/o/$organizationSlug/_admin/_operations/inventory"
)({
	component: InventoryRoute,
});
