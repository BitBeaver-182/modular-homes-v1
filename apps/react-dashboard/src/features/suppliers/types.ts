export type Supplier = {
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
};

export const SUPPLIER_SORT_FIELDS = [
	"createdAt",
	"name",
	"email",
	"phone_number",
] as const;

export type SupplierWriteInput = {
	name: string;
	phone_number: string;
	email: string;
	address: string;
	website: string;
};

export type PaginatedResult<T> = {
	data: Array<T>;
	meta: {
		pagination: {
			page: number;
			pageSize: number;
			pageCount: number;
			total: number;
		};
	};
};
