import { type JSX, useEffect } from "react";
import { FormProvider, type FieldPath } from "react-hook-form";
import { useTranslation } from "react-i18next";

import { DateInput } from "@/components/forms/inputs/date-input";
import { FileUploadInput } from "@/components/forms/inputs/file-upload-input";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	QUOTE_MAX_ATTACHMENT_BYTES,
	QUOTE_MAX_ATTACHMENT_FILES,
} from "@/features/quotes/lib/quote-attachments";
import {
	SUPPLIER_INVOICE_STATUSES,
	type SupplierInvoiceStatus,
	type SupplierOrderInvoice,
} from "@/features/supplier-orders/types";
import { stripStrapiDataPrefix, useStrapiForm } from "@/lib/strapi";

export interface InvoiceFormValues {
	vendorName: string;
	totalAmount: string;
	invoiceStatus: SupplierInvoiceStatus;
	expirationDate: string;
	attachmentFile: File | null;
	removeExistingAttachment: boolean;
	root?: string;
}

interface InvoiceDialogProps {
	open: boolean;
	editingInvoice: SupplierOrderInvoice | null;
	initialValues: InvoiceFormValues;
	formCurrency: string;
	mutating: boolean;
	onOpenChange: (open: boolean) => void;
	onSubmit: (value: InvoiceFormValues) => Promise<void>;
}

const mapInvoiceField = (
	key: string,
): FieldPath<InvoiceFormValues> | undefined => {
	if (key === "root") {
		return "root";
	}
	if (key === "vendorName") {
		return "vendorName";
	}
	if (key === "invoiceStatus") {
		return "invoiceStatus";
	}
	if (key === "expirationDate") {
		return "expirationDate";
	}
	if (key === "attachment") {
		return "attachmentFile";
	}
	if (key === "total" || key.startsWith("total.amount") || key === "amount") {
		return "totalAmount";
	}
	if (key.startsWith("total.currency_code") || key === "currency_code") {
		return "totalAmount";
	}
	return undefined;
};

const invoiceStatusLabel = (status: SupplierInvoiceStatus): string =>
	status.charAt(0).toUpperCase() + status.slice(1);

export const InvoiceDialog = ({
	open,
	editingInvoice,
	initialValues,
	formCurrency,
	mutating,
	onOpenChange,
	onSubmit,
}: InvoiceDialogProps): JSX.Element => {
	const { t } = useTranslation();
	const form = useStrapiForm<InvoiceFormValues>({
		defaultValues: initialValues,
		mode: "onSubmit",
		normalize: stripStrapiDataPrefix,
		mapField: mapInvoiceField,
	});
	const {
		register,
		reset,
		submit,
		setValue,
		watch,
		formState: { errors },
	} = form;

	useEffect((): void => {
		if (!open) {
			return;
		}
		reset(initialValues);
	}, [initialValues, open, reset]);

	const rootError = errors.root?.message;
	const vendorNameError = errors.vendorName?.message;
	const totalAmountError = errors.totalAmount?.message;
	const invoiceStatusError = errors.invoiceStatus?.message;
	const expirationDateError = errors.expirationDate?.message;
	const attachmentError = errors.attachmentFile?.message;
	const invoiceStatus = watch("invoiceStatus");

	return (
		<Dialog modal open={open} onOpenChange={onOpenChange}>
			<DialogContent>
				<FormProvider {...form}>
					<form
						className="contents"
						onSubmit={submit(async (values): Promise<void> => {
							const { root: _root, ...payload } = values;
							void _root;
							await onSubmit(payload);
						})}
					>
						<DialogHeader>
							<DialogTitle>
								{editingInvoice ? t("orders.invoiceEditTitle") : t("orders.invoiceCreateTitle")}
							</DialogTitle>
						</DialogHeader>
						{rootError ? (
							<p className="text-destructive text-sm" role="alert">
								{rootError}
							</p>
						) : null}
						<FieldGroup className="gap-3">
							<Field data-invalid={Boolean(vendorNameError) || undefined}>
								<FieldLabel htmlFor="invoice-vendor">{t("orders.invoiceVendorName")}</FieldLabel>
								<Input
									aria-invalid={Boolean(vendorNameError)}
									disabled={mutating}
									id="invoice-vendor"
									{...register("vendorName")}
								/>
								{vendorNameError ? <FieldError>{vendorNameError}</FieldError> : null}
							</Field>

							<Field data-invalid={Boolean(totalAmountError) || undefined}>
								<FieldLabel htmlFor="invoice-total">
									{t("orders.invoiceTotalAmount", { currency: formCurrency })}
								</FieldLabel>
								<Input
									aria-invalid={Boolean(totalAmountError)}
									disabled={mutating}
									id="invoice-total"
									inputMode="decimal"
									type="text"
									{...register("totalAmount")}
								/>
								{totalAmountError ? <FieldError>{totalAmountError}</FieldError> : null}
							</Field>

							<Field data-invalid={Boolean(invoiceStatusError) || undefined}>
								<FieldLabel htmlFor="invoice-status">{t("orders.invoiceStatus")}</FieldLabel>
								<Select
									disabled={mutating}
									value={invoiceStatus}
									onValueChange={(value: SupplierInvoiceStatus) => {
										setValue("invoiceStatus", value, { shouldDirty: true });
									}}
								>
									<SelectTrigger id="invoice-status">
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										{SUPPLIER_INVOICE_STATUSES.map((status) => (
											<SelectItem key={status} value={status}>
												{invoiceStatusLabel(status)}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
								{invoiceStatusError ? <FieldError>{invoiceStatusError}</FieldError> : null}
							</Field>

							<Field data-invalid={Boolean(expirationDateError) || undefined}>
								<FieldLabel htmlFor="invoice-expiration">
									{t("orders.invoiceExpirationDate")}
								</FieldLabel>
								<DateInput
									calendarDisabled={undefined}
									defaultValue={watch("expirationDate")}
									disabled={mutating}
									id="invoice-expiration"
									invalid={Boolean(expirationDateError)}
									name="invoiceExpirationDate"
									placeholder={t("quotes.selectDate")}
									showPresets={false}
									valueYmd={watch("expirationDate")}
									onYmdChange={(ymd) => {
										setValue("expirationDate", ymd, { shouldDirty: true });
									}}
								/>
								{expirationDateError ? <FieldError>{expirationDateError}</FieldError> : null}
							</Field>

							<Field data-invalid={Boolean(attachmentError) || undefined}>
								<FieldLabel>{t("quotes.supportingDoc")}</FieldLabel>
								<FileUploadInput
									key={editingInvoice?.documentId ?? "invoice-create"}
									accept="application/pdf,.pdf"
									browseLabel={t("quotes.browse")}
									clearLabel={t("quotes.clearExistingPdf")}
									disabled={mutating}
									emptyLabel={t("quotes.dropPdf")}
									hint={t("quotes.pdfHint")}
									maxFiles={QUOTE_MAX_ATTACHMENT_FILES}
									maxSize={QUOTE_MAX_ATTACHMENT_BYTES}
									name="invoiceAttachment"
									existingFile={
										editingInvoice?.attachment?.url && editingInvoice.attachment.name
											? {
													href: editingInvoice.attachment.url,
													name: editingInvoice.attachment.name,
													size: editingInvoice.attachment.size,
												}
											: null
									}
									onExistingClear={() => {
										setValue("attachmentFile", null, { shouldDirty: true });
										setValue("removeExistingAttachment", true, { shouldDirty: true });
									}}
									onFilesChange={(files) => {
										setValue("attachmentFile", files[0] ?? null, { shouldDirty: true });
										setValue("removeExistingAttachment", false, { shouldDirty: true });
									}}
								/>
								{attachmentError ? <FieldError>{attachmentError}</FieldError> : null}
							</Field>
						</FieldGroup>
						<DialogFooter>
							<Button type="button" variant="outline" onClick={() => { onOpenChange(false); }}>
								{t("common.cancel")}
							</Button>
							<Button disabled={mutating} type="submit">
								{editingInvoice ? t("orders.save") : t("orders.create")}
							</Button>
						</DialogFooter>
					</form>
				</FormProvider>
			</DialogContent>
		</Dialog>
	);
};
