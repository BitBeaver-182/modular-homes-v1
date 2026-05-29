 
import { useState } from "react";
import { useTranslation } from "react-i18next";

import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import type { Quote } from "../types";

export interface QuoteCreateSupplierOrderAlertProps {
	open: boolean;
	quote: Quote | null;
	loading: boolean;
	onOpenChange: (open: boolean) => void;
	onConfirm: (quote: Quote) => Promise<void>;
}

export const QuoteCreateSupplierOrderAlert = ({
	open,
	quote,
	loading,
	onOpenChange,
	onConfirm,
}: QuoteCreateSupplierOrderAlertProps) => {
	const { t } = useTranslation();
	const [errorMessage, setErrorMessage] = useState<string | null>(null);

	const handleDialogOpenChange = (next: boolean): void => {
		setErrorMessage(null);
		onOpenChange(next);
	};

	const handleConfirm = async (): Promise<void> => {
		if (!quote) {
			return;
		}

		try {
			await onConfirm(quote);
			onOpenChange(false);
		} catch (error) {
			setErrorMessage(
				error instanceof Error ? error.message : t("quotes.toastRequestFailed"),
			);
		}
	};

	const supplierName = quote?.supplier?.name ?? t("quotes.unknownSupplier");

	return (
		<AlertDialog open={open} onOpenChange={handleDialogOpenChange}>
			<AlertDialogContent className="sm:max-w-md">
				<AlertDialogHeader>
					<AlertDialogTitle>{t("quotes.createSupplierOrderDialogTitle")}</AlertDialogTitle>
					<AlertDialogDescription>
						{t("quotes.createSupplierOrderDialogDesc", {
							supplier: supplierName,
							documentId: quote?.documentId ?? "",
						})}
					</AlertDialogDescription>
				</AlertDialogHeader>
				{errorMessage ? (
					<p className="text-sm text-destructive">{errorMessage}</p>
				) : null}
				<AlertDialogFooter>
					<AlertDialogCancel type="button">{t("common.cancel")}</AlertDialogCancel>
					<AlertDialogAction
						disabled={loading || !quote}
						type="button"
						onClick={(event) => {
							event.preventDefault();
							void handleConfirm();
						}}
					>
						{loading ? t("quotes.creatingSupplierOrder") : t("quotes.createSupplierOrderConfirmAction")}
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
};
