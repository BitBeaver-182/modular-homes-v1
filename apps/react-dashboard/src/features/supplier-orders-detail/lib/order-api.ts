import { strapiClient, strapiConfig, type AttachmentMedia, type StrapiMoney, type StrapiQueryParams } from "@/lib/strapi";
import type {
	SupplierInvoicePaymentMethod,
	SupplierInvoiceStatus,
	SupplierOrderLine,
	SupplierOrder,
	SupplierOrderInvoice,
} from "@/features/supplier-orders/types";

const DETAIL_POPULATE = {
	quote: {
		populate: {
			supplier: true,
			total: true,
			attachment: true,
		},
	},
	supplier: true,
	invoices: {
		populate: {
			attachment: {
				fields: ['name', 'url', 'mime', 'size'],
			},
			total: true,
			amountPaid: true,
			amountRemaining: true,
			payments: true,
		},
	},
	historyEntries: true,
} as const;

export type SupplierOrderWriteInput = {
	orderStatus?: SupplierOrder["orderStatus"];
	trackingUrl?: string | null;
	orderLines?: Array<SupplierOrderLine>;
};

export type SupplierInvoiceWriteInput = {
	supplierOrderDocumentId: string;
	vendorName: string;
	total: StrapiMoney;
	invoiceStatus: SupplierInvoiceStatus;
	expirationDate: string;
	attachmentFile?: File | null;
};

export type SupplierInvoiceUpdateInput = {
	vendorName: string;
	total: StrapiMoney;
	invoiceStatus: SupplierInvoiceStatus;
	expirationDate: string;
	attachmentFile?: File | null;
	removeExistingAttachment?: boolean;
};

export type SupplierInvoicePaymentWriteInput = {
	invoiceDocumentId: string;
	paymentAmount: StrapiMoney;
	paymentDate: string;
	method: SupplierInvoicePaymentMethod;
	notes?: string;
};

export type SupplierInvoicePaymentUpdateInput = {
	paymentAmount: StrapiMoney;
	paymentDate: string;
	method: SupplierInvoicePaymentMethod;
	notes?: string;
};

type SupplierOrderQuoteApiRef = {
	id: number;
	documentId: string;
	supplier: SupplierOrder["quote"] extends infer T
		? T extends { supplier: infer S | null }
			? S | null
			: null
		: null;
	total: SupplierOrder["quote"] extends infer T
		? T extends { total: infer M | null }
			? M | null
			: null
		: null;
	expiresAt?: string | null;
	attachment?: AttachmentMedia | null;
};

type SupplierOrderApiRecord = Omit<SupplierOrder, "quote" | "orderLines"> & {
	quote: SupplierOrderQuoteApiRef | null;
	orderLines?: Array<SupplierOrderLine> | null;
};

const withAbsoluteMediaUrl = (
	media: AttachmentMedia | null | undefined,
): AttachmentMedia | null => {
	if (!media) {
		return null;
	}

	const pdfUrl = media.url;
	if (!pdfUrl || pdfUrl.startsWith("http://") || pdfUrl.startsWith("https://")) {
		return media;
	}

	return {
		...media,
		url: `${strapiConfig.baseUrl}${pdfUrl.startsWith("/") ? "" : "/"}${pdfUrl}`,
	};
};

const withAbsoluteInvoiceAttachmentUrl = (invoice: SupplierOrderInvoice): SupplierOrderInvoice => ({
	...invoice,
	attachment: withAbsoluteMediaUrl(invoice.attachment),
});

const fromSupplierOrderApi = (order: SupplierOrderApiRecord): SupplierOrder => ({
	...order,
	quote: order.quote
		? {
				id: order.quote.id,
				documentId: order.quote.documentId,
				supplier: order.quote.supplier ?? null,
				total: order.quote.total ?? null,
				expiration_date: order.quote.expiresAt ?? null,
				pdf: withAbsoluteMediaUrl(order.quote.attachment),
			}
		: null,
	invoices: order.invoices?.map(withAbsoluteInvoiceAttachmentUrl) ?? order.invoices,
	orderLines: order.orderLines ?? [],
});

export const getSupplierOrder = async (documentId: string): Promise<SupplierOrder> => {
	try {
		const response = await strapiClient.request<SupplierOrderApiRecord>(
			`/supplier-orders/${encodeURIComponent(documentId)}`,
			{
				method: "GET",
				query: { populate: DETAIL_POPULATE } as StrapiQueryParams<SupplierOrderApiRecord>,
			},
		);

		return fromSupplierOrderApi(response.data);
	} catch {
		const numericOrderId = Number.parseInt(documentId, 10);
		const hasNumericOrderId = Number.isFinite(numericOrderId);
		const fallbackQuery: StrapiQueryParams<Array<SupplierOrderApiRecord>> = {
			pagination: { page: 1, pageSize: 1 },
			populate: DETAIL_POPULATE,
			filters: {
				$or: [
					{ documentId: { $eq: documentId } },
					...(hasNumericOrderId ? [{ id: { $eq: numericOrderId } }] : []),
				],
			},
		};

		const listResponse = await strapiClient
			.from<Array<SupplierOrderApiRecord>>("supplier-orders")
			.find(fallbackQuery);
		const order = listResponse.data[0];
		if (!order) {
			throw new Error("Supplier order not found.");
		}
		return fromSupplierOrderApi(order);
	}
};

export const updateSupplierOrder = async (
	documentId: string,
	input: SupplierOrderWriteInput,
): Promise<SupplierOrder> => {
	const response = await strapiClient
		.from<SupplierOrder>("supplier-orders")
		.update(documentId, input as Partial<SupplierOrder>);

	return getSupplierOrder(response.data.documentId);
};

export const createSupplierInvoice = async (
	input: SupplierInvoiceWriteInput,
): Promise<void> => {
	const payload: Record<string, unknown> = {
		supplierOrder: { connect: [input.supplierOrderDocumentId] },
		vendorName: input.vendorName,
		total: {
			amount: input.total.amount,
			currency_code: input.total.currency_code,
		},
		invoiceStatus: input.invoiceStatus,
		expirationDate: input.expirationDate,
	};

	if (input.attachmentFile) {
		const uploadResponse = await strapiClient
			.from<SupplierOrderInvoice>("supplier-invoices")
			.uploadFile(input.attachmentFile);
		const [media] = uploadResponse.data;
		if (media) {
			payload["attachment"] = media.id;
		}
	}

	await strapiClient
		.from<SupplierOrderInvoice>("supplier-invoices")
		.create(payload as unknown as Partial<SupplierOrderInvoice>);
};

export const updateSupplierInvoice = async (
	documentId: string,
	input: SupplierInvoiceUpdateInput,
): Promise<void> => {
	const payload: Record<string, unknown> = {
		vendorName: input.vendorName,
		total: {
			amount: input.total.amount,
			currency_code: input.total.currency_code,
		},
		invoiceStatus: input.invoiceStatus,
		expirationDate: input.expirationDate,
	};

	if (input.removeExistingAttachment && !input.attachmentFile) {
		payload["attachment"] = null;
	}

	if (input.attachmentFile) {
		const uploadResponse = await strapiClient
			.from<SupplierOrderInvoice>("supplier-invoices")
			.uploadFile(input.attachmentFile);
		const [media] = uploadResponse.data;
		if (media) {
			payload["attachment"] = media.id;
		}
	}

	await strapiClient
		.from<SupplierOrderInvoice>("supplier-invoices")
		.update(documentId, payload as Partial<SupplierOrderInvoice>);
};

export const deleteSupplierInvoice = async (documentId: string): Promise<void> => {
	await strapiClient.request(`/supplier-invoices/${encodeURIComponent(documentId)}`, {
		method: "DELETE",
	});
};

export const createSupplierInvoicePayment = async (
	input: SupplierInvoicePaymentWriteInput,
): Promise<void> => {
	await strapiClient.request("/supplier-invoice-payments", {
		method: "POST",
		body: JSON.stringify({
			data: {
				invoice: { connect: [input.invoiceDocumentId] },
				paymentAmount: {
					amount: input.paymentAmount.amount,
					currency_code: input.paymentAmount.currency_code,
				},
				paymentDate: input.paymentDate,
				method: input.method,
				notes: input.notes?.trim() || null,
			},
		}),
	});
};

export const updateSupplierInvoicePayment = async (
	documentId: string,
	input: SupplierInvoicePaymentUpdateInput,
): Promise<void> => {
	await strapiClient.request(
		`/supplier-invoice-payments/${encodeURIComponent(documentId)}`,
		{
			method: "PUT",
			body: JSON.stringify({
				data: {
					paymentAmount: {
						amount: input.paymentAmount.amount,
						currency_code: input.paymentAmount.currency_code,
					},
					paymentDate: input.paymentDate,
					method: input.method,
					notes: input.notes?.trim() || null,
				},
			}),
		},
	);
};

export const deleteSupplierInvoicePayment = async (
	documentId: string,
): Promise<void> => {
	await strapiClient.request(
		`/supplier-invoice-payments/${encodeURIComponent(documentId)}`,
		{
			method: "DELETE",
		},
	);
};
