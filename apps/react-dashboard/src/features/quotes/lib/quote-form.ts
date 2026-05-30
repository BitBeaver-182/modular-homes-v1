import type { Quote, QuoteWriteInput } from "../types";

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

export const quoteToWriteInput = (quote: Quote): QuoteWriteInput => ({
	supplierId: quote.supplier.id,
	quoteNumber: quote.quoteNumber ?? "",
	quotationDate: toDateInputValue(quote.quoteDate),
	expirationDate: toDateInputValue(quote.validUntil),
	amount: String(quote.totalAmount ?? ""),
	currencyCode: quote.currencyCode ?? DEFAULT_CURRENCY,
	notes: quote.notes ?? "",
	status: quote.status,
	pdfFile: null,
	removeExistingPdf: false,
});
