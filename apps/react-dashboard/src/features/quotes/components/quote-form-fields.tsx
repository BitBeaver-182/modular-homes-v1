/* eslint-disable @typescript-eslint/explicit-function-return-type, @typescript-eslint/explicit-module-boundary-types, react/jsx-sort-props */
import { useMemo, useState } from "react";
import { Controller, useFormContext } from "react-hook-form";
import { startOfDay } from "date-fns";
import { useTranslation } from "react-i18next";

import { CurrencyAmountInput } from "@/components/forms/inputs/currency-amount-input";
import { DateInput } from "@/components/forms/inputs/date-input";
import { FileUploadInput } from "@/components/forms/inputs/file-upload-input";
import { SuppliersCombobox } from "@/components/forms/inputs/suppliers-combobox";
import {
	Field,
	FieldError,
	FieldGroup,
	FieldLabel,
} from "@/components/ui/field";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { parseYmdLocal } from "@/lib/date-ymd";

import type { Supplier } from "@/features/suppliers/types";

import {
	QUOTE_MAX_ATTACHMENT_BYTES,
	QUOTE_MAX_ATTACHMENT_FILES,
} from "../lib/quote-attachments";
import type { Quote, QuoteStatus, QuoteWriteInput } from "../types";

/** RHF values = write payload + optional `root` for server-only errors. */
export type QuoteFormValues = QuoteWriteInput & { root?: string };

export type QuoteFormFieldsProps = {
	disabled?: boolean;
	initialQuote?: Quote | null;
};

export const QuoteFormFields = ({
	disabled = false,
	initialQuote = null,
}: QuoteFormFieldsProps) => {
	const { t } = useTranslation();
	const {
		control,
		register,
		formState: { errors },
		watch,
		setValue,
		getValues,
	} = useFormContext<QuoteFormValues>();

	const supplierId = watch("supplierId");
	const quotationDate = watch("quotationDate");

	const supplierError = errors.supplierId?.message;
	const quotationDateError = errors.quotationDate?.message;
	const expirationDateError = errors.expirationDate?.message;
	const amountError = errors.amount?.message;
	const statusError = errors.status?.message;
	const notesError = errors.notes?.message;
	const pdfError = errors.pdfFile?.message;

	const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(
		initialQuote?.supplier ?? null,
	);
	const supplierValue = supplierId ? selectedSupplier : null;

	const quotationFloor = useMemo(() => {
		const q = quotationDate.trim();
		if (!q) {
			return null;
		}

		return parseYmdLocal(q);
	}, [quotationDate]);

	const expirationCalendarDisabled = quotationFloor
		? [{ before: startOfDay(quotationFloor) }]
		: undefined;

	return (
		<FieldGroup className="grid gap-4 sm:grid-cols-2">
			<Field className="sm:col-span-2" data-invalid={Boolean(supplierError) || undefined}>
				<FieldLabel htmlFor="quote-supplier">{t("quotes.supplier")}</FieldLabel>
				<Controller
					control={control}
					name="supplierId"
					render={({ field }) => (
						<SuppliersCombobox
							clearable
							disabled={disabled}
							id="quote-supplier"
							invalid={Boolean(supplierError)}
							onChange={(next) => {
								setSelectedSupplier(next ?? null);
								field.onChange(next?.documentId ?? "");
							}}
							value={supplierValue}
						/>
					)}
				/>
				{supplierError ? <FieldError>{supplierError}</FieldError> : null}
			</Field>

			<Field data-invalid={Boolean(quotationDateError) || undefined}>
				<FieldLabel htmlFor="quote-quotation-date">
					{t("quotes.quotationDate")}
				</FieldLabel>
				<Controller
					control={control}
					name="quotationDate"
					render={({ field }) => (
						<DateInput
							calendarDisabled={undefined}
							defaultValue={field.value}
							disabled={disabled}
							id="quote-quotation-date"
							invalid={Boolean(quotationDateError)}
							name=""
							onYmdChange={(ymd) => {
								const currentExpiration = getValues("expirationDate");
								const nextExpiration =
									currentExpiration && ymd && currentExpiration < ymd
										? ""
										: currentExpiration;
								field.onChange(ymd);
								if (nextExpiration !== currentExpiration) {
									setValue("expirationDate", nextExpiration, { shouldDirty: true });
								}
							}}
							placeholder={t("quotes.selectDate")}
							showPresets={false}
							valueYmd={field.value}
						/>
					)}
				/>
				{quotationDateError ? <FieldError>{quotationDateError}</FieldError> : null}
			</Field>

			<Field data-invalid={Boolean(expirationDateError) || undefined}>
				<FieldLabel htmlFor="quote-expiration-date">
					{t("quotes.expirationDate")}
				</FieldLabel>
				<Controller
					control={control}
					name="expirationDate"
					render={({ field }) => (
						<DateInput
							calendarDisabled={expirationCalendarDisabled}
							defaultValue={field.value}
							disabled={disabled}
							id="quote-expiration-date"
							invalid={Boolean(expirationDateError)}
							name=""
							onYmdChange={(ymd) => {
								field.onChange(ymd);
							}}
							placeholder={t("quotes.selectDate")}
							showPresets={false}
							valueYmd={field.value}
						/>
					)}
				/>
				{expirationDateError ? <FieldError>{expirationDateError}</FieldError> : null}
			</Field>

			<Field data-invalid={Boolean(amountError) || undefined}>
				<FieldLabel htmlFor="quote-amount">{t("quotes.amount")}</FieldLabel>
				<Controller
					control={control}
					name="amount"
					render={({ field: amountField }) => (
						<Controller
							control={control}
							name="currencyCode"
							render={({ field: currencyField }) => (
								<CurrencyAmountInput
									amountValue={amountField.value}
									currencyValue={currencyField.value}
									defaultCurrency={currencyField.value}
									defaultValue={amountField.value}
									disabled={disabled}
									id="quote-amount"
									invalid={Boolean(amountError)}
									name="total"
									onAmountValueChange={(amount) => {
										amountField.onChange(amount);
									}}
									onCurrencyValueChange={(currencyCode) => {
										currencyField.onChange(currencyCode);
									}}
									placeholder={t("quotes.placeAmount")}
								/>
							)}
						/>
					)}
				/>
				{amountError ? <FieldError>{amountError}</FieldError> : null}
			</Field>

			<Field data-invalid={Boolean(statusError) || undefined}>
				<FieldLabel htmlFor="quote-status">{t("quotes.status")}</FieldLabel>
				<Controller
					control={control}
					name="status"
					render={({ field }) => (
						<Select
							disabled={disabled}
							onValueChange={(next) => {
								field.onChange(next as QuoteStatus);
							}}
							value={field.value}
						>
							<SelectTrigger
								aria-invalid={Boolean(statusError)}
								className="w-full"
								id="quote-status"
							>
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="pending">{t("quotes.statusPending")}</SelectItem>
								<SelectItem value="accepted">{t("quotes.statusAccepted")}</SelectItem>
								<SelectItem value="rejected">{t("quotes.statusRejected")}</SelectItem>
							</SelectContent>
						</Select>
					)}
				/>
				{statusError ? <FieldError>{statusError}</FieldError> : null}
			</Field>

			<Field className="sm:col-span-2" data-invalid={Boolean(notesError) || undefined}>
				<FieldLabel htmlFor="quote-notes">{t("quotes.notes")}</FieldLabel>
				<Textarea
					aria-invalid={Boolean(notesError)}
					className="min-h-[80px] resize-y"
					disabled={disabled}
					id="quote-notes"
					placeholder={t("quotes.placeNotes")}
					rows={3}
					{...register("notes")}
				/>
				{notesError ? <FieldError>{notesError}</FieldError> : null}
			</Field>

			<Field className="sm:col-span-2" data-invalid={Boolean(pdfError) || undefined}>
				<FieldLabel>{t("quotes.supportingDoc")}</FieldLabel>
				<Controller
					control={control}
					name="pdfFile"
					render={({ field }) => (
						<FileUploadInput
							accept="application/pdf,.pdf"
							browseLabel={t("quotes.browse")}
							clearLabel={t("quotes.clearExistingPdf")}
							disabled={disabled}
							emptyLabel={t("quotes.dropPdf")}
							existingFile={
								initialQuote?.pdf?.url && initialQuote.pdf.name
									? {
											href: initialQuote.pdf.url,
											name: initialQuote.pdf.name,
											size: initialQuote.pdf.size,
										}
									: null
							}
							hint={t("quotes.pdfHint")}
							key={initialQuote?.documentId ?? "create"}
							maxFiles={QUOTE_MAX_ATTACHMENT_FILES}
							maxSize={QUOTE_MAX_ATTACHMENT_BYTES}
							name="quotePdf"
							onExistingClear={() => {
								setValue("removeExistingPdf", true, { shouldDirty: true });
							}}
							onFilesChange={(files) => {
								field.onChange(files[0] ?? null);
								setValue("removeExistingPdf", false, { shouldDirty: true });
							}}
						/>
					)}
				/>
				{pdfError ? <FieldError>{pdfError}</FieldError> : null}
			</Field>
		</FieldGroup>
	);
};
