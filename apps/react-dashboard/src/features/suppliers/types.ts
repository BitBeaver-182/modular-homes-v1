export interface Supplier {
	id: string;
	createdAt: string;
	updatedAt: string;
	name: string;
	phoneNumber: string | null;
	email: string | null;
	address: SupplierAddress | null;
	website: string | null;
}

export interface SupplierAddress {
	fullAddress: string;
	line1: string | null;
	line2: string | null;
	city: string | null;
	region: string | null;
	postalCode: string | null;
	countryCode: string | null;
}

export const SUPPLIER_SORT_FIELDS = [
	"createdAt",
	"name",
	"email",
	"phoneNumber",
] as const;

export interface SupplierWriteInput {
	name: string;
	phoneNumber: string;
	email: string;
	address: SupplierAddressWriteInput;
	website: string;
}

export interface SupplierAddressWriteInput {
	line1: string;
	line2: string;
	city: string;
	region: string;
	postalCode: string;
	countryCode: string;
}

export interface PaginatedResult<T> {
	data: Array<T>;
	meta: {
		pagination: {
			page: number;
			pageSize: number;
			pageCount: number;
			total: number;
		};
	};
}
