import { FileText, FileTextIcon, MoreHorizontalIcon, Plus, Trash2, UserIcon } from "lucide-react";
import { useState, type JSX } from "react";
import { useTranslation } from "react-i18next";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Progress } from "@/components/ui/progress";
import type {
  SupplierInvoiceStatus,
  SupplierOrderInvoice,
  SupplierOrderInvoicePayment,
} from "@/features/supplier-orders/types";
import { useCurrency } from "@/hooks/use-currency";
import type { StrapiMoney } from "@/lib/strapi";
import { cn } from "@/lib/utilities";

import { AlertInvoiceDelete } from "./alert-invoice-delete";
import { InvoicePaymentCard } from "./invoice-payment-card";


interface InvoiceCardProps {
  currency: string;
  mutating: boolean;
  className?: string;
  supplierName: string;
  invoice: SupplierOrderInvoice;
  onEditInvoice: (invoice: SupplierOrderInvoice) => void;
  onConfirmDeleteInvoice: (invoice: SupplierOrderInvoice) => Promise<void>;
  onAddPayment: (invoice: SupplierOrderInvoice) => void;
  onEditPayment: (
    invoice: SupplierOrderInvoice,
    payment: SupplierOrderInvoicePayment,
  ) => void;
  onConfirmDeletePayment: (payment: SupplierOrderInvoicePayment) => Promise<void>;
}

const INVOICE_STATUS_VARIANT: Record<
  SupplierInvoiceStatus,
  "default" | "secondary" | "outline" | "destructive"
> = {
  pending: "secondary",
  paid: "default",
  overdue: "destructive",
};

const moneyAmount = (money: StrapiMoney | null | undefined): number => {
  const amount = money?.amount;
  const parsed = typeof amount === "string" ? Number.parseFloat(amount) : amount;
  return typeof parsed === "number" && Number.isFinite(parsed) ? parsed : 0;
};

const moneyCurrency = (money: StrapiMoney | null | undefined, fallback: string): string =>
  money?.currency_code?.toUpperCase() ?? fallback;

export const InvoiceCard = ({
  currency,
  mutating,
  supplierName,
  invoice,
  className,
  onEditInvoice,
  onConfirmDeleteInvoice,
  onAddPayment,
  onEditPayment,
  onConfirmDeletePayment,
}: InvoiceCardProps): JSX.Element => {
  const { t } = useTranslation();
  const { formatAmount } = useCurrency();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const invoiceLineCurrency = moneyCurrency(invoice.total, currency);
  const invoiceStatusText = (status: SupplierInvoiceStatus): string =>
    status === "pending"
      ? t("orders.statusPending")
      : status === "paid"
        ? t("orders.invoiceStatusPaid")
        : t("orders.invoiceStatusOverdue");

  return (
    <Card
      className={cn(
        "overflow-hidden p-0 gap-0",
        // "border-muted bg-muted/50 dark:bg-muted",
        className
      )}
    >
      <CardHeader className="bg-muted dark:bg-muted py-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="bg-blue-50 p-4 row-span-2 size-3 rounded-md grid place-items-center relative">
              <FileText className=" text-blue-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" size={20} />
            </div>
            <div>
              <CardTitle className="items-center">
                {/* <span className="font-semibold">
                  {invoice.invoiceNumber ??
                    t("orders.invoiceNumberFallback", { id: invoice.id })}
                </span> */}
                {invoice.vendorName ?? supplierName}

                <Badge className="ml-3" variant={INVOICE_STATUS_VARIANT[invoice.invoiceStatus ?? "pending"]}>
                  {invoiceStatusText(invoice.invoiceStatus ?? "pending")}
                </Badge>
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                Expires on {invoice.expirationDate ? new Intl.DateTimeFormat(undefined, {
                  year: "numeric",
                  month: "short",
                  day: "2-digit",
                }).format(new Date(invoice.expirationDate)) : "-"}

              </CardDescription>

            </div>
          </div>

          <div className="flex items-center gap-1">

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="icon" variant="ghost">
                  <MoreHorizontalIcon aria-hidden="true" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuGroup>
                  <DropdownMenuItem
                    onSelect={(event) => {
                      event.preventDefault();
                      onEditInvoice(invoice);
                    }}
                  >
                    <UserIcon aria-hidden="true" />
                    <span>Edit Invoice</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <a href={invoice.attachment?.url} rel="noopener noreferrer" target="_blank">
                      <FileTextIcon aria-hidden="true" />
                      <span>View Invoice</span>
                    </a>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    variant="destructive"
                    onSelect={(event) => {
                      event.preventDefault();
                      setDeleteOpen(true);
                    }}
                  >
                    <Trash2 aria-hidden="true" />
                    <span>Delete Invoice</span>
                  </DropdownMenuItem>
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* <Button
              size="icon-sm"
              type="button"
              variant="ghost"
              onClick={() => {
                onEditInvoice(invoice);
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
            </Button> */}
          </div>


        </div>
        <div className="pt-2 space-y-1">
          <div className="text-muted-foreground flex justify-between text-xs font-medium">
            <span>{t("orders.invoiceTotal")}</span>
            <span>{t("orders.invoiceRemaining")}</span>
          </div>
          <div className="flex justify-between text-lg font-bold">
            <span>{formatAmount(moneyAmount(invoice.amountPaid), invoiceLineCurrency)} / {formatAmount(moneyAmount(invoice.total), invoiceLineCurrency)}</span>
            <span>{formatAmount(moneyAmount(invoice.amountRemaining), invoiceLineCurrency)}</span>
          </div>
          <Progress
            className="h-2"
            value={
              moneyAmount(invoice.total) > 0
                ? (moneyAmount(invoice.amountPaid) / moneyAmount(invoice.total)) * 100
                : 0
            }
          />
        </div>
      </CardHeader>
      <CardContent className="py-3 border-t bg-white dark:bg-muted">
        <div className="flex justify-between mb-2">
          <p className="text-sm font-medium">{t("orders.paymentsTitle")}</p>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              onAddPayment(invoice);
            }}
          >
            <Plus className="mr-2 size-4" />
            {t("orders.paymentAddAction")}
          </Button>
        </div>
        <div>
          {(invoice.payments?.length ?? 0) === 0 ? (
            <p className="text-sm text-muted-foreground">{t("orders.noPayments")}</p>
          ) : (
            <div className="space-y-2">
              {invoice.payments?.map((payment) => (
                <InvoicePaymentCard
                  key={payment.documentId}
                  className="bg-muted dark:bg-muted"
                  invoice={invoice}
                  invoiceLineCurrency={invoiceLineCurrency}
                  mutating={mutating}
                  payment={payment}
                  onConfirmDeletePayment={onConfirmDeletePayment}
                  onEditPayment={onEditPayment}
                />
              ))}
            </div>
          )}

        </div>
      </CardContent>
      <AlertInvoiceDelete
        mutating={mutating}
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        onConfirm={() => {
          void onConfirmDeleteInvoice(invoice);
          setDeleteOpen(false);
        }}
      />
    </Card>
  );
};
