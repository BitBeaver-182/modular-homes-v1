import { createFileRoute } from "@tanstack/react-router";

import SupplierOrdersPage from "@/features/supplier-orders";
import {
	supplierOrdersSearchParametersSchema,
	type SupplierOrdersSearchParameters,
} from "@/features/supplier-orders/search-parameters";

export const Route = createFileRoute(
	"/$locale/o/$organizationSlug/_admin/_operations/supplier-orders"
)({
	validateSearch: supplierOrdersSearchParametersSchema,
	component: SupplierOrdersPage,
});

export type { SupplierOrdersSearchParameters };
