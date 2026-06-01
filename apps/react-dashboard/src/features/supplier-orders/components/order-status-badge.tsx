import { useTranslation } from "react-i18next";

import { Badge } from "@/components/ui/badge";

import type {
	SupplierOrderDetailStatus,
	SupplierOrderListStatus,
} from "@moduflow/types";
import type { JSX } from "react";

interface OrderStatusBadgeProps {
	status:
		| SupplierOrderDetailStatus
		| SupplierOrderListStatus
		| null
		| undefined;
}

const STATUS_VARIANT: Record<
	SupplierOrderListStatus,
	"default" | "secondary" | "outline" | "destructive"
> = {
	draft: "secondary",
	processing: "outline",
	shipped: "default",
	delivered: "default",
	cancelled: "destructive",
};

export const OrderStatusBadge = ({ status }: OrderStatusBadgeProps): JSX.Element => {
	const { t } = useTranslation();
	const normalizedStatus = mapToDisplayStatus(status);

	const label =
		normalizedStatus === "draft"
			? t("orders.statusDraft", { defaultValue: "Draft" })
			: normalizedStatus === "processing"
				? t("orders.statusProcessing")
				: normalizedStatus === "shipped"
					? t("orders.statusShipped")
					: normalizedStatus === "delivered"
						? t("orders.statusDelivered")
						: t("orders.statusCancelled");

	return <Badge variant={STATUS_VARIANT[normalizedStatus]}>{label}</Badge>;
};

const mapToDisplayStatus = (
	status: SupplierOrderDetailStatus | SupplierOrderListStatus | null | undefined,
): SupplierOrderListStatus => {
	if (!status || status === "draft") {
		return "draft";
	}

	if (status === "shipped") {
		return "shipped";
	}

	if (status === "arrived" || status === "closed" || status === "delivered") {
		return "delivered";
	}

	if (status === "cancelled") {
		return "cancelled";
	}

	return "processing";
};
