import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { useOrdersTable } from "./use-orders-table";

import type * as TanstackRouter from "@tanstack/react-router";

vi.mock("@/hooks/use-currency", () => ({
	useCurrency: () => ({
		formatAmount: (amount: number, currencyCode: string) =>
			`${currencyCode} ${amount.toFixed(2)}`,
	}),
}));

vi.mock("@tanstack/react-router", async () => {
	const actual = await vi.importActual<typeof TanstackRouter>(
		"@tanstack/react-router"
	);
	return {
		...actual,
		Link: ({ children }: { children: React.ReactNode }) => children,
		useParams: () => ({ locale: "en", organizationSlug: "acme" }),
	};
});

vi.mock("i18next", () => ({
	t: (key: string) =>
		key === "orders.unknownSupplier"
			? "Unknown supplier"
			: key === "orders.notApplicable"
				? "N/A"
				: key,
}));

describe("useOrdersTable", () => {
	it("renders supplier fallback, invoice totals, and created date cells", () => {
		const { result } = renderHook(() => useOrdersTable());
		const supplierColumn = result.current.columns.find(
			(column) => column.id === "supplier.name"
		);
		const totalColumn = result.current.columns.find(
			(column) => column.id === "invoices-total"
		);
		const createdAtColumn = result.current.columns.find(
			(column) => column.id === "createdAt"
		);

		const row = {
			original: {
				id: "101",
				createdAt: "2026-06-15T08:00:00.000Z",
				updatedAt: "2026-06-16T08:00:00.000Z",
				orderStatus: "processing",
				supplier: null,
				quote: {
					id: "12",
					supplier: { name: "Quote Supplier" },
					total: { amount: 1500, currencyCode: "EUR" },
				},
				invoices: [
					{
						id: "1",
						total: { amount: 1250, currencyCode: "EUR" },
						amountPaid: { amount: 500, currencyCode: "EUR" },
						balanceDue: { amount: 750, currencyCode: "EUR" },
					},
				],
			},
		};

		const supplierCell = supplierColumn?.cell as ((context: unknown) => string) | undefined;
		const totalCell = totalColumn?.cell as ((context: unknown) => string) | undefined;
		const createdAtCell = createdAtColumn?.cell as ((context: unknown) => string) | undefined;

		expect(supplierCell?.({ row })).toBe("Quote Supplier");
		expect(totalCell?.({ row })).toBe("EUR 1250.00");
		expect(createdAtCell?.({ row })).toBe("Jun 15, 2026");
	});
});
