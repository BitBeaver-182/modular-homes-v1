import { moduflowRequest } from "@/lib/moduflow/client";
import type { SuppliersQueryParams } from "@/routes/$locale.o.$organizationSlug._admin._operations.suppliers";

import type { PaginatedResult, Supplier, SupplierWriteInput } from "../types";

export interface SupplierApiContext {
	organizationId: string;
}

const toSupplierQueryString = (params: SuppliersQueryParams): string => {
	const query = new URLSearchParams();
	query.set("page", String(params.page));
	query.set("limit", String(params.pageSize));

	if (params.search) {
		query.set("search", params.search);
	}

	if (params.sortBy) {
		query.set("sort[field]", params.sortBy);
		query.set("sort[criteria]", params.sortOrder === "desc" ? "desc" : "asc");
	}

	return query.toString();
};

const sanitizeWriteInput = (input: SupplierWriteInput): SupplierWriteInput => ({
	name: input.name.trim(),
	phoneNumber: input.phoneNumber.trim(),
	email: input.email.trim(),
	address: {
		fullAddress: input.address.fullAddress.trim(),
		line1: input.address.line1.trim(),
		line2: input.address.line2.trim(),
		city: input.address.city.trim(),
		region: input.address.region.trim(),
		postalCode: input.address.postalCode.trim(),
		countryCode: input.address.countryCode.trim().toUpperCase(),
	},
	website: input.website.trim(),
});

const organizationHeaders = ({
	organizationId,
}: SupplierApiContext): HeadersInit => ({
	"x-organization-id": organizationId,
});

export const getSuppliers = async (
	context: SupplierApiContext,
	params: SuppliersQueryParams
): Promise<PaginatedResult<Supplier>> => {
	const queryString = toSupplierQueryString(params);

	return moduflowRequest<PaginatedResult<Supplier>>(
		`/suppliers?${queryString}`,
		{
			headers: organizationHeaders(context),
			method: "GET",
		}
	);
};

export const getSupplier = async (
	context: SupplierApiContext,
	id: string
): Promise<Supplier> =>
	moduflowRequest<Supplier>(`/suppliers/${encodeURIComponent(id)}`, {
		headers: organizationHeaders(context),
		method: "GET",
	});

export const createSupplier = async (
	context: SupplierApiContext,
	input: SupplierWriteInput
): Promise<Supplier> =>
	moduflowRequest<Supplier>("/suppliers", {
		body: sanitizeWriteInput(input),
		headers: organizationHeaders(context),
		method: "POST",
	});

export const updateSupplier = async (
	context: SupplierApiContext,
	id: string,
	input: SupplierWriteInput
): Promise<Supplier> =>
	moduflowRequest<Supplier>(`/suppliers/${encodeURIComponent(id)}`, {
		body: sanitizeWriteInput(input),
		headers: organizationHeaders(context),
		method: "PATCH",
	});

export const deleteSupplier = async (
	context: SupplierApiContext,
	id: string
): Promise<void> =>
	moduflowRequest<void>(`/suppliers/${encodeURIComponent(id)}`, {
		headers: organizationHeaders(context),
		method: "DELETE",
	});
