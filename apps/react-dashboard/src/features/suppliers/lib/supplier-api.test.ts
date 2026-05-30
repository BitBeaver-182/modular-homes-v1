import { beforeEach, describe, expect, it, vi } from "vitest";

import type { SuppliersQueryParams } from "@/routes/$locale.o.$organizationSlug._admin._operations.suppliers";

import {
	createSupplier,
	deleteSupplier,
	getSuppliers,
	updateSupplier,
} from "./supplier-api";

const { moduflowRequestMock } = vi.hoisted(() => ({
	moduflowRequestMock: vi.fn(),
}));

vi.mock("@/lib/moduflow/client", () => ({
	moduflowRequest: moduflowRequestMock,
}));

describe("supplier Moduflow API", () => {
	const context = { organizationId: "42" };
	const params: SuppliersQueryParams = {
		page: 2,
		pageSize: 25,
		search: "acme",
		sortBy: "phoneNumber",
		sortOrder: "desc",
	};

	beforeEach(() => {
		moduflowRequestMock.mockReset();
		moduflowRequestMock.mockResolvedValue({
			data: [],
			meta: { pagination: {} },
		});
	});

	it("maps route params to querybuilder-compatible supplier query params", async () => {
		await getSuppliers(context, params);

		expect(moduflowRequestMock).toHaveBeenCalledWith(
			"/suppliers?page=2&limit=25&search=acme&sort%5Bfield%5D=phoneNumber&sort%5Bcriteria%5D=desc",
			{
				headers: { "x-organization-id": "42" },
				method: "GET",
			}
		);
	});

	it("sends organization headers and clean write payloads", async () => {
		await createSupplier(context, {
			name: " Acme ",
			phoneNumber: " 555 ",
			email: " orders@example.com ",
			address: {
				line1: " Main Street ",
				line2: " Suite 2 ",
				city: " Austin ",
				region: " TX ",
				postalCode: " 78701 ",
				countryCode: " us ",
			},
			website: " https://example.com ",
		});
		await updateSupplier(context, "7", {
			name: " Beta ",
			phoneNumber: "",
			email: "",
			address: {
				line1: "",
				line2: "",
				city: "",
				region: "",
				postalCode: "",
				countryCode: "",
			},
			website: "",
		});
		await deleteSupplier(context, "7");

		expect(moduflowRequestMock).toHaveBeenNthCalledWith(1, "/suppliers", {
			body: {
				name: "Acme",
				phoneNumber: "555",
				email: "orders@example.com",
				address: {
					line1: "Main Street",
					line2: "Suite 2",
					city: "Austin",
					region: "TX",
					postalCode: "78701",
					countryCode: "US",
				},
				website: "https://example.com",
			},
			headers: { "x-organization-id": "42" },
			method: "POST",
		});
		expect(moduflowRequestMock).toHaveBeenNthCalledWith(2, "/suppliers/7", {
			body: {
				name: "Beta",
				phoneNumber: "",
				email: "",
				address: {
					line1: "",
					line2: "",
					city: "",
					region: "",
					postalCode: "",
					countryCode: "",
				},
				website: "",
			},
			headers: { "x-organization-id": "42" },
			method: "PATCH",
		});
		expect(moduflowRequestMock).toHaveBeenNthCalledWith(3, "/suppliers/7", {
			headers: { "x-organization-id": "42" },
			method: "DELETE",
		});
	});
});
