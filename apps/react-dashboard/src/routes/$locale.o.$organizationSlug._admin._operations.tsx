import type { JSX } from "react";
import { Outlet, createFileRoute } from "@tanstack/react-router";

function OperationsGroupLayout(): JSX.Element {
	return <Outlet />;
}

export const Route = createFileRoute(
	"/$locale/o/$organizationSlug/_admin/_operations"
)({
	component: OperationsGroupLayout,
});
