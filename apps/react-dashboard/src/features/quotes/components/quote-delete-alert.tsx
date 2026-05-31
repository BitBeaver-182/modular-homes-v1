 
import type { SupplierQuoteResponse } from "@moduflow/types";
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

export interface QuoteDeleteAlertProps {
	open: boolean;
	quote: SupplierQuoteResponse | null;
	loading: boolean;
	onOpenChange: (open: boolean) => void;
	onConfirm: (quote: SupplierQuoteResponse) => Promise<void>;
}

export const QuoteDeleteAlert = ({
	open,
	quote,
	loading,
	onOpenChange,
	onConfirm,
}: QuoteDeleteAlertProps) => {
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

	return (
		<AlertDialog open={open} onOpenChange={handleDialogOpenChange}>
			<AlertDialogContent className="sm:max-w-md">
				<AlertDialogHeader>
					<AlertDialogTitle>{t("quotes.deleteDialogTitle")}</AlertDialogTitle>
					<AlertDialogDescription>
						{t("quotes.deleteDialogDesc", {
							name: quote?.quoteNumber || quote?.id || "",
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
						variant="destructive"
						onClick={(event) => {
							event.preventDefault();
							void handleConfirm();
						}}
					>
						{loading ? t("quotes.toastDeleting") : t("quotes.deleteAction")}
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
};
