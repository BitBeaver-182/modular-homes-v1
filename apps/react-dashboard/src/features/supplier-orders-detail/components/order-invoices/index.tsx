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
import { useCreateOrderInvoice } from "@/features/supplier-orders-detail/hooks/use-create-order-invoice";
import { useDeleteOrderInvoice } from "@/features/supplier-orders-detail/hooks/use-delete-order-invoice";
import { useUpdateOrderInvoice } from "@/features/supplier-orders-detail/hooks/use-update-order-invoice";
import { Route as AdminRoute } from "@/routes/$locale.o.$organizationSlug._admin";

import {
	InvoiceFormDialog,
	normalizeInvoiceInput,
	type InvoiceFormValues,
} from "./invoice-form-dialog";
import { InvoiceItemCard } from "./invoice-item-card";

import type { PendingInvoiceAttachment } from "./types";
import type { SupplierOrderDetailInvoiceResponse } from "@moduflow/types";

interface OrderInvoicesCardProps {
	currency: string;
	invoices: Array<SupplierOrderDetailInvoiceResponse>;
	orderId: string;
}

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

	const [isDialogOpen, setIsDialogOpen] = useState(false);
	const [editingInvoiceId, setEditingInvoiceId] = useState<string | null>(null);
	const [deletingInvoiceId, setDeletingInvoiceId] = useState<string | null>(null);
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

	const editingInvoice =
		editingInvoiceId === null
			? null
			: invoicesSorted.find((invoice) => invoice.id === editingInvoiceId) ?? null;
	const mutating =
		createInvoice.isPending || updateInvoice.isPending || deleteInvoice.isPending;

	const discardPendingAttachment = (attachment: PendingInvoiceAttachment | null): void => {
		if (!attachment) {
			return;
		}

		void deleteSupplierDocumentUpload(
			{ organizationId },
			attachment.fileId,
		).catch(() => undefined);
	};

	const resetDialogState = (options?: { discardPending?: boolean }): void => {
		setEditingInvoiceId(null);
		if (options?.discardPending) {
			setPendingAttachment((current) => {
				discardPendingAttachment(current);
				return null;
			});
		}
	};

	const openCreateDialog = (): void => {
		resetDialogState({ discardPending: true });
		setIsDialogOpen(true);
	};

	const openEditDialog = (invoice: SupplierOrderDetailInvoiceResponse): void => {
		setEditingInvoiceId(invoice.id);
		setIsDialogOpen(true);
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
		setIsDialogOpen(false);
		resetDialogState();
	};

	const confirmDeleteInvoice = async (): Promise<void> => {
		if (deletingInvoiceId === null) {
			return;
		}

		try {
			await deleteInvoice.mutateAsync({
				orderId,
				invoiceId: deletingInvoiceId,
			});
			toast.success(t("orders.invoiceDeleted"));
			setDeletingInvoiceId(null);
		} catch (error) {
			toast.error(
				error instanceof Error ? error.message : t("orders.invoiceDeleteFailed"),
			);
		}
	};

	return (
		<Card className="gap-0">
			<CardHeader className="flex flex-row items-center justify-between">
				<CardTitle>{t("orders.invoicesTitle")}</CardTitle>
				<Button disabled={mutating} size="sm" type="button" onClick={openCreateDialog}>
					<Plus className="mr-2 size-4" />
					{t("orders.invoiceCreateAction")}
				</Button>
			</CardHeader>
			<CardContent className="space-y-4 mt-4">
				{invoicesSorted.length === 0 ? (
					<p className="py-8 text-center text-muted-foreground">{t("orders.noInvoices")}</p>
				) : (
					invoicesSorted.map((invoice) => (
						<InvoiceItemCard
							key={invoice.id}
							invoice={invoice}
							mutating={mutating}
							onDelete={setDeletingInvoiceId}
							onEdit={openEditDialog}
						/>
					))
				)}
			</CardContent>

			<InvoiceFormDialog
				currency={currency}
				initialInvoice={editingInvoice}
				loading={mutating}
				open={isDialogOpen}
				onOpenChange={(open) => {
					setIsDialogOpen(open);
					if (!open) {
						resetDialogState({ discardPending: true });
					}
				}}
				onSubmit={handleSaveInvoice}
			/>

			<AlertDialog
				open={deletingInvoiceId !== null}
				onOpenChange={(open) => {
					if (!open) {
						setDeletingInvoiceId(null);
					}
				}}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>{t("orders.invoiceDeleteTitle")}</AlertDialogTitle>
						<AlertDialogDescription>
							{t("orders.deleteCannotUndo")}
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel disabled={mutating}>
							{t("common.cancel")}
						</AlertDialogCancel>
						<AlertDialogAction
							disabled={mutating}
							onClick={() => void confirmDeleteInvoice()}
						>
							{t("orders.invoiceDeleteConfirmAction", {
								defaultValue: "Confirm delete invoice",
							})}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</Card>
	);
};
