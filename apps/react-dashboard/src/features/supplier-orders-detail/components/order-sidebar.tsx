import { Building2, ClipboardList, FileText } from "lucide-react";
import { type JSX } from "react";
import { useTranslation } from "react-i18next";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { OrderStatusBadge } from "@/features/supplier-orders/components/order-status-badge";

import type {
	SupplierOrderDetailResponse,
	SupplierResponse,
} from "@moduflow/types";

interface OrderSidebarProps {
	order: SupplierOrderDetailResponse;
}

const getDisplaySupplier = (
	order: SupplierOrderDetailResponse,
): SupplierResponse | null => order.supplier ?? order.quote?.supplier ?? null;

const formatOptionalDate = (value: string | null): string =>
	value ? new Date(value).toLocaleDateString() : "—";

const renderValue = (value: string | null | undefined): string => {
	const normalized = value?.trim();
	return normalized ? normalized : "—";
};

const humanize = (value: string): string =>
	value
		.split("_")
		.map((part) => part.charAt(0).toUpperCase() + part.slice(1))
		.join(" ");

export const OrderSidebar = ({ order }: OrderSidebarProps): JSX.Element => {
	const { t } = useTranslation();
	const displaySupplier = getDisplaySupplier(order);

	return (
		<div className="space-y-6">
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2 text-base leading-tight">
						<ClipboardList className="size-4 shrink-0" />
						{t("orders.sidebarOrderInfoTitle")}
					</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4 text-sm">
					<div>
						<p className="text-xs text-muted-foreground">{t("orders.sidebarCreated")}</p>
						<p className="font-medium">{formatOptionalDate(order.createdAt)}</p>
					</div>
					<div>
						<p className="text-xs text-muted-foreground">{t("orders.sidebarStatus")}</p>
						<div className="mt-1">
							<OrderStatusBadge status={order.status} />
						</div>
					</div>
					<div>
						<p className="text-xs text-muted-foreground">{t("orders.sidebarRelatedQuote")}</p>
						<p className="font-medium">{order.quote?.quoteNumber ?? order.quote?.id ?? "—"}</p>
					</div>
					<div>
						<p className="text-xs text-muted-foreground">{t("orders.sidebarOrderStatus")}</p>
						<p className="font-medium">{humanize(order.status)}</p>
					</div>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2 text-base">
						<Building2 className="size-4" />
						{t("orders.sidebarSupplierTitle")}
					</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4 text-sm">
					{displaySupplier ? (
						<>
							<div>
								<p className="text-xs text-muted-foreground">{t("orders.sidebarSupplierName")}</p>
								<p className="font-medium">{displaySupplier.name}</p>
							</div>
							<div>
								<p className="text-xs text-muted-foreground">{t("orders.sidebarSupplierPhone")}</p>
								<p className="font-medium">{renderValue(displaySupplier.phoneNumber)}</p>
							</div>
							<div>
								<p className="text-xs text-muted-foreground">{t("orders.sidebarSupplierEmail")}</p>
								<p className="break-all font-medium">{renderValue(displaySupplier.email)}</p>
							</div>
							<div>
								<p className="text-xs text-muted-foreground">{t("orders.sidebarSupplierWebsite")}</p>
								<p className="break-all font-medium">{renderValue(displaySupplier.website)}</p>
							</div>
						</>
					) : (
						<p className="text-muted-foreground">{t("orders.sidebarNoSupplier")}</p>
					)}
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2 text-base">
						<FileText className="size-4" />
						{t("orders.detailSummaryTitle", { defaultValue: "Order summary" })}
					</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4 text-sm">
					<div>
						<p className="text-xs text-muted-foreground">{t("orders.detailIncoterm", { defaultValue: "Incoterm" })}</p>
						<p className="font-medium">{renderValue(order.incoterm)}</p>
					</div>
					<div>
						<p className="text-xs text-muted-foreground">{t("orders.detailPaymentTerms", { defaultValue: "Payment terms" })}</p>
						<p className="font-medium">{renderValue(order.paymentTerms)}</p>
					</div>
					<div>
						<p className="text-xs text-muted-foreground">{t("orders.detailLoadingPort", { defaultValue: "Loading port" })}</p>
						<p className="font-medium">{renderValue(order.loadingPort)}</p>
					</div>
					<div>
						<p className="text-xs text-muted-foreground">{t("orders.detailDestinationPort", { defaultValue: "Destination port" })}</p>
						<p className="font-medium">{renderValue(order.destinationPort)}</p>
					</div>
					<div>
						<p className="text-xs text-muted-foreground">{t("orders.detailExpectedArrival", { defaultValue: "Expected arrival" })}</p>
						<p className="font-medium">{formatOptionalDate(order.expectedArrivalDate)}</p>
					</div>
					<div>
						<p className="text-xs text-muted-foreground">{t("orders.detailNotes", { defaultValue: "Notes" })}</p>
						<p className="whitespace-pre-wrap font-medium">{renderValue(order.notes)}</p>
					</div>
				</CardContent>
			</Card>
		</div>
	);
};
