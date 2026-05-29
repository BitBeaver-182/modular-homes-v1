export interface Supplier {
	id: number;
	documentId: string;
	createdAt: string;
	updatedAt: string;
	publishedAt: string;
	slug: string;
	name: string;
	phone_number?: string | null;
	email: string | null;
	address: string | null;
	website: string | null;
}

export const SUPPLIER_SORT_FIELDS = [
	"createdAt",
	"name",
	"email",
	"phone_number",
] as const;

export interface SupplierWriteInput {
	name: string;
	phone_number: string;
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
