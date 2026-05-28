import { createFileRoute } from "@tanstack/react-router";
import SupplierOrderDetailPage from "@/features/supplier-orders-detail";

export const Route = createFileRoute(
	"/$locale/o/$organizationSlug/_admin/_operations/supplier-orders_/$orderId"
)({
	component: SupplierOrderDetailPage,
});
