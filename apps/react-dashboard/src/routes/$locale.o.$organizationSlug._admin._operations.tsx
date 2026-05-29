import { Outlet, createFileRoute } from "@tanstack/react-router";

import type { JSX } from "react";

const OperationsGroupLayout = (): JSX.Element => {
	return <Outlet />;
}

export const Route = createFileRoute(
	"/$locale/o/$organizationSlug/_admin/_operations"
)({
	component: OperationsGroupLayout,
});
