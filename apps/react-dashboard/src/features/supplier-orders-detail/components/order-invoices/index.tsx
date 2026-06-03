import { Plus } from "lucide-react";
import { useMemo, useState, type JSX } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	createPendingSupplierDocumentUpload,
	deleteSupplierDocumentUpload,
} from "@/features/quotes/lib/upload-api";
import { useCreateInvoiceInstallment } from "@/features/supplier-orders-detail/hooks/use-create-invoice-installment";
import { useCreateInvoicePayment } from "@/features/supplier-orders-detail/hooks/use-create-invoice-payment";
import { useCreateOrderInvoice } from "@/features/supplier-orders-detail/hooks/use-create-order-invoice";
import { useDeleteInvoiceInstallment } from "@/features/supplier-orders-detail/hooks/use-delete-invoice-installment";
import { useDeleteInvoicePayment } from "@/features/supplier-orders-detail/hooks/use-delete-invoice-payment";
import { useDeleteOrderInvoice } from "@/features/supplier-orders-detail/hooks/use-delete-order-invoice";
import { useUpdateInvoiceInstallment } from "@/features/supplier-orders-detail/hooks/use-update-invoice-installment";
import { useUpdateInvoicePayment } from "@/features/supplier-orders-detail/hooks/use-update-invoice-payment";
import { useUpdateOrderInvoice } from "@/features/supplier-orders-detail/hooks/use-update-order-invoice";
import { Route as AdminRoute } from "@/routes/$locale.o.$organizationSlug._admin";

import {
	InstallmentFormDialog,
	normalizeInstallmentInput,
	type InstallmentFormValues,
} from "./installment-form-dialog";
import { InvoiceCard } from "./invoice-card";
import {
	InvoiceFormDialog,
	normalizeInvoiceInput,
	type InvoiceFormValues,
} from "./invoice-form-dialog";
import {
	normalizePaymentInput,
	PaymentFormDialog,
	type PaymentFormValues,
} from "./payment-form-dialog";

import type { PendingInvoiceAttachment } from "./types";
import type {
	SupplierOrderDetailInvoiceResponse,
	SupplierOrderInvoicePaymentResponse,
} from "@moduflow/types";

interface OrderInvoicesCardProps {
	currency: string;
	invoices: Array<SupplierOrderDetailInvoiceResponse>;
	orderId: string;
}

type DeleteState =
	| { type: "installment"; invoiceId: string; installmentId: string }
	| { type: "payment"; invoiceId: string; paymentId: string }
	| null;

export const OrderInvoicesCard = ({
	currency,
	invoices,
	orderId,
}: OrderInvoicesCardProps): JSX.Element => {
	const { t } = useTranslation();
	const { activeMembership } = AdminRoute.useRouteContext();
	const organizationId = activeMembership.organization.id;
	const createInvoice = useCreateOrderInvoice();
	const updateInvoice = useUpdateOrderInvoice();
	const deleteInvoice = useDeleteOrderInvoice();
	const createInstallment = useCreateInvoiceInstallment();
	const updateInstallment = useUpdateInvoiceInstallment();
	const deleteInstallment = useDeleteInvoiceInstallment();
	const createPayment = useCreateInvoicePayment();
	const updatePayment = useUpdateInvoicePayment();
	const deletePayment = useDeleteInvoicePayment();

	const [isInvoiceDialogOpen, setIsInvoiceDialogOpen] = useState(false);
	const [isInstallmentDialogOpen, setIsInstallmentDialogOpen] = useState(false);
	const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
	const [editingInvoiceId, setEditingInvoiceId] = useState<string | null>(null);
	const [activeInvoiceId, setActiveInvoiceId] = useState<string | null>(null);
	const [editingInstallmentId, setEditingInstallmentId] = useState<string | null>(null);
	const [editingPaymentId, setEditingPaymentId] = useState<string | null>(null);
	const [deleting, setDeleting] = useState<DeleteState>(null);
	const [pendingAttachment, setPendingAttachment] =
		useState<PendingInvoiceAttachment | null>(null);

	const invoicesSorted = useMemo(
		(): Array<SupplierOrderDetailInvoiceResponse> =>
			[...invoices].sort((left, right) => {
				const leftId = BigInt(left.id);
				const rightId = BigInt(right.id);
				if (leftId === rightId) {
					return 0;
				}
				return rightId > leftId ? 1 : -1;
			}),
		[invoices],
	);
	const supplierName = t("orders.unknownSupplier", { defaultValue: "Supplier" });

	const activeInvoice =
		activeInvoiceId === null
			? null
			: invoicesSorted.find((invoice) => invoice.id === activeInvoiceId) ?? null;
	const editingInvoice =
		editingInvoiceId === null
			? null
			: invoicesSorted.find((invoice) => invoice.id === editingInvoiceId) ?? null;
	const editingInstallment =
		activeInvoice && editingInstallmentId
			? activeInvoice.installments.find((installment) => installment.id === editingInstallmentId) ??
				null
			: null;
	const editingPayment =
		activeInvoice && editingPaymentId
			? activeInvoice.payments.find((payment) => payment.id === editingPaymentId) ?? null
			: null;

	const mutating =
		createInvoice.isPending ||
		updateInvoice.isPending ||
		deleteInvoice.isPending ||
		createInstallment.isPending ||
		updateInstallment.isPending ||
		deleteInstallment.isPending ||
		createPayment.isPending ||
		updatePayment.isPending ||
		deletePayment.isPending;

	const discardPendingAttachment = (attachment: PendingInvoiceAttachment | null): void => {
		if (!attachment) {
			return;
		}

		void deleteSupplierDocumentUpload(
			{ organizationId },
			attachment.fileId,
		).catch(() => undefined);
	};

	const resetInvoiceDialogState = (options?: { discardPending?: boolean }): void => {
		setEditingInvoiceId(null);
		if (options?.discardPending) {
			setPendingAttachment((current) => {
				discardPendingAttachment(current);
				return null;
			});
		}
	};

	const openCreateInvoiceDialog = (): void => {
		resetInvoiceDialogState({ discardPending: true });
		setIsInvoiceDialogOpen(true);
	};

	const openEditInvoiceDialog = (invoice: SupplierOrderDetailInvoiceResponse): void => {
		setEditingInvoiceId(invoice.id);
		setIsInvoiceDialogOpen(true);
	};

	const openCreatePaymentDialog = (invoice: SupplierOrderDetailInvoiceResponse): void => {
		setActiveInvoiceId(invoice.id);
		setEditingPaymentId(null);
		setIsPaymentDialogOpen(true);
	};

	const openEditPaymentDialog = (
		invoice: SupplierOrderDetailInvoiceResponse,
		payment: SupplierOrderInvoicePaymentResponse,
	): void => {
		setActiveInvoiceId(invoice.id);
		setEditingPaymentId(payment.id);
		setIsPaymentDialogOpen(true);
	};

	const handleSaveInvoice = async (values: InvoiceFormValues): Promise<void> => {
		let attachmentId: string | null | undefined =
			values.removeExistingAttachment ? null : undefined;

		if (values.attachmentFile) {
			const currentPending =
				pendingAttachment?.file === values.attachmentFile
					? pendingAttachment
					: null;

			if (currentPending) {
				attachmentId = currentPending.fileId;
			} else {
				if (pendingAttachment) {
					discardPendingAttachment(pendingAttachment);
				}

				const nextPendingAttachment = await createPendingSupplierDocumentUpload(
					{ organizationId },
					values.attachmentFile,
				);

				const nextPendingState = {
					file: values.attachmentFile,
					fileId: nextPendingAttachment.fileId,
				} satisfies PendingInvoiceAttachment;
				setPendingAttachment(nextPendingState);
				attachmentId = nextPendingState.fileId;
			}
		} else if (pendingAttachment) {
			discardPendingAttachment(pendingAttachment);
			setPendingAttachment(null);
		}

		const input = normalizeInvoiceInput(values, attachmentId);

		if (editingInvoice) {
			await updateInvoice.mutateAsync({
				orderId,
				invoiceId: editingInvoice.id,
				input,
			});
			toast.success(t("orders.invoiceUpdated"));
		} else {
			await createInvoice.mutateAsync({
				orderId,
				input,
			});
			toast.success(t("orders.invoiceCreated"));
		}

		setPendingAttachment(null);
		setIsInvoiceDialogOpen(false);
		resetInvoiceDialogState();
	};

	const handleSaveInstallment = async (values: InstallmentFormValues): Promise<void> => {
		if (!activeInvoice) {
			return;
		}

		const input = normalizeInstallmentInput(values);
		if (editingInstallment) {
			await updateInstallment.mutateAsync({
				orderId,
				invoiceId: activeInvoice.id,
				installmentId: editingInstallment.id,
				input,
			});
			toast.success(
				t("orders.installmentUpdated", {
					defaultValue: "Installment updated.",
				}),
			);
		} else {
			await createInstallment.mutateAsync({
				orderId,
				invoiceId: activeInvoice.id,
				input,
			});
			toast.success(
				t("orders.installmentCreated", {
					defaultValue: "Installment created.",
				}),
			);
		}

		setIsInstallmentDialogOpen(false);
		setEditingInstallmentId(null);
	};

	const handleSavePayment = async (values: PaymentFormValues): Promise<void> => {
		if (!activeInvoice) {
			return;
		}

		const input = normalizePaymentInput(values);
		if (editingPayment) {
			await updatePayment.mutateAsync({
				orderId,
				invoiceId: activeInvoice.id,
				paymentId: editingPayment.id,
				input,
			});
			toast.success(t("orders.paymentUpdated"));
		} else {
			await createPayment.mutateAsync({
				orderId,
				invoiceId: activeInvoice.id,
				input,
			});
			toast.success(t("orders.paymentRecorded"));
		}

		setIsPaymentDialogOpen(false);
		setEditingPaymentId(null);
	};

	const handleDeleteInvoice = async (
		invoice: SupplierOrderDetailInvoiceResponse,
	): Promise<void> => {
		try {
			await deleteInvoice.mutateAsync({
				orderId,
				invoiceId: invoice.id,
			});
			toast.success(t("orders.invoiceDeleted"));
		} catch (error) {
			toast.error(
				error instanceof Error ? error.message : t("orders.invoiceDeleteFailed"),
			);
		}
	};

	const confirmDelete = async (): Promise<void> => {
		if (!deleting) {
			return;
		}

		try {
			if (deleting.type === "installment") {
				await deleteInstallment.mutateAsync({
					orderId,
					invoiceId: deleting.invoiceId,
					installmentId: deleting.installmentId,
				});
				toast.success(
					t("orders.installmentDeleted", {
						defaultValue: "Installment deleted.",
					}),
				);
			} else {
				await deletePayment.mutateAsync({
					orderId,
					invoiceId: deleting.invoiceId,
					paymentId: deleting.paymentId,
				});
				toast.success(t("orders.paymentDeleted"));
			}
			setDeleting(null);
		} catch (error) {
			toast.error(
				error instanceof Error
					? error.message
					: deleting.type === "installment"
							? t("orders.installmentDeleteFailed", {
									defaultValue: "Could not delete installment.",
								})
							: t("orders.paymentDeleteFailed"),
			);
		}
	};

	const deleteTitle =
		deleting?.type === "installment"
			? t("orders.installmentDeleteTitle", {
					defaultValue: "Delete installment?",
				})
			: t("orders.paymentDeleteTitle");

	const deleteActionLabel =
		deleting?.type === "installment"
			? t("orders.installmentDeleteConfirmAction", {
					defaultValue: "Confirm delete installment",
				})
			: t("orders.paymentDeleteConfirmAction", {
					defaultValue: "Confirm delete payment",
				});

	return (
		<Card className="gap-0">
			<CardHeader className="flex flex-row items-center justify-between">
				<CardTitle>{t("orders.invoicesTitle")}</CardTitle>
				<Button
					disabled={mutating}
					size="sm"
					type="button"
					onClick={openCreateInvoiceDialog}
				>
					<Plus className="mr-2 size-4" />
					{t("orders.invoiceCreateAction")}
				</Button>
			</CardHeader>
			<CardContent className="mt-4 space-y-4">
				{invoicesSorted.length === 0 ? (
					<p className="py-8 text-center text-muted-foreground">{t("orders.noInvoices")}</p>
				) : (
					invoicesSorted.map((invoice) => (
						<InvoiceCard
							key={invoice.id}
							currency={currency}
							invoice={invoice}
							mutating={mutating}
							onAddPayment={openCreatePaymentDialog}
							onConfirmDeleteInvoice={handleDeleteInvoice}
							onConfirmDeletePayment={(payment) => {
								setDeleting({
									type: "payment",
									invoiceId: invoice.id,
									paymentId: payment.id,
								});
							}}
							onEditInvoice={openEditInvoiceDialog}
							onEditPayment={openEditPaymentDialog}
							supplierName={supplierName}
						/>
					))
				)}
			</CardContent>

			<InvoiceFormDialog
				currency={currency}
				initialInvoice={editingInvoice}
				loading={mutating}
				open={isInvoiceDialogOpen}
				onOpenChange={(open) => {
					setIsInvoiceDialogOpen(open);
					if (!open) {
						resetInvoiceDialogState({ discardPending: true });
					}
				}}
				onSubmit={handleSaveInvoice}
			/>

			<InstallmentFormDialog
				currency={currency}
				initialInstallment={editingInstallment}
				invoice={activeInvoice}
				loading={mutating}
				open={isInstallmentDialogOpen}
				onOpenChange={(open) => {
					setIsInstallmentDialogOpen(open);
					if (!open) {
						setEditingInstallmentId(null);
					}
				}}
				onSubmit={handleSaveInstallment}
			/>

			<PaymentFormDialog
				currency={currency}
				initialPayment={editingPayment}
				invoice={activeInvoice}
				loading={mutating}
				open={isPaymentDialogOpen}
				onOpenChange={(open) => {
					setIsPaymentDialogOpen(open);
					if (!open) {
						setEditingPaymentId(null);
					}
				}}
				onSubmit={handleSavePayment}
			/>

			<AlertDialog
				open={deleting !== null}
				onOpenChange={(open) => {
					if (!open) {
						setDeleting(null);
					}
				}}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>{deleteTitle}</AlertDialogTitle>
						<AlertDialogDescription>
							{t("orders.deleteCannotUndo")}
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel disabled={mutating}>
							{t("common.cancel")}
						</AlertDialogCancel>
						<AlertDialogAction disabled={mutating} onClick={() => void confirmDelete()}>
							{deleteActionLabel}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</Card>
	);
};
