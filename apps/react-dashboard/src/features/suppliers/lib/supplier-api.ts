import { strapiClient } from "@/lib/strapi";
import type { StrapiQueryParams } from "@/lib/strapi";
import type { SuppliersQueryParams } from "@/routes/$locale.o.$organizationSlug._admin._operations.suppliers";

import type { PaginatedResult, Supplier, SupplierWriteInput } from "../types";

/**
 * Translates our standard route query params into Strapi's specific format.
 * Keeping this adapter here means if the backend shape changes (or we switch
 * to another provider), only this function has to move.
 */
const toStrapiQueryParams = (
	params: SuppliersQueryParams
): StrapiQueryParams<Array<Supplier>> => {
	const sort = params.sortBy
		? `${params.sortBy}:${params.sortOrder === "asc" ? "asc" : "desc"}`
		: undefined;

	const query: StrapiQueryParams<Array<Supplier>> = {
		pagination: {
			page: params.page,
			pageSize: params.pageSize,
		},
		sort,
	};

	if (params.search) {
		query.filters = {
			$or: [
				{ name: { $containsi: params.search } },
				{ email: { $containsi: params.search } },
				{ phone_number: { $containsi: params.search } },
				{ address: { $containsi: params.search } },
				{ website: { $containsi: params.search } },
			],
		};
	}

	return query;
};

const sanitizeWriteInput = (input: SupplierWriteInput): SupplierWriteInput => ({
	name: input.name.trim(),
	phone_number: input.phone_number.trim(),
	email: input.email.trim(),
	address: input.address.trim(),
	website: input.website.trim(),
});

export const getSuppliers = async (
	params: SuppliersQueryParams
): Promise<PaginatedResult<Supplier>> => {
	const response = await strapiClient
		.from<Array<Supplier>>("suppliers")
		.find(toStrapiQueryParams(params));

	return response as PaginatedResult<Supplier>;
};

export const getSupplier = async (documentId: string): Promise<Supplier> => {
	const response = await strapiClient.request<Supplier>(
		`/suppliers/${encodeURIComponent(documentId)}`,
		{ method: "GET" }
	);

	return response.data;
};

export const createSupplier = async (
	input: SupplierWriteInput
): Promise<Supplier> => {
	const response = await strapiClient
		.from<Supplier>("suppliers")
		.create(sanitizeWriteInput(input));

	return response.data;
};

export const updateSupplier = async (
	documentId: string,
	input: SupplierWriteInput
): Promise<Supplier> => {
	const response = await strapiClient
		.from<Supplier>("suppliers")
		.update(documentId, sanitizeWriteInput(input));

	return response.data;
};

export const deleteSupplier = async (documentId: string): Promise<void> => {
	await strapiClient.from<Supplier>("suppliers").delete(documentId);
};
