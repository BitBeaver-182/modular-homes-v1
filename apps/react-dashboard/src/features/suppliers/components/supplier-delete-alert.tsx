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

import type { Supplier } from "../types";
import type { JSX} from "react";

interface SupplierDeleteAlertProps {
  open: boolean;
  supplier: Supplier | null;
  loading: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (supplier: Supplier) => Promise<void>;
}

export const SupplierDeleteAlert = ({
  open,
  supplier,
  loading,
  onOpenChange,
  onConfirm,
}: SupplierDeleteAlertProps): JSX.Element => {
  const { t } = useTranslation();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleConfirm = async (): Promise<void> => {
    if (!supplier) {
      return;
    }

    try {
      await onConfirm(supplier);
      onOpenChange(false);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : t("suppliers.toastRequestFailed"),
      );
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="sm:max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle>{t("suppliers.deleteDialogTitle")}</AlertDialogTitle>
          <AlertDialogDescription>
            {t("suppliers.deleteDialogDesc", { name: supplier?.name ?? "" })}
          </AlertDialogDescription>
        </AlertDialogHeader>
        {errorMessage ? (
          <p className="text-sm text-destructive">{errorMessage}</p>
        ) : null}
        <AlertDialogFooter>
          <AlertDialogCancel type="button">{t("common.cancel")}</AlertDialogCancel>
          <AlertDialogAction
            disabled={loading || !supplier}
            type="button"
            variant="destructive"
            onClick={(event) => {
              event.preventDefault();
              void handleConfirm();
            }}
          >
            {loading ? t("suppliers.toastDeleting") : t("suppliers.deleteAction")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};