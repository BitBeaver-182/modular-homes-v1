import { useMemo, type JSX } from "react";
import { Link } from "@tanstack/react-router";
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
import type {
	SupplierInvoicePaymentUpdateInput,
	SupplierInvoicePaymentWriteInput,
	SupplierInvoiceUpdateInput,
	SupplierInvoiceWriteInput,
} from "@/features/supplier-orders-detail/lib/order-api";
import { useCreateInvoicePayment } from "@/features/supplier-orders-detail/hooks/use-create-invoice-payment";
import { useCreateOrderInvoice } from "@/features/supplier-orders-detail/hooks/use-create-order-invoice";
import { useDeleteInvoicePayment } from "@/features/supplier-orders-detail/hooks/use-delete-invoice-payment";
import { useDeleteOrderInvoice } from "@/features/supplier-orders-detail/hooks/use-delete-order-invoice";
import { useGetOrder } from "@/features/supplier-orders-detail/hooks/use-get-order";
import { useUpdateInvoicePayment } from "@/features/supplier-orders-detail/hooks/use-update-invoice-payment";
import { useUpdateOrder } from "@/features/supplier-orders-detail/hooks/use-update-order";
import { useUpdateOrderInvoice } from "@/features/supplier-orders-detail/hooks/use-update-order-invoice";
import { Route } from "@/routes/$locale.o.$organizationSlug._admin._operations.supplier-orders_.$orderId";
import { OrderProductsCard } from "./components/order-products/order-products-card";
import { OrderInvoicesCard } from "./components/order-invoices";
import { OrderSidebar } from "./components/order-sidebar";

const getOrderNumber = (orderId: number): string =>
	`SO-${String(orderId).padStart(6, "0")}`;

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
	const createInvoice = useCreateOrderInvoice();
	const updateInvoice = useUpdateOrderInvoice();
	const deleteInvoice = useDeleteOrderInvoice();
	const createPayment = useCreateInvoicePayment();
	const updatePayment = useUpdateInvoicePayment();
	const deletePayment = useDeleteInvoicePayment();

	const anyMutationInFlight = useMemo(
		() =>
			updateOrder.isPending ||
			createInvoice.isPending ||
			updateInvoice.isPending ||
			deleteInvoice.isPending ||
			createPayment.isPending ||
			updatePayment.isPending ||
			deletePayment.isPending,
		[
			createInvoice.isPending,
			createPayment.isPending,
			deleteInvoice.isPending,
			deletePayment.isPending,
			updateInvoice.isPending,
			updateOrder.isPending,
			updatePayment.isPending,
		]
	);

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

	const supplierName =
		order.supplier?.name ??
		order.quote?.supplier?.name ??
		t("orders.unknownSupplier");
	const currency = order.quote?.total?.currency_code?.toUpperCase() ?? "EUR";
	const orderNumber = getOrderNumber(order.id);

	const handleCreateInvoice = async (
		input: SupplierInvoiceWriteInput
	): Promise<void> => {
		await createInvoice.mutateAsync({
			orderDocumentId: order.documentId,
			input,
		});
	};

	const handleUpdateInvoice = async (
		invoiceDocumentId: string,
		input: SupplierInvoiceUpdateInput
	): Promise<void> => {
		await updateInvoice.mutateAsync({
			orderDocumentId: order.documentId,
			invoiceDocumentId,
			input,
		});
	};

	const handleDeleteInvoice = async (
		invoiceDocumentId: string
	): Promise<void> => {
		await deleteInvoice.mutateAsync({
			orderDocumentId: order.documentId,
			invoiceDocumentId,
		});
	};

	const handleCreatePayment = async (
		input: SupplierInvoicePaymentWriteInput
	): Promise<void> => {
		await createPayment.mutateAsync({
			orderDocumentId: order.documentId,
			input,
		});
	};

	const handleUpdatePayment = async (
		paymentDocumentId: string,
		input: SupplierInvoicePaymentUpdateInput
	): Promise<void> => {
		await updatePayment.mutateAsync({
			orderDocumentId: order.documentId,
			paymentDocumentId,
			input,
		});
	};

	const handleDeletePayment = async (
		paymentDocumentId: string
	): Promise<void> => {
		await deletePayment.mutateAsync({
			orderDocumentId: order.documentId,
			paymentDocumentId,
		});
	};

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
								{orderNumber}
							</BreadcrumbPage>
						</BreadcrumbItem>
					</BreadcrumbList>
				</Breadcrumb>

				<div className="flex items-center justify-between">
					<h1 className="text-2xl font-bold">{orderNumber}</h1>
				</div>
			</div>

			<div className="grid gap-6 lg:grid-cols-3">
				<div className="space-y-6 lg:col-span-2">
					<OrderProductsCard
						currency={currency}
						mutating={anyMutationInFlight}
						order={order}
						onSaveOrderLines={async (orderLines) => {
							await updateOrder.mutateAsync({
								documentId: order.documentId,
								input: { orderLines },
							});
						}}
					/>
					<OrderInvoicesCard
						currency={currency}
						invoices={order.invoices ?? []}
						mutating={anyMutationInFlight}
						orderDocumentId={order.documentId}
						orderQuote={order.quote}
						supplierName={supplierName}
						onCreateInvoice={handleCreateInvoice}
						onCreatePayment={handleCreatePayment}
						onDeleteInvoice={handleDeleteInvoice}
						onDeletePayment={handleDeletePayment}
						onUpdateInvoice={handleUpdateInvoice}
						onUpdatePayment={handleUpdatePayment}
					/>
				</div>
				<OrderSidebar
					mutating={anyMutationInFlight}
					order={order}
					onUpdateOrder={async (input) => {
						await updateOrder.mutateAsync({
							documentId: order.documentId,
							input,
						});
					}}
				/>
			</div>
		</div>
	);
};

export default SupplierOrderDetailPage;
