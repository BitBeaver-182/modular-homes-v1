import { FileText, Pencil, Plus, Trash2 } from "lucide-react";
import { useMemo, useState, type JSX } from "react";
import { FormProvider, type FieldPath } from "react-hook-form";
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useDeleteOrderInvoice } from "@/features/supplier-orders-detail/hooks/use-delete-order-invoice";
import { useCreateOrderInvoice } from "@/features/supplier-orders-detail/hooks/use-create-order-invoice";
import { useUpdateOrderInvoice } from "@/features/supplier-orders-detail/hooks/use-update-order-invoice";
import { useCurrency } from "@/hooks/use-currency";
import { useModuflowForm } from "@/lib/moduflow/use-moduflow-form";

import {
	SUPPLIER_ORDER_INVOICE_STATUSES,
	SUPPLIER_ORDER_INVOICE_TYPES,
	type CreateSupplierOrderInvoiceRequest,
	type SupplierOrderDetailInvoiceResponse,
	type SupplierOrderInvoiceStatus,
	type SupplierOrderInvoiceType,
	type UpdateSupplierOrderInvoiceRequest,
} from "@moduflow/types";

interface OrderInvoicesCardProps {
	currency: string;
	invoices: Array<SupplierOrderDetailInvoiceResponse>;
	orderId: string;
}

interface InvoiceFormValues {
	dueDate: string;
	invoiceNumber: string;
	invoiceType: SupplierOrderInvoiceType;
	issueDate: string;
	notes: string;
	status: SupplierOrderInvoiceStatus;
	subtotalAmount: string;
	taxAmount: string;
	root?: string;
}

const INVOICE_STATUS_VARIANT: Record<
	SupplierOrderDetailInvoiceResponse["status"],
	"default" | "secondary" | "outline" | "destructive"
> = {
	draft: "secondary",
	issued: "outline",
	partially_paid: "outline",
	paid: "default",
	overdue: "destructive",
	disputed: "destructive",
	cancelled: "secondary",
	void: "secondary",
};

const EMPTY_FORM: InvoiceFormValues = {
	dueDate: "",
	invoiceNumber: "",
	invoiceType: "supplier_goods",
	issueDate: "",
	notes: "",
	status: "draft",
	subtotalAmount: "",
	taxAmount: "0",
};

const humanize = (value: string): string =>
	value
		.split("_")
		.map((part) => part.charAt(0).toUpperCase() + part.slice(1))
		.join(" ");

const formatOptionalDate = (value: string | null): string =>
	value ? new Date(value).toLocaleDateString() : "—";

const toDateInputValue = (value: string | null): string =>
	value ? value.slice(0, 10) : "";

const toFormState = (
	invoice: SupplierOrderDetailInvoiceResponse,
): InvoiceFormValues => ({
	dueDate: toDateInputValue(invoice.dueDate),
	invoiceNumber: invoice.invoiceNumber,
	invoiceType: invoice.invoiceType,
	issueDate: toDateInputValue(invoice.issueDate),
	notes: invoice.notes ?? "",
	status: invoice.status,
	subtotalAmount: String(invoice.subtotalAmount.amount),
	taxAmount: String(invoice.taxAmount.amount),
});

const normalizeInvoiceInput = (
	form: InvoiceFormValues,
): CreateSupplierOrderInvoiceRequest | UpdateSupplierOrderInvoiceRequest => {
	return {
		dueDate: form.dueDate || null,
		invoiceNumber: form.invoiceNumber.trim(),
		invoiceType: form.invoiceType,
		issueDate: form.issueDate || null,
		notes: form.notes.trim() || null,
		status: form.status,
		subtotalAmount:
			form.subtotalAmount.trim() === ""
				? (undefined as unknown as number)
				: Number(form.subtotalAmount),
		taxAmount:
			form.taxAmount.trim() === ""
				? (undefined as unknown as number)
				: Number(form.taxAmount),
	};
};

export const OrderInvoicesCard = ({
	currency,
	invoices,
	orderId,
}: OrderInvoicesCardProps): JSX.Element => {
	const { t } = useTranslation();
	const { formatAmount } = useCurrency();
	const createInvoice = useCreateOrderInvoice();
	const updateInvoice = useUpdateOrderInvoice();
	const deleteInvoice = useDeleteOrderInvoice();

	const [isDialogOpen, setIsDialogOpen] = useState(false);
	const [editingInvoiceId, setEditingInvoiceId] = useState<string | null>(null);
	const [deletingInvoiceId, setDeletingInvoiceId] = useState<string | null>(null);

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
	const form = useModuflowForm<InvoiceFormValues>({
		defaultValues: EMPTY_FORM,
		mapField: (key) => mapInvoiceField(key),
		mode: "onSubmit",
	});
	const {
		register,
		reset,
		setValue,
		submit,
		watch,
		formState: { errors },
	} = form;
	const derivedTotalAmount =
		(Number.parseFloat(watch("subtotalAmount") || "") || 0) +
		(Number.parseFloat(watch("taxAmount") || "") || 0);

	const resetDialog = (): void => {
		setEditingInvoiceId(null);
		reset(EMPTY_FORM);
	};

	const openCreateDialog = (): void => {
		resetDialog();
		setIsDialogOpen(true);
	};

	const openEditDialog = (invoice: SupplierOrderDetailInvoiceResponse): void => {
		setEditingInvoiceId(invoice.id);
		reset(toFormState(invoice));
		setIsDialogOpen(true);
	};

	const saveInvoice = async (values: InvoiceFormValues): Promise<void> => {
		const payload = normalizeInvoiceInput(values);
		try {
			if (editingInvoice) {
				await updateInvoice.mutateAsync({
					orderId,
					invoiceId: editingInvoice.id,
					input: payload,
				});
				toast.success(t("orders.invoiceUpdated"));
			} else {
				await createInvoice.mutateAsync({
					orderId,
					input: payload,
				});
				toast.success(t("orders.invoiceCreated"));
			}

			setIsDialogOpen(false);
			resetDialog();
		} catch (error) {
			toast.error(
				error instanceof Error
					? error.message
					: t("orders.invoiceSaveFailed"),
			);
		}
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
				error instanceof Error
					? error.message
					: t("orders.invoiceDeleteFailed"),
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
			<CardContent className="space-y-4">
				{invoicesSorted.length === 0 ? (
					<p className="py-8 text-center text-muted-foreground">{t("orders.noInvoices")}</p>
				) : (
					invoicesSorted.map((invoice) => (
						<div key={invoice.id} className="rounded-xl border bg-card p-4 shadow-sm">
							<div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
								<div className="space-y-2">
									<div className="flex items-center gap-2">
										<FileText className="size-4 text-muted-foreground" />
										<p className="font-semibold">{invoice.invoiceNumber}</p>
										<Badge variant={INVOICE_STATUS_VARIANT[invoice.status]}>
											{humanize(invoice.status)}
										</Badge>
									</div>
									<p className="text-sm text-muted-foreground">
										{humanize(invoice.invoiceType)} • {humanize(invoice.direction)}
									</p>
									<p className="text-sm text-muted-foreground">
										{t("orders.detailInvoiceDates", {
											defaultValue: "Issued {{issueDate}} • Due {{dueDate}}",
											dueDate: formatOptionalDate(invoice.dueDate),
											issueDate: formatOptionalDate(invoice.issueDate),
										})}
									</p>
								</div>
								<div className="flex items-start gap-4">
									<div className="grid min-w-[220px] grid-cols-3 gap-4 text-right text-sm">
										<div>
											<p className="text-muted-foreground">{t("orders.invoiceTotal")}</p>
											<p className="font-medium">
												{formatAmount(invoice.totalAmount.amount, invoice.currencyCode)}
											</p>
										</div>
										<div>
											<p className="text-muted-foreground">{t("orders.invoicePaid")}</p>
											<p className="font-medium">
												{formatAmount(invoice.amountPaid.amount, invoice.currencyCode)}
											</p>
										</div>
										<div>
											<p className="text-muted-foreground">{t("orders.invoiceRemaining")}</p>
											<p className="font-medium">
												{formatAmount(invoice.balanceDue.amount, invoice.currencyCode)}
											</p>
										</div>
									</div>
									<div className="flex gap-1">
										<Button
											aria-label={t("orders.invoiceEditAction", {
												defaultValue: "Edit invoice",
											})}
											disabled={mutating}
											size="icon-sm"
											type="button"
											variant="ghost"
											onClick={() => {
												openEditDialog(invoice);
											}}
										>
											<Pencil className="size-4" />
										</Button>
										<Button
											aria-label={t("orders.invoiceDeleteAction", {
												defaultValue: "Delete invoice",
											})}
											disabled={mutating}
											size="icon-sm"
											type="button"
											variant="ghost"
											onClick={() => {
												setDeletingInvoiceId(invoice.id);
											}}
										>
											<Trash2 className="size-4" />
										</Button>
									</div>
								</div>
							</div>
							{invoice.notes ? (
								<p className="mt-3 whitespace-pre-wrap text-sm text-muted-foreground">
									{invoice.notes}
								</p>
							) : null}
						</div>
					))
				)}
			</CardContent>

			<Dialog
				open={isDialogOpen}
				onOpenChange={(open) => {
					setIsDialogOpen(open);
					if (!open) {
						resetDialog();
					}
				}}
			>
				<DialogContent>
					<DialogHeader>
							<DialogTitle>
								{editingInvoice
									? t("orders.invoiceEditTitle")
									: t("orders.invoiceCreateTitle")}
							</DialogTitle>
						<DialogDescription>
							{t("orders.invoiceDialogDescription", {
								defaultValue:
									"Manage invoice header details for this supplier order. Total is derived from subtotal and tax.",
							})}
						</DialogDescription>
					</DialogHeader>
					<FormProvider {...form}>
						<form
							className="contents"
							onSubmit={submit(async (values): Promise<void> => {
								await saveInvoice(values);
							})}
						>
							{errors.root?.message ? (
								<p className="text-destructive text-sm" role="alert">
									{errors.root.message}
								</p>
							) : null}
							<div className="grid gap-3">
								<Field data-invalid={Boolean(errors.invoiceNumber?.message) || undefined}>
									<FieldLabel htmlFor="invoice-number">
										{t("orders.invoiceNumber", { defaultValue: "Invoice number" })}
									</FieldLabel>
									<Input
										aria-invalid={Boolean(errors.invoiceNumber?.message)}
										disabled={mutating}
										id="invoice-number"
										placeholder={t("orders.invoiceNumber", { defaultValue: "Invoice number" })}
										{...register("invoiceNumber")}
									/>
									{errors.invoiceNumber?.message ? (
										<FieldError>{errors.invoiceNumber.message}</FieldError>
									) : null}
								</Field>
								<div className="grid gap-3 md:grid-cols-2">
									<Field data-invalid={Boolean(errors.invoiceType?.message) || undefined}>
										<FieldLabel htmlFor="invoice-type">
											{t("orders.invoiceType", { defaultValue: "Invoice type" })}
										</FieldLabel>
										<Select
											disabled={mutating}
											value={watch("invoiceType")}
											onValueChange={(value: SupplierOrderInvoiceType) => {
												setValue("invoiceType", value, { shouldDirty: true });
											}}
										>
											<SelectTrigger aria-invalid={Boolean(errors.invoiceType?.message)} id="invoice-type">
												<SelectValue />
											</SelectTrigger>
											<SelectContent>
												{SUPPLIER_ORDER_INVOICE_TYPES.map((type) => (
													<SelectItem key={type} value={type}>
														{humanize(type)}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
										{errors.invoiceType?.message ? (
											<FieldError>{errors.invoiceType.message}</FieldError>
										) : null}
									</Field>
									<Field data-invalid={Boolean(errors.status?.message) || undefined}>
										<FieldLabel htmlFor="invoice-status">
											{t("orders.invoiceStatus")}
										</FieldLabel>
										<Select
											disabled={mutating}
											value={watch("status")}
											onValueChange={(value: SupplierOrderInvoiceStatus) => {
												setValue("status", value, { shouldDirty: true });
											}}
										>
											<SelectTrigger aria-invalid={Boolean(errors.status?.message)} id="invoice-status">
												<SelectValue />
											</SelectTrigger>
											<SelectContent>
												{SUPPLIER_ORDER_INVOICE_STATUSES.map((status) => (
													<SelectItem key={status} value={status}>
														{humanize(status)}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
										{errors.status?.message ? (
											<FieldError>{errors.status.message}</FieldError>
										) : null}
									</Field>
								</div>
								<div className="grid gap-3 md:grid-cols-2">
									<Field data-invalid={Boolean(errors.issueDate?.message) || undefined}>
										<FieldLabel htmlFor="invoice-issue-date">
											{t("orders.invoiceIssueDate", { defaultValue: "Issue date" })}
										</FieldLabel>
										<Input
											aria-invalid={Boolean(errors.issueDate?.message)}
											disabled={mutating}
											id="invoice-issue-date"
											type="date"
											{...register("issueDate")}
										/>
										{errors.issueDate?.message ? (
											<FieldError>{errors.issueDate.message}</FieldError>
										) : null}
									</Field>
									<Field data-invalid={Boolean(errors.dueDate?.message) || undefined}>
										<FieldLabel htmlFor="invoice-due-date">
											{t("orders.invoiceDueDate", { defaultValue: "Due date" })}
										</FieldLabel>
										<Input
											aria-invalid={Boolean(errors.dueDate?.message)}
											disabled={mutating}
											id="invoice-due-date"
											type="date"
											{...register("dueDate")}
										/>
										{errors.dueDate?.message ? (
											<FieldError>{errors.dueDate.message}</FieldError>
										) : null}
									</Field>
								</div>
								<div className="grid gap-3 md:grid-cols-2">
									<Field data-invalid={Boolean(errors.subtotalAmount?.message) || undefined}>
										<FieldLabel htmlFor="invoice-subtotal">
											{t("orders.invoiceSubtotalAmount", {
												defaultValue: "Subtotal amount ({{currency}})",
												currency,
											})}
										</FieldLabel>
										<Input
											aria-invalid={Boolean(errors.subtotalAmount?.message)}
											disabled={mutating}
											id="invoice-subtotal"
											inputMode="decimal"
											placeholder={t("orders.invoiceSubtotalAmount", {
												defaultValue: "Subtotal amount ({{currency}})",
												currency,
											})}
											{...register("subtotalAmount")}
										/>
										{errors.subtotalAmount?.message ? (
											<FieldError>{errors.subtotalAmount.message}</FieldError>
										) : null}
									</Field>
									<Field data-invalid={Boolean(errors.taxAmount?.message) || undefined}>
										<FieldLabel htmlFor="invoice-tax">
											{t("orders.invoiceTaxAmount", {
												defaultValue: "Tax amount ({{currency}})",
												currency,
											})}
										</FieldLabel>
										<Input
											aria-invalid={Boolean(errors.taxAmount?.message)}
											disabled={mutating}
											id="invoice-tax"
											inputMode="decimal"
											placeholder={t("orders.invoiceTaxAmount", {
												defaultValue: "Tax amount ({{currency}})",
												currency,
											})}
											{...register("taxAmount")}
										/>
										{errors.taxAmount?.message ? (
											<FieldError>{errors.taxAmount.message}</FieldError>
										) : null}
									</Field>
								</div>
								<div className="rounded-lg border bg-muted/40 px-4 py-3">
									<p className="text-sm text-muted-foreground">
										{t("orders.invoiceDerivedTotal", { defaultValue: "Derived total" })}
									</p>
									<p className="text-lg font-semibold">
										{formatAmount(derivedTotalAmount, currency)}
									</p>
								</div>
								<Field data-invalid={Boolean(errors.notes?.message) || undefined}>
									<FieldLabel htmlFor="invoice-notes">
										{t("orders.invoiceNotes", { defaultValue: "Notes" })}
									</FieldLabel>
									<Textarea
										aria-invalid={Boolean(errors.notes?.message)}
										disabled={mutating}
										id="invoice-notes"
										rows={4}
										{...register("notes")}
									/>
									{errors.notes?.message ? (
										<FieldError>{errors.notes.message}</FieldError>
									) : null}
								</Field>
							</div>
							<DialogFooter>
								<Button
									disabled={mutating}
									type="button"
									variant="outline"
									onClick={() => {
										setIsDialogOpen(false);
										resetDialog();
									}}
								>
									{t("common.cancel")}
								</Button>
								<Button disabled={mutating} type="submit">
									{editingInvoice ? t("orders.save") : t("orders.create")}
								</Button>
							</DialogFooter>
						</form>
					</FormProvider>
				</DialogContent>
			</Dialog>

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

function mapInvoiceField(
	key: string,
): FieldPath<InvoiceFormValues> | undefined {
	const fieldMap: Record<string, FieldPath<InvoiceFormValues>> = {
		invoiceNumber: "invoiceNumber",
		invoiceType: "invoiceType",
		status: "status",
		issueDate: "issueDate",
		dueDate: "dueDate",
		subtotalAmount: "subtotalAmount",
		taxAmount: "taxAmount",
		notes: "notes",
		root: "root",
		"": "root",
	};

	return fieldMap[key];
}
