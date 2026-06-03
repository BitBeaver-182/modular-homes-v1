import { type JSX, useEffect } from "react";
import { FormProvider, type FieldPath } from "react-hook-form";
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
import { stripStrapiDataPrefix, useStrapiForm } from "@/lib/strapi";

import { QuoteFormFields, type QuoteFormValues } from "./quote-form-fields";
import { quoteToWriteInput } from "../lib/quote-form";

import type { QuoteWriteInput } from "../types";
import type { SupplierQuoteResponse } from "@moduflow/types";

const EMPTY_VALUES: QuoteFormValues = {
	supplierId: "",
	quoteNumber: "",
	quotationDate: "",
	expirationDate: "",
	amount: "",
	currencyCode: "EUR",
	notes: "",
	status: "received",
	pdfFile: null,
	removeExistingPdf: false,
};

/**
 * Route Strapi error paths to the form fields they belong to. Covers the nested
 * `total.*` payload (UI merges amount+currency into a single field) and backend
 * aliases like `supplier` vs `supplier_id`.
 */
const mapQuoteField = (
	key: string,
): FieldPath<QuoteFormValues> | undefined => {
	console.log("mapQuoteField", { key });
	if (key === "root") {
		return "root";
	}

	if (
		key === "total" ||
		key.startsWith("total.amount") ||
		key === "amount" ||
		key === "subtotalAmount" ||
		key === "totalAmount"
	) {
		return "amount";
	}

	if (key.startsWith("total.currency_code") || key === "currency_code") {
		return "currencyCode";
	}

	if (key === "supplier" || key === "supplier_id" || key === "supplierId") {
		return "supplierId";
	}

	if (key === "quoteNumber" || key === "quote_number") {
		return "quoteNumber";
	}

	if (key === "quoteDate" || key === "issueAt" || key === "quotation_date") {
		return "quotationDate";
	}

	if (key === "validUntil" || key === "expiresAt" || key === "expiration_date") {
		return "expirationDate";
	}

	if (key === "status" || key === "quoteStatus" || key === "quote_status") {
		return "status";
	}

	if (key === "attachmentId" || key === "attachment" || key === "pdf") {
		return "pdfFile";
	}

	if (key === "notes") {
		return "notes";
	}

	return undefined;
};

export interface QuoteFormDialogProps {
	mode: "create" | "edit";
	open: boolean;
	onOpenChange: (open: boolean) => void;
	loading: boolean;
	initialQuote?: SupplierQuoteResponse | null;
	onSubmit: (value: QuoteWriteInput) => Promise<void>;
}

export const QuoteFormDialog = ({
	mode,
	open,
	onOpenChange,
	loading,
	initialQuote,
	onSubmit,
}: QuoteFormDialogProps): JSX.Element => {
	const { t } = useTranslation();
	const form = useStrapiForm<QuoteFormValues>({
		defaultValues: EMPTY_VALUES,
		mode: "onSubmit",
		normalize: stripStrapiDataPrefix,
		mapField: mapQuoteField,
	});
	const { reset, submit, formState } = form;

	useEffect((): void => {
		if (!open) {
			return;
		}

		if (mode === "edit" && initialQuote) {
			reset({ ...quoteToWriteInput(initialQuote), root: undefined });
			return;
		}

		reset(EMPTY_VALUES);
	}, [initialQuote, mode, open, reset]);

	const handleValid = async (values: QuoteFormValues): Promise<void> => {
		const { root: _root, ...payload } = values;
		void _root;
		await onSubmit(payload);
		onOpenChange(false);
	};

	const isCreate = mode === "create";
	const rootError = formState.errors.root?.message;

	return (
		<Dialog onOpenChange={onOpenChange} open={open}>
			<DialogContent className="max-h-[min(90dvh,900px)] gap-4 overflow-y-auto sm:max-w-3xl">
				<FormProvider {...form}>
					<form className="contents" onSubmit={submit(handleValid)}>
						<DialogHeader>
							<DialogTitle>
								{isCreate ? t("quotes.dialogAddTitle") : t("quotes.dialogEditTitle")}
							</DialogTitle>
							<DialogDescription>
								{isCreate ? t("quotes.dialogAddDesc") : t("quotes.dialogEditDesc")}
							</DialogDescription>
						</DialogHeader>

						{rootError ? (
							<p className="text-destructive text-sm" role="alert">
								{rootError}
							</p>
						) : null}

						<QuoteFormFields disabled={loading} initialQuote={initialQuote ?? null} />

						<DialogFooter>
							<Button disabled={loading} type="submit">
								{loading
									? isCreate
										? t("quotes.creatingQuote")
										: t("quotes.savingQuote")
									: isCreate
										? t("quotes.createQuote")
										: t("quotes.saveChanges")}
							</Button>
						</DialogFooter>
					</form>
				</FormProvider>
			</DialogContent>
		</Dialog>
	);
};
