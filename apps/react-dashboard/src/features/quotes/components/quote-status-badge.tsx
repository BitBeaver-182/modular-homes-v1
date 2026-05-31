import type { SupplierQuoteStatus } from "@moduflow/types";
import { useTranslation } from "react-i18next";

import { Badge } from "@/components/reui/badge";
import type React from "react";

interface QuoteStatusBadgeProps {
	status: SupplierQuoteStatus | null;
}

export const QuoteStatusBadge = ({
	status,
}: QuoteStatusBadgeProps): React.JSX.Element => {
	const { t } = useTranslation();

	if (status === "accepted") {
		return <Badge variant="success-light">{t("quotes.statusAccepted")}</Badge>;
	}

	if (status === "rejected") {
		return <Badge variant="destructive-light">{t("quotes.statusRejected")}</Badge>;
	}

	if (status === "expired") {
		return <Badge variant="secondary">{t("quotes.statusExpired")}</Badge>;
	}

	return <Badge variant="warning-light">{t("quotes.statusReceived")}</Badge>;
};
