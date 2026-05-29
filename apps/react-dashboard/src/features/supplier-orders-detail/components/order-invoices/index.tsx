import { Plus } from "lucide-react";
import { useMemo, useState, type JSX } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type {
	SupplierOrder,
	SupplierOrderInvoice,
	SupplierOrderInvoicePayment,
} from "@/features/supplier-orders/types";
import type {
	SupplierInvoicePaymentUpdateInput,
	SupplierInvoicePaymentWriteInput,
	SupplierInvoiceUpdateInput,
	SupplierInvoiceWriteInput,
} from "@/features/supplier-orders-detail/lib/order-api";
import type { StrapiMoney } from "@/lib/strapi";

import { InvoiceDialog, type InvoiceFormValues } from "./dialog-invoice";
import { PaymentDialog, type PaymentFormValues } from "./dialog-payment";
import { InvoiceCard } from "./invoice-card";

interface OrderInvoicesCardProps {
	orderDocumentId: string;
	currency: string;
	orderQuote: SupplierOrder["quote"];
	supplierName: string;
	invoices: Array<SupplierOrderInvoice>;
	mutating: boolean;
	onCreateInvoice: (input: SupplierInvoiceWriteInput) => Promise<void>;
	onUpdateInvoice: (
		invoiceDocumentId: string,
		input: SupplierInvoiceUpdateInput,
	) => Promise<void>;
	onDeleteInvoice: (invoiceDocumentId: string) => Promise<void>;
	onCreatePayment: (input: SupplierInvoicePaymentWriteInput) => Promise<void>;
	onUpdatePayment: (
		paymentDocumentId: string,
		input: SupplierInvoicePaymentUpdateInput,
	) => Promise<void>;
	onDeletePayment: (paymentDocumentId: string) => Promise<void>;
}

const EMPTY_INVOICE_FORM: InvoiceFormValues = {
	vendorName: "",
	totalAmount: "",
	invoiceStatus: "pending",
	expirationDate: "",
	attachmentFile: null,
	removeExistingAttachment: false,
};

const EMPTY_PAYMENT_FORM: PaymentFormValues = {
	amount: "",
	paymentDate: "",
	method: "wire",
	notes: "",
};

const toDateInputValue = (value: string | null | undefined): string => {
	if (!value) {
		return "";
	}
	return value.slice(0, 10);
};

const moneyAmount = (money: StrapiMoney | null | undefined): string => {
	if (money?.amount == null) {
		return "";
	}
	return String(money.amount);
};

const moneyCurrency = (money: StrapiMoney | null | undefined, fallback: string): string =>
	money?.currency_code?.toUpperCase() ?? fallback;

const toIsoDateOrRaw = (value: string): string => {
	if (!value) {
		return value;
	}
	const date = new Date(value);
	return Number.isNaN(date.getTime()) ? value : date.toISOString();
};

export const OrderInvoicesCard = ({
	orderDocumentId,
	currency,
	orderQuote,
	supplierName,
	invoices,
	mutating,
	onCreateInvoice,
	onUpdateInvoice,
	onDeleteInvoice,
	onCreatePayment,
	onUpdatePayment,
	onDeletePayment,
}: OrderInvoicesCardProps): JSX.Element => {
	const { t } = useTranslation();

	const [invoiceDialogOpen, setInvoiceDialogOpen] = useState(false);
	const [editingInvoice, setEditingInvoice] = useState<SupplierOrderInvoice | null>(null);
	const [invoiceInitialValues, setInvoiceInitialValues] =
		useState<InvoiceFormValues>(EMPTY_INVOICE_FORM);
	const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
	const [paymentInvoice, setPaymentInvoice] = useState<SupplierOrderInvoice | null>(null);
	const [editingPayment, setEditingPayment] = useState<SupplierOrderInvoicePayment | null>(null);
	const [paymentInitialValues, setPaymentInitialValues] =
		useState<PaymentFormValues>(EMPTY_PAYMENT_FORM);

	const invoiceFormCurrency = moneyCurrency(
		editingInvoice?.total ?? orderQuote?.total ?? null,
		currency,
	);

	const invoicesSorted = useMemo(
		(): Array<SupplierOrderInvoice> => [...invoices].sort((a, b) => b.id - a.id),
		[invoices],
	);

	const openCreateInvoice = (): void => {
		setEditingInvoice(null);
		const shouldPrefillFromQuoteFile = Boolean(orderQuote?.pdf) && orderQuote?.total != null;
		if (shouldPrefillFromQuoteFile) {
			setInvoiceInitialValues({
				vendorName: supplierName,
				totalAmount: moneyAmount(orderQuote?.total ?? null),
				invoiceStatus: "pending",
				expirationDate: toDateInputValue(orderQuote?.expiration_date),
				attachmentFile: null,
				removeExistingAttachment: false,
			});
		} else {
			setInvoiceInitialValues({
				...EMPTY_INVOICE_FORM,
				vendorName: supplierName,
			});
		}
		setInvoiceDialogOpen(true);
	};

	const openEditInvoice = (invoice: SupplierOrderInvoice): void => {
		setEditingInvoice(invoice);
		setInvoiceInitialValues({
			vendorName: invoice.vendorName ?? "",
			totalAmount: moneyAmount(invoice.total),
			invoiceStatus: invoice.invoiceStatus ?? "pending",
			expirationDate: toDateInputValue(invoice.expirationDate),
			attachmentFile: null,
			removeExistingAttachment: false,
		});
		setInvoiceDialogOpen(true);
	};

	const submitInvoice = async (formValues: InvoiceFormValues): Promise<void> => {
		const totalMoney: StrapiMoney = {
			amount: formValues.totalAmount.trim(),
			currency_code: invoiceFormCurrency,
		};

		if (editingInvoice) {
			await onUpdateInvoice(editingInvoice.documentId, {
				vendorName: formValues.vendorName.trim(),
				total: totalMoney,
				invoiceStatus: formValues.invoiceStatus,
				expirationDate: toIsoDateOrRaw(formValues.expirationDate),
				attachmentFile: formValues.attachmentFile,
				removeExistingAttachment: formValues.removeExistingAttachment,
			});
			toast.success(t("orders.invoiceUpdated"));
		} else {
			await onCreateInvoice({
				supplierOrderDocumentId: orderDocumentId,
				vendorName: formValues.vendorName.trim(),
				total: totalMoney,
				invoiceStatus: formValues.invoiceStatus,
				expirationDate: toIsoDateOrRaw(formValues.expirationDate),
				attachmentFile: formValues.attachmentFile,
			});
			toast.success(t("orders.invoiceCreated"));
		}

		setInvoiceDialogOpen(false);
		setEditingInvoice(null);
		setInvoiceInitialValues(EMPTY_INVOICE_FORM);
	};

	const confirmDeleteInvoice = async (invoice: SupplierOrderInvoice): Promise<void> => {
		try {
			await onDeleteInvoice(invoice.documentId);
			toast.success(t("orders.invoiceDeleted"));
		} catch (error) {
			toast.error(error instanceof Error ? error.message : t("orders.invoiceDeleteFailed"));
		}
	};

	const openCreatePayment = (invoice: SupplierOrderInvoice): void => {
		setEditingPayment(null);
		setPaymentInvoice(invoice);
		setPaymentInitialValues(EMPTY_PAYMENT_FORM);
		setPaymentDialogOpen(true);
	};

	const openEditPayment = (
		invoice: SupplierOrderInvoice,
		payment: SupplierOrderInvoicePayment,
	): void => {
		setPaymentInvoice(invoice);
		setEditingPayment(payment);
		setPaymentInitialValues({
			amount: moneyAmount(payment.paymentAmount),
			paymentDate: toDateInputValue(payment.paymentDate),
			method: payment.method,
			notes: payment.notes ?? "",
		});
		setPaymentDialogOpen(true);
	};

	const submitPayment = async (formValues: PaymentFormValues): Promise<void> => {
		if (!paymentInvoice) {
			return;
		}

		const paymentMoney: StrapiMoney = {
			amount: formValues.amount.trim(),
			currency_code: moneyCurrency(paymentInvoice.total, currency),
		};

		if (editingPayment) {
			await onUpdatePayment(editingPayment.documentId, {
				paymentAmount: paymentMoney,
				paymentDate: toIsoDateOrRaw(formValues.paymentDate),
				method: formValues.method,
				notes: formValues.notes,
			});
			toast.success(t("orders.paymentUpdated"));
		} else {
			await onCreatePayment({
				invoiceDocumentId: paymentInvoice.documentId,
				paymentAmount: paymentMoney,
				paymentDate: toIsoDateOrRaw(formValues.paymentDate),
				method: formValues.method,
				notes: formValues.notes,
			});
			toast.success(t("orders.paymentRecorded"));
		}

		setPaymentDialogOpen(false);
		setEditingPayment(null);
		setPaymentInvoice(null);
		setPaymentInitialValues(EMPTY_PAYMENT_FORM);
	};

	const confirmDeletePayment = async (
		payment: SupplierOrderInvoicePayment,
	): Promise<void> => {
		try {
			await onDeletePayment(payment.documentId);
			toast.success(t("orders.paymentDeleted"));
		} catch (error) {
			toast.error(error instanceof Error ? error.message : t("orders.paymentDeleteFailed"));
		}
	};

	return (
		<Card className="gap-0 border-none p-0 shadow-none">
			<CardHeader className="mb-4 flex flex-row items-center justify-between">
				<CardTitle>{t("orders.invoicesTitle")}</CardTitle>
				<Button size="sm" type="button" onClick={openCreateInvoice}>
					<Plus className="mr-2 size-4" />
					{t("orders.invoiceCreateAction")}
				</Button>
			</CardHeader>
			<CardContent className="space-y-4">
				{invoicesSorted.length === 0 ? (
					<p className="py-8 text-center text-muted-foreground">{t("orders.noInvoices")}</p>
				) : (
					invoicesSorted.map((invoice) => (
						<InvoiceCard
							key={invoice.documentId}
							currency={currency}
							invoice={invoice}
							mutating={mutating}
							supplierName={supplierName}
							onAddPayment={openCreatePayment}
							onConfirmDeleteInvoice={confirmDeleteInvoice}
							onConfirmDeletePayment={confirmDeletePayment}
							onEditInvoice={openEditInvoice}
							onEditPayment={openEditPayment}
						/>
					))
				)}
			</CardContent>

			<InvoiceDialog
				editingInvoice={editingInvoice}
				formCurrency={invoiceFormCurrency}
				initialValues={invoiceInitialValues}
				mutating={mutating}
				open={invoiceDialogOpen}
				onSubmit={submitInvoice}
				onOpenChange={(open) => {
					setInvoiceDialogOpen(open);
					if (!open) {
						setEditingInvoice(null);
						setInvoiceInitialValues(EMPTY_INVOICE_FORM);
					}
				}}
			/>

			<PaymentDialog
				amountCurrency={moneyCurrency(paymentInvoice?.total ?? null, currency)}
				editingPayment={editingPayment}
				initialValues={paymentInitialValues}
				mutating={mutating}
				open={paymentDialogOpen}
				onSubmit={submitPayment}
				onOpenChange={(open) => {
					setPaymentDialogOpen(open);
					if (!open) {
						setEditingPayment(null);
						setPaymentInvoice(null);
						setPaymentInitialValues(EMPTY_PAYMENT_FORM);
					}
				}}
			/>
		</Card>
	);
};
