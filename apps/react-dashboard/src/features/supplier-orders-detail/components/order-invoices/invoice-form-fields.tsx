import {
	SUPPLIER_ORDER_INVOICE_STATUSES,
	SUPPLIER_ORDER_INVOICE_TYPES,
	type SupplierOrderDetailInvoiceResponse,
} from "@moduflow/types";
import { type JSX } from "react";
import { Controller, useFormContext } from "react-hook-form";
import { useTranslation } from "react-i18next";

import { FileUploadInput } from "@/components/forms/inputs/file-upload-input";
import {
	Field,
	FieldError,
	FieldGroup,
	FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
	QUOTE_MAX_ATTACHMENT_BYTES,
	QUOTE_MAX_ATTACHMENT_FILES,
} from "@/features/quotes/lib/quote-attachments";

import type { InvoiceFormValues } from "./invoice-form-dialog";

const humanize = (value: string): string =>
	value
		.split("_")
		.map((part) => part.charAt(0).toUpperCase() + part.slice(1))
		.join(" ");

interface InvoiceFormFieldsProps {
	currency: string;
	disabled: boolean;
	initialInvoice: SupplierOrderDetailInvoiceResponse | null;
}

export const InvoiceFormFields = ({
	currency,
	disabled,
	initialInvoice,
}: InvoiceFormFieldsProps): JSX.Element => {
	const { t } = useTranslation();
	const {
		control,
		register,
		setValue,
		formState: { errors },
		watch,
	} = useFormContext<InvoiceFormValues>();

	const attachmentError = errors.attachmentFile?.message;
	const invoiceNumberError = errors.invoiceNumber?.message;
	const invoiceTypeError = errors.invoiceType?.message;
	const statusError = errors.status?.message;
	const issueDateError = errors.issueDate?.message;
	const dueDateError = errors.dueDate?.message;
	const subtotalAmountError = errors.subtotalAmount?.message;
	const taxAmountError = errors.taxAmount?.message;
	const notesError = errors.notes?.message;
	const derivedTotalAmount =
		(Number.parseFloat(watch("subtotalAmount") || "") || 0) +
		(Number.parseFloat(watch("taxAmount") || "") || 0);

	return (
		<FieldGroup className="grid gap-4">
			<Field data-invalid={Boolean(invoiceNumberError) || undefined}>
				<FieldLabel htmlFor="invoice-number">
					{t("orders.invoiceNumber", { defaultValue: "Invoice number" })}
				</FieldLabel>
				<Input
					aria-invalid={Boolean(invoiceNumberError)}
					disabled={disabled}
					id="invoice-number"
					placeholder={t("orders.invoiceNumber", { defaultValue: "Invoice number" })}
					{...register("invoiceNumber")}
				/>
				{invoiceNumberError ? <FieldError>{invoiceNumberError}</FieldError> : null}
			</Field>

			<div className="grid gap-4 md:grid-cols-2">
				<Field data-invalid={Boolean(invoiceTypeError) || undefined}>
					<FieldLabel htmlFor="invoice-type">
						{t("orders.invoiceType", { defaultValue: "Invoice type" })}
					</FieldLabel>
					<Controller
						control={control}
						name="invoiceType"
						render={({ field }) => (
							<Select
								disabled={disabled}
								onValueChange={(next) => {
									field.onChange(next);
								}}
								value={field.value}
							>
								<SelectTrigger
									aria-invalid={Boolean(invoiceTypeError)}
									className="w-full"
									id="invoice-type"
								>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									{SUPPLIER_ORDER_INVOICE_TYPES.map((type) => (
										<SelectItem key={type} value={type}>
											{humanize(type)}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						)}
					/>
					{invoiceTypeError ? <FieldError>{invoiceTypeError}</FieldError> : null}
				</Field>

				<Field data-invalid={Boolean(statusError) || undefined}>
					<FieldLabel htmlFor="invoice-status">
						{t("orders.invoiceStatus")}
					</FieldLabel>
					<Controller
						control={control}
						name="status"
						render={({ field }) => (
							<Select
								disabled={disabled}
								onValueChange={(next) => {
									field.onChange(next);
								}}
								value={field.value}
							>
								<SelectTrigger
									aria-invalid={Boolean(statusError)}
									className="w-full"
									id="invoice-status"
								>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									{SUPPLIER_ORDER_INVOICE_STATUSES.map((status) => (
										<SelectItem key={status} value={status}>
											{humanize(status)}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						)}
					/>
					{statusError ? <FieldError>{statusError}</FieldError> : null}
				</Field>
			</div>

			<div className="grid gap-4 md:grid-cols-2">
				<Field data-invalid={Boolean(issueDateError) || undefined}>
					<FieldLabel htmlFor="invoice-issue-date">
						{t("orders.invoiceIssueDate", { defaultValue: "Issue date" })}
					</FieldLabel>
					<Input
						aria-invalid={Boolean(issueDateError)}
						disabled={disabled}
						id="invoice-issue-date"
						type="date"
						{...register("issueDate")}
					/>
					{issueDateError ? <FieldError>{issueDateError}</FieldError> : null}
				</Field>

				<Field data-invalid={Boolean(dueDateError) || undefined}>
					<FieldLabel htmlFor="invoice-due-date">
						{t("orders.invoiceDueDate", { defaultValue: "Due date" })}
					</FieldLabel>
					<Input
						aria-invalid={Boolean(dueDateError)}
						disabled={disabled}
						id="invoice-due-date"
						type="date"
						{...register("dueDate")}
					/>
					{dueDateError ? <FieldError>{dueDateError}</FieldError> : null}
				</Field>
			</div>

			<div className="grid gap-4 md:grid-cols-2">
				<Field data-invalid={Boolean(subtotalAmountError) || undefined}>
					<FieldLabel htmlFor="invoice-subtotal">
						{t("orders.invoiceSubtotalAmount", {
							defaultValue: "Subtotal amount ({{currency}})",
							currency,
						})}
					</FieldLabel>
					<Input
						aria-invalid={Boolean(subtotalAmountError)}
						disabled={disabled}
						id="invoice-subtotal"
						inputMode="decimal"
						placeholder={t("orders.invoiceSubtotalAmount", {
							defaultValue: "Subtotal amount ({{currency}})",
							currency,
						})}
						{...register("subtotalAmount")}
					/>
					{subtotalAmountError ? <FieldError>{subtotalAmountError}</FieldError> : null}
				</Field>

				<Field data-invalid={Boolean(taxAmountError) || undefined}>
					<FieldLabel htmlFor="invoice-tax">
						{t("orders.invoiceTaxAmount", {
							defaultValue: "Tax amount ({{currency}})",
							currency,
						})}
					</FieldLabel>
					<Input
						aria-invalid={Boolean(taxAmountError)}
						disabled={disabled}
						id="invoice-tax"
						inputMode="decimal"
						placeholder={t("orders.invoiceTaxAmount", {
							defaultValue: "Tax amount ({{currency}})",
							currency,
						})}
						{...register("taxAmount")}
					/>
					{taxAmountError ? <FieldError>{taxAmountError}</FieldError> : null}
				</Field>
			</div>

			<div className="rounded-lg border bg-muted/40 px-4 py-3">
				<p className="text-sm text-muted-foreground">
					{t("orders.invoiceDerivedTotal", { defaultValue: "Derived total" })}
				</p>
				<p className="text-lg font-semibold">{derivedTotalAmount.toFixed(2)}</p>
			</div>

			<Field data-invalid={Boolean(notesError) || undefined}>
				<FieldLabel htmlFor="invoice-notes">
					{t("orders.invoiceNotes", { defaultValue: "Notes" })}
				</FieldLabel>
				<Textarea
					aria-invalid={Boolean(notesError)}
					disabled={disabled}
					id="invoice-notes"
					rows={4}
					{...register("notes")}
				/>
				{notesError ? <FieldError>{notesError}</FieldError> : null}
			</Field>

			<Field data-invalid={Boolean(attachmentError) || undefined}>
				<FieldLabel>{t("quotes.supportingDoc")}</FieldLabel>
				<Controller
					control={control}
					name="attachmentFile"
					render={({ field }) => (
						<FileUploadInput
							accept="application/pdf,.pdf"
							browseLabel={t("quotes.browse")}
							clearLabel={t("quotes.clearExistingPdf")}
							disabled={disabled}
							emptyLabel={t("quotes.dropPdf")}
							existingFile={
								initialInvoice?.attachment?.url && initialInvoice.attachment.filename
									? {
										href: initialInvoice.attachment.url,
										name: initialInvoice.attachment.filename,
									}
									: null
							}
							hint={t("quotes.pdfHint")}
							key={initialInvoice?.id ?? "create"}
							maxFiles={QUOTE_MAX_ATTACHMENT_FILES}
							maxSize={QUOTE_MAX_ATTACHMENT_BYTES}
							name="invoiceAttachment"
							onExistingClear={() => {
								field.onChange(null);
								setValue("removeExistingAttachment", true, { shouldDirty: true });
							}}
							onFilesChange={(files) => {
								field.onChange(files[0] ?? null);
								setValue("removeExistingAttachment", false, { shouldDirty: true });
							}}
						/>
					)}
				/>
				{attachmentError ? <FieldError>{attachmentError}</FieldError> : null}
			</Field>
		</FieldGroup>
	);
};
