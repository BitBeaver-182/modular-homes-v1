import { useState, type JSX } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import type {
  SupplierInvoicePaymentMethod,
  SupplierOrderInvoice,
  SupplierOrderInvoicePayment,
} from "@/features/supplier-orders/types";
import { useCurrency } from "@/hooks/use-currency";
import { AlertPaymentDelete } from "./alert-payment-delete";
import { cn } from "@/lib/utilities";
import type { StrapiMoney } from "@/lib/strapi";

type InvoicePaymentCardProps = {
  className?: string;
  invoice: SupplierOrderInvoice;
  invoiceLineCurrency: string;
  mutating: boolean;
  payment: SupplierOrderInvoicePayment;
  onEditPayment: (
    invoice: SupplierOrderInvoice,
    payment: SupplierOrderInvoicePayment,
  ) => void;
  onConfirmDeletePayment: (payment: SupplierOrderInvoicePayment) => Promise<void>;
};

const moneyAmount = (money: StrapiMoney | null | undefined): number => {
  const amount = money?.amount;
  const parsed = typeof amount === "string" ? Number.parseFloat(amount) : amount;
  return typeof parsed === "number" && Number.isFinite(parsed) ? parsed : 0;
};

const moneyCurrency = (money: StrapiMoney | null | undefined, fallback: string): string =>
  money?.currency_code?.toUpperCase() ?? fallback;

export const InvoicePaymentCard = ({
  invoice,
  invoiceLineCurrency,
  mutating,
  payment,
  onEditPayment,
  onConfirmDeletePayment,
  className,
}: InvoicePaymentCardProps): JSX.Element => {
  const { t } = useTranslation();
  const { formatAmount } = useCurrency();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const paymentMethodText = (method: SupplierInvoicePaymentMethod): string =>
    method === "wire"
      ? t("orders.paymentMethodWire")
      : method === "card"
        ? t("orders.paymentMethodCard")
        : method === "cash"
          ? t("orders.paymentMethodCash")
          : method === "check"
            ? t("orders.paymentMethodCheck")
            : t("orders.paymentMethodOther");

  return (
    <div className={cn("flex items-center rounded-md px-3 py-2 text-sm gap-4", className)}>
      <div className="flex justify-between items-center grow">
        <div>
          <p className="font-medium">
            {paymentMethodText(payment.method)}
          </p>
          <p className="text-muted-foreground text-xs">
            {new Intl.DateTimeFormat(undefined, {
              year: "numeric",
              month: "short",
              day: "2-digit",
            }).format(new Date(payment.paymentDate))}
          </p>
        </div>
        <p className="font-medium">
          {formatAmount(
            moneyAmount(payment.paymentAmount),
            moneyCurrency(payment.paymentAmount, invoiceLineCurrency),
          )}
        </p>

      </div>
      <div className="flex gap-1">
        <Button
          size="icon-sm"
          type="button"
          variant="ghost"
          onClick={() => {
            onEditPayment(invoice, payment);
          }}
        >
          <Pencil className="size-4" />
        </Button>
        <Button
          size="icon-sm"
          type="button"
          variant="ghost"
          onClick={() => {
            setDeleteOpen(true);
          }}
        >
          <Trash2 className="size-4" />
        </Button>
      </div>
      <AlertPaymentDelete
        mutating={mutating}
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        onConfirm={() => {
          void onConfirmDeletePayment(payment);
          setDeleteOpen(false);
        }}
      />
    </div>
  );
};
