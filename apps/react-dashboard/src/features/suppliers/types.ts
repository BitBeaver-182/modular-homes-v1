export interface Supplier {
	id: string;
	createdAt: string;
	updatedAt: string;
	name: string;
	phoneNumber: string | null;
	email: string | null;
	address: string | null;
	website: string | null;
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
	address: string;
	website: string;
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
