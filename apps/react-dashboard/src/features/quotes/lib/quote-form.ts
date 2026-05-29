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
	supplierId: quote.supplier?.documentId ?? "",
	quotationDate: toDateInputValue(quote.quotation_date),
	expirationDate: toDateInputValue(quote.expiration_date),
	amount:
		quote.total?.amount !== undefined && quote.total?.amount !== null
			? String(quote.total.amount)
			: "",
	currencyCode: quote.total?.currency_code ?? DEFAULT_CURRENCY,
	notes: quote.notes ?? "",
	status: quote.quote_status ?? "pending",
	pdfFile: null,
	removeExistingPdf: false,
});
