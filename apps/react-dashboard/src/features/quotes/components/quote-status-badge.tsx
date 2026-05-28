import type React from "react";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/reui/badge";
import type { QuoteStatus } from "../types";

type QuoteStatusBadgeProps = {
	status: QuoteStatus | null;
};

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

	return <Badge variant="warning-light">{t("quotes.statusPending")}</Badge>;
};
