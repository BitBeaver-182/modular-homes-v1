import { beforeEach, describe, expect, it, vi } from "vitest";

import type { SupplierOrdersSearchParameters } from "@/features/supplier-orders/search-parameters";

import {
	getSupplierOrderDetail,
		getSupplierOrders,
	toSupplierOrderQueryString,
	updateSupplierOrder,
} from "./order-api";

const { moduflowRequestMock } = vi.hoisted(() => ({
	moduflowRequestMock: vi.fn(),
}));

vi.mock("@/lib/moduflow/client", () => ({
	moduflowRequest: moduflowRequestMock,
}));

describe("supplier order Moduflow API", () => {
	const context = { organizationId: "42" };

	beforeEach(() => {
		moduflowRequestMock.mockReset();
		moduflowRequestMock.mockResolvedValue({
			data: [],
			meta: { pagination: {} },
		});
	});

	it("maps the available supplier-order filters to the platform API query format", async () => {
		const params: SupplierOrdersSearchParameters = {
			page: 2,
			pageSize: 25,
			search: " SO-2026 ",
			sortBy: "orderStatus",
			sortOrder: "desc",
			order_status: ["draft", "processing"],
			supplier_ids: ["7", "8"],
			createdAt: { from: "2026-06-01", to: "2026-06-30" },
		};

		await getSupplierOrders(context, params);

		expect(moduflowRequestMock).toHaveBeenCalledWith(
			"/supplier-orders?page=2&limit=25&search=SO-2026&sortField=status&sortCriteria=desc&status=draft&status=processing&supplierIds=7&supplierIds=8&createdFrom=2026-06-01&createdTo=2026-06-30",
			{
				headers: { "x-organization-id": "42" },
				method: "GET",
			}
		);
	});

	it("omits empty filter values from the query string", () => {
		const params = {
			page: 1,
			pageSize: 10,
			search: "   ",
			sortBy: "orderStatus",
			order_status: [],
			supplier_ids: ["", "  "],
			createdAt: { from: "", to: undefined },
		} as SupplierOrdersSearchParameters;

		expect(toSupplierOrderQueryString(params)).toBe("page=1&limit=10");
	});

	it("requests supplier-order detail from the platform API", async () => {
		await getSupplierOrderDetail(context, "101");

		expect(moduflowRequestMock).toHaveBeenCalledWith(
			"/supplier-orders/101",
			{
				headers: { "x-organization-id": "42" },
				method: "GET",
			}
		);
	});

	it("patches supplier-order lines through the platform API", async () => {
		await updateSupplierOrder(context, "101", {
			orderLines: [
				{
					id: "91",
					description: "Updated line",
					quantity: 2,
					unitCost: 500,
				},
			],
		});

		expect(moduflowRequestMock).toHaveBeenCalledWith(
			"/supplier-orders/101",
			{
				body: {
					orderLines: [
						{
							id: "91",
							description: "Updated line",
							quantity: 2,
							unitCost: 500,
						},
					],
				},
				headers: { "x-organization-id": "42" },
				method: "PATCH",
			}
		);
	});
});
