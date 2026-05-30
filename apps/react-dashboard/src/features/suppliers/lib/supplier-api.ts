import { moduflowRequest } from "@/lib/moduflow/client";
import type { SuppliersQueryParams } from "@/routes/$locale.o.$organizationSlug._admin._operations.suppliers";

import type {
	CreateSupplierRequest,
	SupplierListResponse,
	SupplierResponse,
	UpdateSupplierRequest,
} from "@moduflow/types";


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

const sanitizeWriteInput = (
	input: CreateSupplierRequest
): CreateSupplierRequest | UpdateSupplierRequest => ({
	name: input.name.trim(),
	phoneNumber: input.phoneNumber?.trim(),
	email: input.email?.trim(),
	address: {
		line1: input.address?.line1.trim(),
		line2: input.address?.line2?.trim(),
		city: input.address?.city?.trim(),
		region: input.address?.region?.trim(),
		postalCode: input.address?.postalCode?.trim(),
		countryCode: input.address?.countryCode?.trim().toUpperCase(),
	},
	website: input.website?.trim(),
});

const organizationHeaders = ({
	organizationId,
}: SupplierApiContext): HeadersInit => ({
	"x-organization-id": organizationId,
});

export const getSuppliers = async (
	context: SupplierApiContext,
	params: SuppliersQueryParams
): Promise<SupplierListResponse> => {
	const queryString = toSupplierQueryString(params);

	return moduflowRequest<SupplierListResponse>(
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
): Promise<SupplierResponse> =>
	moduflowRequest<SupplierResponse>(`/suppliers/${encodeURIComponent(id)}`, {
		headers: organizationHeaders(context),
		method: "GET",
	});

export const createSupplier = async (
	context: SupplierApiContext,
	input: CreateSupplierRequest
): Promise<SupplierResponse> =>
	moduflowRequest<SupplierResponse>("/suppliers", {
		body: sanitizeWriteInput(input),
		headers: organizationHeaders(context),
		method: "POST",
	});

export const updateSupplier = async (
	context: SupplierApiContext,
	id: string,
	input: CreateSupplierRequest
): Promise<SupplierResponse> =>
	moduflowRequest<SupplierResponse>(`/suppliers/${encodeURIComponent(id)}`, {
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
