import { beforeEach, describe, expect, it, vi } from "vitest";

import type { QuotesQueryParams } from "@/routes/$locale.o.$organizationSlug._admin._operations.quotes";

import { createQuote, getQuotes, toQuoteQueryString, updateQuote } from "./quote-api";

const { moduflowRequestMock } = vi.hoisted(() => ({
	moduflowRequestMock: vi.fn(),
}));
const { uploadSupplierDocumentMock } = vi.hoisted(() => ({
	uploadSupplierDocumentMock: vi.fn(),
}));

vi.mock("@/lib/moduflow/client", () => ({
	moduflowRequest: moduflowRequestMock,
}));
vi.mock("./upload-api", () => ({
	uploadSupplierDocument: uploadSupplierDocumentMock,
}));

describe("quote Moduflow API", () => {
	const context = { organizationId: "42" };

	beforeEach(() => {
		moduflowRequestMock.mockReset();
		moduflowRequestMock.mockResolvedValue({
			data: [],
			meta: { pagination: {} },
		});
		uploadSupplierDocumentMock.mockReset();
	});

	it("maps the available quote filters to the platform API query format", async () => {
		const params: QuotesQueryParams = {
			page: 2,
			pageSize: 25,
			search: " sq-2026 ",
			sortBy: "supplier.name",
			sortOrder: "desc",
			quote_status: ["received", "accepted"],
			supplier_ids: ["7", "8"],
			quoteDate: { from: "2026-05-01", to: "2026-05-31" },
			amount: { min: 1000, max: 5000 },
		};

		await getQuotes(context, params);

		expect(moduflowRequestMock).toHaveBeenCalledWith(
			"/supplier-quotes?page=2&limit=25&search=sq-2026&sortField=supplier.name&sortCriteria=desc&status=received&status=accepted&supplierIds=7&supplierIds=8&quoteDateFrom=2026-05-01&quoteDateTo=2026-05-31&totalAmountMin=1000&totalAmountMax=5000",
			{
				headers: { "x-organization-id": "42" },
				method: "GET",
			}
		);
	});

	it("maps expired as a dedicated backend filter while preserving other statuses", async () => {
		const params: QuotesQueryParams = {
			page: 1,
			pageSize: 10,
			quote_status: ["expired", "accepted"],
		};

		await getQuotes(context, params);

		expect(moduflowRequestMock).toHaveBeenCalledWith(
			"/supplier-quotes?page=1&limit=10&status=accepted&isExpired=true",
			{
				headers: { "x-organization-id": "42" },
				method: "GET",
			}
		);
	});

	it("omits empty filter values so unavailable filters do not leak into the query", () => {
		const params = {
			page: 1,
			pageSize: 10,
			search: "   ",
			sortBy: "quoteNumber",
			quote_status: [],
			supplier_ids: ["", "  "],
			quoteDate: { from: "", to: undefined },
			amount: { min: undefined, max: undefined },
		} as QuotesQueryParams;

		expect(toQuoteQueryString(params)).toBe(
			"page=1&limit=10"
		);
	});

	it("uses subtotal-only write payloads and rolls back uploaded files on create failure", async () => {
		const file = new File(["pdf"], "quote.pdf", { type: "application/pdf" });
		uploadSupplierDocumentMock.mockResolvedValue({ id: "file_123" });
		moduflowRequestMock
			.mockRejectedValueOnce(new Error("quote failed"))
			.mockResolvedValueOnce(undefined);

		await expect(
			createQuote(context, {
				supplierId: "7",
				quoteNumber: "SQ-1",
				quotationDate: "2026-05-01",
				expirationDate: "2026-05-31",
				amount: "2500",
				currencyCode: "eur",
				notes: "",
				status: "received",
				pdfFile: file,
				removeExistingPdf: false,
			})
		).rejects.toThrow("quote failed");

		const createRequest = moduflowRequestMock.mock.calls[0]?.[1] as {
			body: Record<string, unknown>;
		};
		expect(moduflowRequestMock).toHaveBeenNthCalledWith(1, "/supplier-quotes", {
			body: expect.objectContaining({
				subtotalAmount: 2500,
			}),
			headers: { "x-organization-id": "42" },
			method: "POST",
		});
		expect(createRequest.body).not.toHaveProperty("totalAmount");
		expect(moduflowRequestMock).toHaveBeenNthCalledWith(2, "/uploads/file_123", {
			headers: { "x-organization-id": "42" },
			method: "DELETE",
		});
	});

	it("rolls back a newly uploaded replacement file when quote update fails", async () => {
		const file = new File(["pdf"], "replacement.pdf", { type: "application/pdf" });
		uploadSupplierDocumentMock.mockResolvedValue({ id: "file_456" });
		moduflowRequestMock
			.mockRejectedValueOnce(new Error("update failed"))
			.mockResolvedValueOnce(undefined);

		await expect(
			updateQuote(context, "99", {
				supplierId: "7",
				quoteNumber: "SQ-1",
				quotationDate: "2026-05-01",
				expirationDate: "2026-05-31",
				amount: "2500",
				currencyCode: "EUR",
				notes: "",
				status: "received",
				pdfFile: file,
				removeExistingPdf: false,
			})
		).rejects.toThrow("update failed");

		expect(moduflowRequestMock).toHaveBeenNthCalledWith(
			2,
			"/uploads/file_456",
			{
				headers: { "x-organization-id": "42" },
				method: "DELETE",
			}
		);
	});
});
