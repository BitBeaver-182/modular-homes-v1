import { type JSX, useEffect } from "react";
import { FormProvider } from "react-hook-form";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { useModuflowForm } from "@/lib/moduflow/use-moduflow-form";

import { InvoiceFormFields } from "./invoice-form-fields";

import type {
	CreateSupplierOrderInvoiceRequest,
	SupplierOrderDetailInvoiceResponse,
	SupplierOrderInvoiceStatus,
	SupplierOrderInvoiceType,
	UpdateSupplierOrderInvoiceRequest,
} from "@moduflow/types";

export interface InvoiceFormValues {
	attachmentFile: File | null;
	dueDate: string;
	invoiceNumber: string;
	invoiceType: SupplierOrderInvoiceType;
	issueDate: string;
	notes: string;
	removeExistingAttachment: boolean;
	status: SupplierOrderInvoiceStatus;
	subtotalAmount: string;
	taxAmount: string;
	root?: string;
}

interface InvoiceFormDialogProps {
	currency: string;
	initialInvoice: SupplierOrderDetailInvoiceResponse | null;
	loading: boolean;
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onSubmit: (values: InvoiceFormValues) => Promise<void>;
}

const EMPTY_VALUES: InvoiceFormValues = {
	attachmentFile: null,
	dueDate: "",
	invoiceNumber: "",
	invoiceType: "supplier_goods",
	issueDate: "",
	notes: "",
	removeExistingAttachment: false,
	status: "draft",
	subtotalAmount: "",
	taxAmount: "0",
};

const toDateInputValue = (value: string | null): string =>
	value ? value.slice(0, 10) : "";

const toFormValues = (
	invoice: SupplierOrderDetailInvoiceResponse | null,
): InvoiceFormValues =>
	invoice
		? {
				attachmentFile: null,
				dueDate: toDateInputValue(invoice.dueDate),
				invoiceNumber: invoice.invoiceNumber,
				invoiceType: invoice.invoiceType,
				issueDate: toDateInputValue(invoice.issueDate),
				notes: invoice.notes ?? "",
				removeExistingAttachment: false,
				status: invoice.status,
				subtotalAmount: String(invoice.subtotalAmount.amount),
				taxAmount: String(invoice.taxAmount.amount),
			}
		: EMPTY_VALUES;

const mapInvoiceField = (key: string) => {
	const fieldMap: Record<string, keyof InvoiceFormValues> = {
		invoiceNumber: "invoiceNumber",
		invoiceType: "invoiceType",
		status: "status",
		issueDate: "issueDate",
		dueDate: "dueDate",
		subtotalAmount: "subtotalAmount",
		taxAmount: "taxAmount",
		attachmentId: "attachmentFile",
		attachment: "attachmentFile",
		notes: "notes",
		root: "root",
		"": "root",
	};

	return fieldMap[key];
};

export const normalizeInvoiceInput = (
	form: InvoiceFormValues,
	attachmentId?: string | null,
): CreateSupplierOrderInvoiceRequest | UpdateSupplierOrderInvoiceRequest => ({
	dueDate: form.dueDate,
	invoiceNumber: form.invoiceNumber.trim(),
	invoiceType: form.invoiceType,
	issueDate: form.issueDate,
	notes: form.notes.trim() || null,
	status: form.status,
	subtotalAmount: Number(form.subtotalAmount),
	taxAmount: Number(form.taxAmount),
	...(attachmentId !== undefined ? { attachmentId } : {}),
});

export const InvoiceFormDialog = ({
	currency,
	initialInvoice,
	loading,
	open,
	onOpenChange,
	onSubmit,
}: InvoiceFormDialogProps): JSX.Element => {
	const { t } = useTranslation();
	const form = useModuflowForm<InvoiceFormValues>({
		defaultValues: EMPTY_VALUES,
		mapField: mapInvoiceField,
		mode: "onSubmit",
	});
	const { reset, submit, formState } = form;

	useEffect((): void => {
		if (!open) {
			return;
		}

		reset(toFormValues(initialInvoice));
	}, [initialInvoice, open, reset]);

	const rootError = formState.errors.root?.message;

	return (
		<Dialog onOpenChange={onOpenChange} open={open}>
			<DialogContent className="max-h-[min(90dvh,900px)] gap-4 overflow-y-auto sm:max-w-2xl">
				<FormProvider {...form}>
					<form className="contents" onSubmit={submit(onSubmit)}>
						<DialogHeader>
							<DialogTitle>
								{initialInvoice
									? t("orders.invoiceEditTitle")
									: t("orders.invoiceCreateTitle")}
							</DialogTitle>
							<DialogDescription>
								{t("orders.invoiceDialogDescription", {
									defaultValue:
										"Manage invoice header details for this supplier order. Total is derived from subtotal and tax.",
								})}
							</DialogDescription>
						</DialogHeader>

						{rootError ? (
							<p className="text-destructive text-sm" role="alert">
								{rootError}
							</p>
						) : null}

						<InvoiceFormFields
							currency={currency}
							disabled={loading}
							initialInvoice={initialInvoice}
						/>

						<DialogFooter>
							<Button
								disabled={loading}
								type="button"
								variant="outline"
								onClick={() => {
									onOpenChange(false);
								}}
							>
								{t("common.cancel")}
							</Button>
							<Button disabled={loading} type="submit">
								{initialInvoice ? t("orders.save") : t("orders.create")}
							</Button>
						</DialogFooter>
					</form>
				</FormProvider>
			</DialogContent>
		</Dialog>
	);
};
