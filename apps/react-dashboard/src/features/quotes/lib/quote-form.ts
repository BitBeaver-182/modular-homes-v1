import type { QuoteWriteInput } from "../types";
import type { SupplierQuoteResponse } from "@moduflow/types";


const DEFAULT_CURRENCY = "EUR";

export const toDateInputValue = (value: string | null): string => {
	if (!value) {
		return "";
	}

	const parsedDate = new Date(value);
	if (Number.isNaN(parsedDate.getTime())) {
		return "";
	}

	return parsedDate.toISOString().slice(0, 10);
};

export const quoteToWriteInput = (
	quote: SupplierQuoteResponse
): QuoteWriteInput => ({
	supplierId: quote.supplier.id,
	quoteNumber: quote.quoteNumber ?? "",
	quotationDate: toDateInputValue(quote.quoteDate),
	expirationDate: toDateInputValue(quote.validUntil),
	amount: String(quote.subtotalAmount ?? ""),
	currencyCode: quote.currencyCode ?? DEFAULT_CURRENCY,
	notes: quote.notes ?? "",
	status: quote.status,
	pdfFile: null,
	removeExistingPdf: false,
});
