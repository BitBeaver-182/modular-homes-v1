import { beforeEach, describe, expect, it, vi } from "vitest";

import type { QuotesQueryParams } from "@/routes/$locale.o.$organizationSlug._admin._operations.quotes";

import { getQuotes, toQuoteQueryString } from "./quote-api";

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
			quote_status: ["received", "expired"],
			supplier_ids: ["7", "8"],
			quoteDate: { from: "2026-05-01", to: "2026-05-31" },
			amount: { min: 1000, max: 5000 },
		};

		await getQuotes(context, params);

		expect(moduflowRequestMock).toHaveBeenCalledWith(
			"/supplier-quotes?page=2&limit=25&search=sq-2026&sort%5Bfield%5D=supplier.name&sort%5Bcriteria%5D=desc&status=received&status=expired&supplierIds=7&supplierIds=8&quoteDateFrom=2026-05-01&quoteDateTo=2026-05-31&totalAmountMin=1000&totalAmountMax=5000",
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
});
