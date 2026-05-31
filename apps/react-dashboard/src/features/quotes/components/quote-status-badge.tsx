import { useTranslation } from "react-i18next";

import { Badge } from "@/components/reui/badge";

import type { SupplierQuoteStatus } from "@moduflow/types";
import type React from "react";

interface QuoteStatusBadgeProps {
	status: SupplierQuoteStatus | null;
	isExpired?: boolean;
}

export const QuoteStatusBadge = ({
	isExpired = false,
	status,
}: QuoteStatusBadgeProps): React.JSX.Element => {
	const { t } = useTranslation();

	if (isExpired) {
		return <Badge variant="secondary">{t("quotes.statusExpired")}</Badge>;
	}

	if (status === "accepted") {
		return <Badge variant="success-light">{t("quotes.statusAccepted")}</Badge>;
	}

	if (status === "rejected") {
		return <Badge variant="destructive-light">{t("quotes.statusRejected")}</Badge>;
	}

	return <Badge variant="warning-light">{t("quotes.statusReceived")}</Badge>;
};
