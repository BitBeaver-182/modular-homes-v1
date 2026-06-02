import { beforeEach, describe, expect, it, vi } from "vitest";

import type { QuotesQueryParams } from "@/routes/$locale.o.$organizationSlug._admin._operations.quotes";

import {
	buildCreateQuotePayload,
	buildUpdateQuotePayload,
	createQuote,
	getQuotes,
	toQuoteQueryString,
	updateQuote,
} from "./quote-api";

const { moduflowRequestMock } = vi.hoisted(() => ({
	moduflowRequestMock: vi.fn(),
}));

vi.mock("@/lib/moduflow/client", () => ({
	moduflowRequest: moduflowRequestMock,
}));

describe("quote Moduflow API", () => {
	const context = { organizationId: "42" };

	beforeEach(() => {
		moduflowRequestMock.mockReset();
		moduflowRequestMock.mockResolvedValue({
			data: [],
			meta: { pagination: {} },
		});
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

	it("uses subtotal-only write payloads when creating quotes", async () => {
		await createQuote(
			context,
			buildCreateQuotePayload(
				{
					supplierId: "7",
					quoteNumber: "SQ-1",
					quotationDate: "2026-05-01",
					expirationDate: "2026-05-31",
					amount: "2500",
					currencyCode: "eur",
					notes: "",
					status: "received",
					pdfFile: null,
					removeExistingPdf: false,
				},
				undefined,
			),
		);

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
	});

	it("passes a pending attachment id when updating quotes", async () => {
		await updateQuote(
			context,
			"99",
			buildUpdateQuotePayload(
				{
					supplierId: "7",
					quoteNumber: "SQ-1",
					quotationDate: "2026-05-01",
					expirationDate: "2026-05-31",
					amount: "2500",
					currencyCode: "EUR",
					notes: "",
					status: "received",
					pdfFile: null,
					removeExistingPdf: false,
				},
				"file_456",
			),
		);

		expect(moduflowRequestMock).toHaveBeenNthCalledWith(
			1,
			"/supplier-quotes/99",
			{
				body: expect.objectContaining({
					attachmentId: "file_456",
				}),
				headers: { "x-organization-id": "42" },
				method: "PATCH",
			}
		);
	});
});
