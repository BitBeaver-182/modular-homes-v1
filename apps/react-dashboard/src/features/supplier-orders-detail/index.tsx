import { Link } from "@tanstack/react-router";
import { type JSX } from "react";
import { useTranslation } from "react-i18next";

import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { useGetOrder } from "@/features/supplier-orders-detail/hooks/use-get-order";
import { useUpdateOrder } from "@/features/supplier-orders-detail/hooks/use-update-order";
import { Route } from "@/routes/$locale.o.$organizationSlug._admin._operations.supplier-orders_.$orderId";

import { OrderInvoicesCard } from "./components/order-invoices";
import { OrderProductsCard } from "./components/order-products/order-products-card";
import { OrderSidebar } from "./components/order-sidebar";

const TERMINAL_ORDER_STATUSES = new Set([
	"shipped",
	"arrived",
	"closed",
	"cancelled",
]);

const getDisplaySupplierName = (order: {
	supplier: { name: string } | null;
	quote: { supplier: { name: string } | null } | null;
}): string | null => order.supplier?.name ?? order.quote?.supplier?.name ?? null;

const SupplierOrderDetailPage = (): JSX.Element => {
	const { t } = useTranslation();
	const { locale, organizationSlug, orderId } = Route.useParams();
	const navigate = Route.useNavigate();

	const {
		data: order,
		isLoading,
		isError,
		error,
		refetch,
	} = useGetOrder(orderId);
	const updateOrder = useUpdateOrder();

	const goToOrders = (): void => {
		void navigate({
			to: "/$locale/o/$organizationSlug/supplier-orders",
			params: { locale, organizationSlug },
			search: {
				page: 1,
				pageSize: 10,
			},
		});
	};

	if (isLoading) {
		return (
			<div className="flex min-h-[50vh] items-center justify-center">
				<Spinner className="size-5" />
			</div>
		);
	}

	if (isError || !order) {
		return (
			<div className="space-y-4 py-10 text-center">
				<h1 className="text-xl font-semibold">
					{t("orders.detailNotFoundTitle")}
				</h1>
				<p className="text-sm text-muted-foreground">
					{error?.message ?? t("orders.detailNotFoundDescription")}
				</p>
				<div className="flex items-center justify-center gap-2">
					<Button
						type="button"
						variant="outline"
						onClick={() => void refetch()}
					>
						{t("orders.retry")}
					</Button>
					<Button type="button" onClick={goToOrders}>
						{t("orders.backToOrders")}
					</Button>
				</div>
			</div>
		);
	}

	const supplierName = getDisplaySupplierName(order) ?? t("orders.unknownSupplier");
	const canEditOrderLines = !TERMINAL_ORDER_STATUSES.has(order.status);

	return (
		<div className="space-y-6">
			<div className="flex shrink-0 flex-col gap-2">
				<Breadcrumb>
					<BreadcrumbList>
						<BreadcrumbItem>
							<BreadcrumbPage className="text-gray-400">
								{t("nav.operations")}
							</BreadcrumbPage>
						</BreadcrumbItem>
						<BreadcrumbSeparator />
						<BreadcrumbItem>
							<BreadcrumbLink asChild>
								<Link
									params={{ locale, organizationSlug }}
									to="/$locale/o/$organizationSlug/supplier-orders"
									search={{
										page: 1,
										pageSize: 10,
									}}
								>
									{t("orders.title")}
								</Link>
							</BreadcrumbLink>
						</BreadcrumbItem>
						<BreadcrumbSeparator />
						<BreadcrumbItem>
							<BreadcrumbPage className="text-gray-400">
								{order.orderNumber ?? order.id}
							</BreadcrumbPage>
						</BreadcrumbItem>
					</BreadcrumbList>
				</Breadcrumb>

				<div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
					<div>
						<h1 className="text-2xl font-bold">
							{order.orderNumber ?? order.id}
						</h1>
						<p className="text-sm text-muted-foreground">
							{supplierName}
						</p>
					</div>
				</div>
			</div>

			<div className="grid gap-6 lg:grid-cols-3">
				<div className="space-y-6 lg:col-span-2">
					<OrderProductsCard
						currency={order.currencyCode}
						editable={canEditOrderLines}
						mutating={updateOrder.isPending}
						orderLines={order.orderLines}
						onSaveOrderLines={async (orderLines) => {
							await updateOrder.mutateAsync({
								orderId: order.id,
								input: { orderLines },
							});
						}}
					/>
					<OrderInvoicesCard invoices={order.invoices} />
				</div>
				<OrderSidebar order={order} />
			</div>
		</div>
	);
};

export default SupplierOrderDetailPage;
