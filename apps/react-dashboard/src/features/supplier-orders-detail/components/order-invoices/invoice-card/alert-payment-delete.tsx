import type { JSX } from "react";
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

type AlertPaymentDeleteProps = {
	open: boolean;
	mutating: boolean;
	onOpenChange: (open: boolean) => void;
	onConfirm: () => void;
};

export const AlertPaymentDelete = ({
	open,
	mutating,
	onOpenChange,
	onConfirm,
}: AlertPaymentDeleteProps): JSX.Element => {
	const { t } = useTranslation();

	return (
		<AlertDialog open={open} onOpenChange={onOpenChange}>
			<AlertDialogContent className="sm:max-w-md">
				<AlertDialogHeader>
					<AlertDialogTitle>{t("orders.paymentDeleteTitle")}</AlertDialogTitle>
					<AlertDialogDescription>
						{t("orders.deleteCannotUndo")}
					</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel type="button">{t("common.cancel")}</AlertDialogCancel>
					<AlertDialogAction
						disabled={mutating}
						type="button"
						variant="destructive"
						onClick={(event) => {
							event.preventDefault();
							onConfirm();
						}}
					>
						{t("common.delete")}
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
};
