import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi, beforeEach } from "vitest";

import { OrderInvoicesCard } from "./index";
import { ModuflowRequestError } from "@/lib/moduflow/client";

import type { SupplierOrderDetailInvoiceResponse } from "@moduflow/types";

const {
	createInvoiceMutateAsync,
	deleteInvoiceMutateAsync,
	createPendingSupplierDocumentUploadMock,
	deleteSupplierDocumentUploadMock,
	updateInvoiceMutateAsync,
} = vi.hoisted(() => ({
	createInvoiceMutateAsync: vi.fn(),
	deleteInvoiceMutateAsync: vi.fn(),
	createPendingSupplierDocumentUploadMock: vi.fn(),
	deleteSupplierDocumentUploadMock: vi.fn(),
	updateInvoiceMutateAsync: vi.fn(),
}));

const invoiceFixture: SupplierOrderDetailInvoiceResponse = {
	attachment: null,
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

vi.mock("@/components/forms/inputs/file-upload-input", () => ({
	FileUploadInput: ({
		name,
		onFilesChange,
	}: {
		name?: string;
		onFilesChange?: (files: File[]) => void;
	}) => (
		<input
			aria-label="Supporting document"
			name={name}
			type="file"
			onChange={(event) => {
				onFilesChange?.(Array.from(event.currentTarget.files ?? []));
			}}
		/>
	),
}));

vi.mock("@/features/quotes/lib/upload-api", () => ({
	createPendingSupplierDocumentUpload: createPendingSupplierDocumentUploadMock,
	deleteSupplierDocumentUpload: deleteSupplierDocumentUploadMock,
}));

vi.mock("@/routes/$locale.o.$organizationSlug._admin", () => ({
	Route: {
		useRouteContext: () => ({
			activeMembership: {
				organization: {
					id: "42",
				},
			},
		}),
	},
}));

vi.mock("@/features/supplier-orders-detail/hooks/use-create-order-invoice", () => ({
	useCreateOrderInvoice: () => ({
		isPending: false,
		mutateAsync: createInvoiceMutateAsync,
	}),
}));

vi.mock("@/features/supplier-orders-detail/hooks/use-update-order-invoice", () => ({
	useUpdateOrderInvoice: () => ({
		isPending: false,
		mutateAsync: updateInvoiceMutateAsync,
	}),
}));

vi.mock("@/features/supplier-orders-detail/hooks/use-delete-order-invoice", () => ({
	useDeleteOrderInvoice: () => ({
		isPending: false,
		mutateAsync: deleteInvoiceMutateAsync,
	}),
}));

vi.mock("react-i18next", () => ({
	useTranslation: () => ({
		t: (key: string, options?: { currency?: string; defaultValue?: string }) => {
			const translations: Record<string, string> = {
				"orders.invoicesTitle": "Invoices",
				"orders.noInvoices": "No invoices for this order",
				"orders.invoiceCreateAction": "Create invoice",
				"orders.invoiceEditTitle": "Edit invoice",
				"orders.invoiceCreateTitle": "Create invoice",
				"orders.invoiceDialogDescription":
					"Manage invoice header details for this supplier order. Total is derived from subtotal and tax.",
				"orders.invoiceRequiredFields":
					"Invoice number, subtotal amount, and tax amount are required.",
				"orders.invoiceSaveFailed": "Could not save invoice.",
				"orders.invoiceDeleteFailed": "Could not delete invoice.",
				"orders.invoiceUpdated": "Invoice updated.",
				"orders.invoiceCreated": "Invoice created.",
				"orders.invoiceDeleted": "Invoice deleted.",
				"orders.invoiceNumber": "Invoice number",
				"orders.invoiceStatus": "Status",
				"orders.invoiceType": "Invoice type",
				"orders.invoiceSubtotalAmount": `Subtotal amount (${options?.currency ?? "EUR"})`,
				"orders.invoiceTaxAmount": `Tax amount (${options?.currency ?? "EUR"})`,
				"orders.invoiceDerivedTotal": "Derived total",
				"orders.invoiceNotes": "Notes",
				"orders.invoiceTotal": "Total",
				"orders.invoicePaid": "Paid",
				"orders.invoiceRemaining": "Remaining",
				"orders.invoiceEditAction": "Edit invoice",
				"orders.invoiceDeleteAction": "Delete invoice",
				"orders.invoiceDeleteConfirmAction": "Confirm delete invoice",
				"orders.invoiceDeleteTitle": "Delete invoice?",
				"orders.invoiceIssueDate": "Issue date",
				"orders.invoiceDueDate": "Due date",
				"orders.detailInvoiceDates": "Issued {{issueDate}} • Due {{dueDate}}",
				"orders.deleteCannotUndo": "This action cannot be undone.",
				"orders.save": "Save",
				"orders.create": "Create",
				"common.cancel": "Cancel",
				"quotes.supportingDoc": "Supporting document",
				"quotes.browse": "Browse",
				"quotes.clearExistingPdf": "Clear existing PDF",
				"quotes.dropPdf": "Drop PDF",
				"quotes.pdfHint": "PDF only",
				"errors.validation.required": "This field is required.",
			};
			return translations[key] ?? options?.defaultValue ?? key;
		},
	}),
}));

describe("OrderInvoicesCard", () => {
	beforeEach(() => {
		createInvoiceMutateAsync.mockReset();
		createInvoiceMutateAsync.mockResolvedValue(undefined);
		createPendingSupplierDocumentUploadMock.mockReset();
		createPendingSupplierDocumentUploadMock.mockResolvedValue({ fileId: "file_123" });
		deleteSupplierDocumentUploadMock.mockReset();
		deleteSupplierDocumentUploadMock.mockResolvedValue(undefined);
		updateInvoiceMutateAsync.mockReset();
		updateInvoiceMutateAsync.mockResolvedValue(undefined);
		deleteInvoiceMutateAsync.mockReset();
		deleteInvoiceMutateAsync.mockResolvedValue(undefined);
	});

	it("creates, updates, and deletes supplier-order invoices through the provided hooks", async () => {
		const user = userEvent.setup();

		render(
			<OrderInvoicesCard
				currency="EUR"
				invoices={[invoiceFixture]}
				orderId="101"
			/>,
		);

		await user.click(screen.getByRole("button", { name: "Create invoice" }));
		await user.type(screen.getByPlaceholderText("Invoice number"), "INV-2026-002");
		await user.type(screen.getByLabelText("Issue date"), "2026-06-03");
		await user.type(screen.getByLabelText("Due date"), "2026-06-30");
		await user.type(
			screen.getByPlaceholderText("Subtotal amount (EUR)"),
			"1000",
		);
		await user.clear(screen.getByPlaceholderText("Tax amount (EUR)"));
		await user.type(screen.getByPlaceholderText("Tax amount (EUR)"), "150");
		await user.click(screen.getByRole("button", { name: "Create" }));

		await waitFor(() => {
			expect(createInvoiceMutateAsync).toHaveBeenCalledWith({
				orderId: "101",
				input: {
					dueDate: "2026-06-30",
					invoiceNumber: "INV-2026-002",
					invoiceType: "supplier_goods",
					issueDate: "2026-06-03",
					notes: null,
					status: "draft",
					subtotalAmount: 1000,
					taxAmount: 150,
				},
			});
		});

		await user.click(screen.getByRole("button", { name: "Edit invoice" }));
		const subtotalInput = screen.getByDisplayValue("1000");
		await user.clear(subtotalInput);
		await user.type(subtotalInput, "900");
		await user.click(screen.getByRole("button", { name: "Save" }));

		await waitFor(() => {
			expect(updateInvoiceMutateAsync).toHaveBeenCalledWith({
				orderId: "101",
				invoiceId: "77",
				input: {
					dueDate: "2026-06-30",
					invoiceNumber: "INV-2026-001",
					invoiceType: "supplier_goods",
					issueDate: "2026-06-03",
					notes: "Awaiting remainder",
					status: "issued",
					subtotalAmount: 900,
					taxAmount: 150,
				},
			});
		});

		await user.click(screen.getByRole("button", { name: "Delete invoice" }));
		fireEvent.click(screen.getByRole("button", { name: "Confirm delete invoice" }));

		await waitFor(() => {
			expect(deleteInvoiceMutateAsync).toHaveBeenCalledWith({
				orderId: "101",
				invoiceId: "77",
			});
		});
	});

	it("renders the empty state", () => {
		render(
			<OrderInvoicesCard
				currency="EUR"
				invoices={[]}
				orderId="101"
			/>,
		);

		expect(screen.getByText("No invoices for this order")).not.toBeNull();
	});

	it("marks invoice fields invalid when the API returns validation errors", async () => {
		const user = userEvent.setup();
		createInvoiceMutateAsync.mockRejectedValueOnce(
			new ModuflowRequestError("Validation failed", 400, [
				{
					name: "isNotEmpty",
					message: "This field is required.",
					path: ["invoiceNumber"],
					key: "validation.required",
				},
			]),
		);

		render(
			<OrderInvoicesCard
				currency="EUR"
				invoices={[]}
				orderId="101"
			/>,
		);

		await user.click(screen.getByRole("button", { name: "Create invoice" }));
		await user.type(
			screen.getByPlaceholderText("Subtotal amount (EUR)"),
			"1000",
		);
		await user.clear(screen.getByPlaceholderText("Tax amount (EUR)"));
		await user.type(screen.getByPlaceholderText("Tax amount (EUR)"), "150");
		await user.click(screen.getByRole("button", { name: "Create" }));

		const invoiceNumberInput = screen.getByLabelText("Invoice number");
		await waitFor(() => {
			expect(invoiceNumberInput.getAttribute("aria-invalid")).toBe("true");
		});
	});

	it("reuses the same pending attachment across validation retries", async () => {
		const user = userEvent.setup();
		createInvoiceMutateAsync
			.mockRejectedValueOnce(
				new ModuflowRequestError("Validation failed", 400, [
					{
						name: "isNotEmpty",
						message: "This field is required.",
						path: ["invoiceNumber"],
						key: "validation.required",
					},
				]),
			)
			.mockResolvedValueOnce(undefined);

		render(
			<OrderInvoicesCard currency="EUR" invoices={[]} orderId="101" />,
		);

		await user.click(screen.getByRole("button", { name: "Create invoice" }));
		const file = new File(["pdf"], "invoice.pdf", { type: "application/pdf" });
		const input = screen.getByLabelText("Supporting document");
		await user.upload(input, file);
		await user.type(screen.getByPlaceholderText("Invoice number"), "INV-2026-009");
		await user.type(screen.getByLabelText("Issue date"), "2026-06-03");
		await user.type(screen.getByLabelText("Due date"), "2026-06-30");
		await user.type(screen.getByPlaceholderText("Subtotal amount (EUR)"), "1000");
		await user.clear(screen.getByPlaceholderText("Tax amount (EUR)"));
		await user.type(screen.getByPlaceholderText("Tax amount (EUR)"), "150");
		await user.click(screen.getByRole("button", { name: "Create" }));
		await user.click(screen.getByRole("button", { name: "Create" }));

		await waitFor(() => {
			expect(createPendingSupplierDocumentUploadMock).toHaveBeenCalledTimes(1);
		});
		expect(createInvoiceMutateAsync).toHaveBeenNthCalledWith(1, {
			orderId: "101",
			input: expect.objectContaining({
				attachmentId: "file_123",
			}),
		});
		expect(createInvoiceMutateAsync).toHaveBeenNthCalledWith(2, {
			orderId: "101",
			input: expect.objectContaining({
				attachmentId: "file_123",
			}),
		});
	});
});
