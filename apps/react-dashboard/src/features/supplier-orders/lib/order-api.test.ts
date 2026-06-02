import { beforeEach, describe, expect, it, vi } from "vitest";

import type { SupplierOrdersSearchParameters } from "@/features/supplier-orders/search-parameters";

const { moduflowRequestMock } = vi.hoisted(() => ({
	moduflowRequestMock: vi.fn(),
}));

import {
	createSupplierOrderInvoice,
	deleteSupplierOrderInvoice,
	getSupplierOrderDetail,
	getSupplierOrders,
	updateSupplierOrderInvoice,
	toSupplierOrderQueryString,
	updateSupplierOrder,
} from "./order-api";

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

	it("creates a supplier-order invoice through the platform API", async () => {
		await createSupplierOrderInvoice(context, "101", {
			invoiceNumber: "INV-2026-001",
			invoiceType: "supplier_goods",
			status: "issued",
			issueDate: "2026-06-03",
			dueDate: "2026-06-30",
			notes: "Awaiting remainder",
			subtotalAmount: 1000,
			taxAmount: 150,
		});

		expect(moduflowRequestMock).toHaveBeenCalledWith(
			"/supplier-orders/101/invoices",
			{
				body: {
					invoiceNumber: "INV-2026-001",
					invoiceType: "supplier_goods",
					status: "issued",
					issueDate: "2026-06-03",
					dueDate: "2026-06-30",
					subtotalAmount: 1000,
					taxAmount: 150,
					notes: "Awaiting remainder",
				},
				headers: { "x-organization-id": "42" },
				method: "POST",
			}
		);
	});

	it("updates a supplier-order invoice through the platform API", async () => {
		await updateSupplierOrderInvoice(context, "101", "77", {
			invoiceNumber: "INV-2026-001",
			invoiceType: "supplier_goods",
			status: "partially_paid",
			issueDate: "2026-06-03",
			dueDate: "2026-06-30",
			notes: "Revised",
			subtotalAmount: 900,
			taxAmount: 135,
		});

		expect(moduflowRequestMock).toHaveBeenCalledWith(
			"/supplier-orders/101/invoices/77",
			{
				body: {
					invoiceNumber: "INV-2026-001",
					invoiceType: "supplier_goods",
					status: "partially_paid",
					issueDate: "2026-06-03",
					dueDate: "2026-06-30",
					subtotalAmount: 900,
					taxAmount: 135,
					notes: "Revised",
				},
				headers: { "x-organization-id": "42" },
				method: "PATCH",
			}
		);
	});

	it("passes a pending attachment id when creating an invoice", async () => {
		await createSupplierOrderInvoice(context, "101", {
			attachmentId: "file_123",
			dueDate: "2026-06-30",
			invoiceNumber: "INV-2026-004",
			invoiceType: "supplier_goods",
			issueDate: "2026-06-03",
			notes: null,
			status: "issued",
			subtotalAmount: 1000,
			taxAmount: 150,
		});

		expect(moduflowRequestMock).toHaveBeenCalledWith(
			"/supplier-orders/101/invoices",
			{
				body: {
					attachmentId: "file_123",
					dueDate: "2026-06-30",
					invoiceNumber: "INV-2026-004",
					invoiceType: "supplier_goods",
					issueDate: "2026-06-03",
					notes: null,
					status: "issued",
					subtotalAmount: 1000,
					taxAmount: 150,
				},
				headers: { "x-organization-id": "42" },
				method: "POST",
			},
		);
	});

	it("clears the existing attachment when updating an invoice", async () => {
		await updateSupplierOrderInvoice(context, "101", "77", {
			dueDate: "2026-06-30",
			invoiceNumber: "INV-2026-001",
			invoiceType: "supplier_goods",
			issueDate: "2026-06-03",
			notes: "Revised",
			attachmentId: null,
			status: "partially_paid",
			subtotalAmount: 900,
			taxAmount: 135,
		});

		expect(moduflowRequestMock).toHaveBeenCalledWith(
			"/supplier-orders/101/invoices/77",
			{
				body: {
					attachmentId: null,
					dueDate: "2026-06-30",
					invoiceNumber: "INV-2026-001",
					invoiceType: "supplier_goods",
					issueDate: "2026-06-03",
					notes: "Revised",
					status: "partially_paid",
					subtotalAmount: 900,
					taxAmount: 135,
				},
				headers: { "x-organization-id": "42" },
				method: "PATCH",
			},
		);
	});

	it("deletes a supplier-order invoice through the platform API", async () => {
		await deleteSupplierOrderInvoice(context, "101", "77");

		expect(moduflowRequestMock).toHaveBeenCalledWith(
			"/supplier-orders/101/invoices/77",
			{
				headers: { "x-organization-id": "42" },
				method: "DELETE",
			}
		);
	});
});
