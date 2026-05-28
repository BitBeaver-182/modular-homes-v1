import type { JSX } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { RoutePlaceholder } from "../components/layout/RoutePlaceholder";

function ProductsRoute(): JSX.Element {
	return <RoutePlaceholder title="products" />;
}

export const Route = createFileRoute(
	"/$locale/o/$organizationSlug/_admin/_operations/products"
)({
	component: ProductsRoute,
});
