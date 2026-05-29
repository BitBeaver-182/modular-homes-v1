 
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

import type { Quote, QuoteStatus } from "../types";

export interface QuoteStatusAlertProps {
	open: boolean;
	quote: Quote | null;
	nextStatus: QuoteStatus | null;
	loading: boolean;
	onOpenChange: (open: boolean) => void;
	onConfirm: (quote: Quote, status: QuoteStatus) => Promise<void>;
}

export const QuoteStatusAlert = ({
	open,
	quote,
	nextStatus,
	loading,
	onOpenChange,
	onConfirm,
}: QuoteStatusAlertProps) => {
	const { t } = useTranslation();
	const [errorMessage, setErrorMessage] = useState<string | null>(null);

	const handleDialogOpenChange = (next: boolean): void => {
		setErrorMessage(null);
		onOpenChange(next);
	};

	const isApproval = nextStatus === "accepted";

	const handleConfirm = async (): Promise<void> => {
		if (!quote || !nextStatus) {
			return;
		}

		try {
			await onConfirm(quote, nextStatus);
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
					<AlertDialogTitle>
						{isApproval ? t("quotes.acceptDialogTitle") : t("quotes.rejectDialogTitle")}
					</AlertDialogTitle>
					<AlertDialogDescription>
						{isApproval ? t("quotes.acceptDialogDesc") : t("quotes.rejectDialogDesc")}
					</AlertDialogDescription>
				</AlertDialogHeader>
				{errorMessage ? (
					<p className="text-sm text-destructive">{errorMessage}</p>
				) : null}
				<AlertDialogFooter>
					<AlertDialogCancel type="button">{t("common.cancel")}</AlertDialogCancel>
					<AlertDialogAction
						disabled={loading || !quote || !nextStatus}
						type="button"
						variant={isApproval ? "default" : "destructive"}
						onClick={(event) => {
							event.preventDefault();
							void handleConfirm();
						}}
					>
						{isApproval ? t("quotes.acceptAction") : t("quotes.rejectAction")}
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
};
