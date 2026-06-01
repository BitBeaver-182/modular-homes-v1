import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";


import SupplierOrderDetailPage from "./index";

import type { SupplierOrderDetailResponse } from "@moduflow/types";
import type * as TanstackRouter from "@tanstack/react-router";
import type { ReactNode } from "react";

const orderFixture: SupplierOrderDetailResponse = {
	id: "101",
	orderNumber: "SO-000101",
	supplierPoNumber: "PO-2026-009",
	status: "confirmed",
	orderDate: "2026-06-01T00:00:00.000Z",
	confirmedAt: "2026-06-02T00:00:00.000Z",
	expectedReadyDate: "2026-06-10T00:00:00.000Z",
	expectedShipDate: "2026-06-15T00:00:00.000Z",
	expectedArrivalDate: "2026-07-01T00:00:00.000Z",
	currencyCode: "EUR",
	subtotalAmount: { amount: 1000, currencyCode: "EUR" },
	shippingAmount: { amount: 100, currencyCode: "EUR" },
	taxAmount: { amount: 50, currencyCode: "EUR" },
	totalAmount: { amount: 1150, currencyCode: "EUR" },
	incoterm: "FOB",
	paymentTerms: "Net 30",
	loadingPort: "Shenzhen",
	destinationPort: "Rotterdam",
	notes: "Ready for booking",
	createdAt: "2026-06-01T00:00:00.000Z",
	updatedAt: "2026-06-02T00:00:00.000Z",
	supplier: {
		id: "8",
		name: "Acme Supply",
		phoneNumber: null,
		email: "ops@acme.test",
		address: null,
		website: null,
		createdAt: "2026-06-01T00:00:00.000Z",
		updatedAt: "2026-06-01T00:00:00.000Z",
	},
	quote: {
		id: "12",
		supplier: null,
		total: { amount: 1150, currencyCode: "EUR" },
		quoteNumber: "Q-2026-001",
		quoteDate: "2026-05-20T00:00:00.000Z",
		validUntil: "2026-06-20T00:00:00.000Z",
		paymentTerms: "Net 30",
	},
	orderLines: [
		{
			id: "91",
			supplierQuoteLineId: "71",
			houseModelId: "15",
			productConfigurationId: "19",
			description: "Model A",
			quantity: 2,
			unitCost: { amount: 500, currencyCode: "EUR" },
			lineTotal: { amount: 1000, currencyCode: "EUR" },
			createdAt: "2026-06-01T00:00:00.000Z",
		},
	],
	invoices: [
		{
			id: "77",
			invoiceNumber: "INV-2026-001",
			direction: "payable",
			invoiceType: "supplier_goods",
			status: "issued",
			issueDate: "2026-06-03T00:00:00.000Z",
			dueDate: "2026-06-30T00:00:00.000Z",
			currencyCode: "EUR",
			subtotalAmount: { amount: 1000, currencyCode: "EUR" },
			taxAmount: { amount: 150, currencyCode: "EUR" },
			totalAmount: { amount: 1150, currencyCode: "EUR" },
			amountPaid: { amount: 300, currencyCode: "EUR" },
			balanceDue: { amount: 850, currencyCode: "EUR" },
			notes: "Awaiting remainder",
			createdAt: "2026-06-03T00:00:00.000Z",
			updatedAt: "2026-06-04T00:00:00.000Z",
		},
	],
};

let currentOrder: SupplierOrderDetailResponse = orderFixture;

vi.mock("@/hooks/use-currency", () => ({
	useCurrency: () => ({
		formatAmount: (amount: number, currencyCode: string) =>
			`${currencyCode} ${amount.toFixed(2)}`,
	}),
}));

vi.mock("@/features/supplier-orders-detail/hooks/use-get-order", () => ({
	useGetOrder: () => ({
		data: currentOrder,
		isLoading: false,
		isError: false,
		error: null,
		refetch: vi.fn(),
	}),
}));

vi.mock("@/features/supplier-orders-detail/hooks/use-update-order", () => ({
	useUpdateOrder: () => ({
		isPending: false,
		mutateAsync: vi.fn(),
	}),
}));

vi.mock("@tanstack/react-router", async () => {
	const actual = await vi.importActual<typeof TanstackRouter>(
		"@tanstack/react-router"
	);
	return {
		...actual,
		Link: ({ children }: { children: ReactNode }) => children,
	};
});

vi.mock(
	"@/routes/$locale.o.$organizationSlug._admin._operations.supplier-orders_.$orderId",
	() => ({
		Route: {
			useParams: () => ({
				locale: "en",
				organizationSlug: "acme",
				orderId: "101",
			}),
			useNavigate: () => vi.fn(),
		},
	}),
);

vi.mock("react-i18next", () => ({
	useTranslation: () => ({
		t: (key: string, options?: { defaultValue?: string }) => {
			const translations: Record<string, string> = {
				"nav.operations": "Operations",
				"orders.title": "Supplier Orders",
				"orders.unknownSupplier": "Unknown supplier",
				"orders.productsTitle": "Products",
				"orders.productsAddAction": "Add product",
				"orders.productsColumnProduct": "Product",
				"orders.productsColumnQuantity": "Quantity",
				"orders.productsColumnUnitPrice": "Unit price",
				"orders.productsColumnTotal": "Total",
				"orders.productsTotalOrderAmount": "Total order amount",
				"orders.invoicesTitle": "Invoices",
				"orders.invoiceTotal": "Total",
				"orders.invoicePaid": "Paid",
				"orders.invoiceRemaining": "Remaining",
				"orders.sidebarOrderInfoTitle": "Order information",
				"orders.sidebarSupplierTitle": "Supplier",
				"orders.sidebarSupplierName": "Name",
				"orders.sidebarSupplierPhone": "Phone",
				"orders.sidebarSupplierEmail": "Email",
				"orders.sidebarSupplierWebsite": "Website",
				"orders.sidebarCreated": "Created",
				"orders.sidebarStatus": "Status",
				"orders.sidebarRelatedQuote": "Related quote",
				"orders.sidebarOrderStatus": "Order status",
				"orders.notApplicable": "—",
			};
			return translations[key] ?? options?.defaultValue ?? key;
		},
	}),
}));

describe("SupplierOrderDetailPage", () => {
	it("renders the read-only supplier-order detail foundation", () => {
		currentOrder = orderFixture;
		render(<SupplierOrderDetailPage />);

		expect(
			screen.getByRole("heading", { name: "SO-000101" }),
		).not.toBeNull();
		expect(screen.getAllByText("Acme Supply")).toHaveLength(2);
		expect(screen.getByText("Products")).not.toBeNull();
		expect(screen.getByText("Invoices")).not.toBeNull();
		expect(screen.getByText("INV-2026-001")).not.toBeNull();
		expect(screen.getByText("Model A")).not.toBeNull();
		expect(screen.queryByText("Create invoice")).toBeNull();
		expect(
			screen.getByRole("button", { name: /Add product/i }),
		).not.toBeNull();
	});

	it("hides order-line editing controls for terminal order statuses", () => {
		currentOrder = {
			...orderFixture,
			status: "closed",
		};

		render(<SupplierOrderDetailPage />);

		expect(
			screen.queryByRole("button", { name: /Add product/i }),
		).toBeNull();
		expect(
			screen.getByText(
				"Order lines are read-only after the order reaches a terminal status.",
			),
		).not.toBeNull();
	});

	it("falls back to the quote supplier when the direct supplier is missing", () => {
		currentOrder = {
			...orderFixture,
			supplier: null,
			quote: {
				...orderFixture.quote!,
				supplier: {
					id: "9",
					name: "Quote Supplier",
					phoneNumber: "123",
					email: "quote@acme.test",
					address: null,
					website: "https://quote.test",
					createdAt: "2026-06-01T00:00:00.000Z",
					updatedAt: "2026-06-01T00:00:00.000Z",
				},
			},
		};

		render(<SupplierOrderDetailPage />);

		expect(screen.getAllByText("Quote Supplier")).toHaveLength(2);
		expect(screen.queryByText("Unknown supplier")).toBeNull();
		expect(screen.queryByText("No supplier linked")).toBeNull();
	});
});
