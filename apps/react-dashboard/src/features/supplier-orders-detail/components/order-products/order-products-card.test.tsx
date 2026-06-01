import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { OrderProductsCard } from "./order-products-card";

import type { SupplierOrderDetailLineResponse } from "@moduflow/types";

const lineFixture: SupplierOrderDetailLineResponse = {
	id: "91",
	supplierQuoteLineId: "71",
	houseModelId: "15",
	productConfigurationId: "19",
	description: "Model A",
	quantity: 2,
	unitCost: { amount: 500, currencyCode: "EUR" },
	lineTotal: { amount: 1000, currencyCode: "EUR" },
	createdAt: "2026-06-01T00:00:00.000Z",
};

vi.mock("@/hooks/use-currency", () => ({
	useCurrency: () => ({
		formatAmount: (amount: number, currencyCode: string) =>
			`${currencyCode} ${amount.toFixed(2)}`,
	}),
}));

vi.mock("sonner", () => ({
	toast: {
		success: vi.fn(),
		error: vi.fn(),
	},
}));

vi.mock("react-i18next", () => ({
	useTranslation: () => ({
		t: (key: string, options?: { currency?: string; defaultValue?: string }) => {
			const translations: Record<string, string> = {
				"orders.productsTitle": "Products",
				"orders.productsAddAction": "Add product",
				"orders.productsEditLineTitle": "Edit product line",
				"orders.productsAddToOrderTitle": "Add product to order",
				"orders.productsFieldProduct": "Product",
				"orders.productsFieldQuantity": "Quantity",
				"orders.productsFieldUnitPrice": `Unit price (${options?.currency ?? "EUR"})`,
				"orders.productsColumnProduct": "Product",
				"orders.productsColumnModel": "Model ID",
				"orders.productsColumnConfiguration": "Configuration ID",
				"orders.productsColumnQuantity": "Quantity",
				"orders.productsColumnUnitPrice": "Unit cost",
				"orders.productsColumnTotal": "Total",
				"orders.productsColumnActions": "Actions",
				"orders.productsTotalOrderAmount": "Total order amount",
				"orders.productsRemoveTitle": "Remove product?",
				"orders.productsRemoveDescription": "Remove this product line from the order?",
				"orders.productsRemoveAction": "Remove product",
				"orders.productsToastCompleteFields": "Please complete all product fields.",
				"orders.productsToastPriceQtyPositive": "Price and quantity must be greater than zero.",
				"orders.productsToastUpdated": "Product updated.",
				"orders.productsToastAdded": "Product added to order.",
				"orders.productsToastRemoved": "Product removed from order.",
				"orders.notApplicable": "—",
				"orders.save": "Save",
				"common.cancel": "Cancel",
			};
			return translations[key] ?? options?.defaultValue ?? key;
		},
	}),
}));

describe("OrderProductsCard", () => {
	it("adds, edits, and removes order lines through the provided save callback", async () => {
		const user = userEvent.setup();
		const onSaveOrderLines = vi.fn().mockResolvedValue(undefined);

		render(
			<OrderProductsCard
				currency="EUR"
				mutating={false}
				orderLines={[lineFixture]}
				onSaveOrderLines={onSaveOrderLines}
			/>,
		);

		await user.click(screen.getByText("Add product"));
		await user.type(screen.getByPlaceholderText("Product"), "New line");
		await user.type(screen.getByPlaceholderText("Quantity"), "3");
		await user.type(screen.getByPlaceholderText("Unit price (EUR)"), "250");
		await user.click(screen.getByText("Save"));

		await waitFor(() => {
			expect(onSaveOrderLines).toHaveBeenCalledWith([
				expect.objectContaining({
					id: "91",
					description: "Model A",
					quantity: 2,
					unitCost: 500,
				}),
				expect.objectContaining({
					description: "New line",
					quantity: 3,
					unitCost: 250,
				}),
			]);
		});

		onSaveOrderLines.mockClear();

		await user.click(screen.getAllByRole("button")[1]!);
		const productInput = screen.getByPlaceholderText("Product");
		await user.clear(productInput);
		await user.type(productInput, "Updated line");
		const quantityInput = screen.getByPlaceholderText("Quantity");
		await user.clear(quantityInput);
		await user.type(quantityInput, "4");
		const priceInput = screen.getByPlaceholderText("Unit price (EUR)");
		await user.clear(priceInput);
		await user.type(priceInput, "125");
		await user.click(screen.getByText("Save"));

		await waitFor(() => {
			expect(onSaveOrderLines).toHaveBeenCalledWith([
				expect.objectContaining({
					id: "91",
					description: "Updated line",
					quantity: 4,
					unitCost: 125,
				}),
			]);
		});

		onSaveOrderLines.mockClear();

		await user.click(screen.getAllByRole("button")[2]!);
		await user.click(screen.getByText("Remove product"));

		await waitFor(() => {
			expect(onSaveOrderLines).toHaveBeenCalledWith([]);
		});
	});
});
