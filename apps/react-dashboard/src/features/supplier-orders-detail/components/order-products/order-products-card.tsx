import { type ColumnDef, flexRender } from "@tanstack/react-table";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useCallback, useMemo, useState, type JSX } from "react";
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
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { useCurrency } from "@/hooks/use-currency";
import { useModuflowForm } from "@/lib/moduflow/use-moduflow-form";
import { getCoreRowModel, useReactTable } from "@/lib/tanstack-react-table";

import type {
	SupplierOrderDetailLineResponse,
	SupplierOrderLineWriteInput,
} from "@moduflow/types";

interface ProductFormValues {
	description: string;
	unitCost: string;
	quantity: string;
	root?: string;
}

interface EditableOrderLine extends SupplierOrderDetailLineResponse {
	__tempId?: string;
}

interface OrderProductsCardProps {
	currency: string;
	editable: boolean;
	mutating: boolean;
	orderLines: Array<SupplierOrderDetailLineResponse>;
	onSaveOrderLines: (lines: Array<SupplierOrderLineWriteInput>) => Promise<void>;
}

const EMPTY_FORM: ProductFormValues = {
	description: "",
	unitCost: "",
	quantity: "",
};

const renderReference = (value: string | null): string => value ?? "—";

const normalizeLine = (
	line: SupplierOrderDetailLineResponse,
	currency: string,
): EditableOrderLine => {
	const quantity = Number.isFinite(line.quantity) ? line.quantity : 0;
	const unitCost = Number.isFinite(line.unitCost.amount) ? line.unitCost.amount : 0;
	const lineTotal = quantity * unitCost;

	return {
		...line,
		quantity,
		unitCost: {
			amount: unitCost,
			currencyCode: line.unitCost.currencyCode || currency,
		},
		lineTotal: {
			amount: lineTotal,
			currencyCode: line.lineTotal.currencyCode || currency,
		},
	};
};

const toFormValues = (line: EditableOrderLine): ProductFormValues => ({
	description: line.description ?? "",
	unitCost: String(line.unitCost.amount),
	quantity: String(line.quantity),
});

const toWriteInput = (line: EditableOrderLine): SupplierOrderLineWriteInput => ({
	...(line.id ? { id: line.id } : {}),
	supplierQuoteLineId: line.supplierQuoteLineId,
	houseModelId: line.houseModelId,
	productConfigurationId: line.productConfigurationId,
	description: line.description,
	quantity: line.quantity,
	unitCost: line.unitCost.amount,
});

export const OrderProductsCard = ({
	currency,
	editable,
	mutating,
	orderLines,
	onSaveOrderLines,
}: OrderProductsCardProps): JSX.Element => {
	const { t } = useTranslation();
	const { formatAmount } = useCurrency();

	const [isDialogOpen, setIsDialogOpen] = useState(false);
	const [editingIndex, setEditingIndex] = useState<number | null>(null);
	const [deletingIndex, setDeletingIndex] = useState<number | null>(null);

	const normalizedLines = useMemo(
		(): Array<EditableOrderLine> =>
			orderLines.map((line) => normalizeLine(line, currency)),
		[currency, orderLines],
	);

	const totalAmount = useMemo(
		(): number =>
			normalizedLines.reduce((sum, line) => sum + line.lineTotal.amount, 0),
		[normalizedLines],
	);

	const form = useModuflowForm<ProductFormValues>({
		defaultValues: EMPTY_FORM,
		mapField: (key) => mapProductField(key, editingIndex, normalizedLines.length),
		mode: "onSubmit",
	});
	const {
		register,
		reset,
		submit,
		formState: { errors },
	} = form;

	const resetDialog = (): void => {
		setEditingIndex(null);
		reset(EMPTY_FORM);
	};

	const openAddDialog = (): void => {
		resetDialog();
		setIsDialogOpen(true);
	};

	const openEditDialog = useCallback(
		(index: number): void => {
			setEditingIndex(index);
			reset(toFormValues(normalizedLines[index]!));
			setIsDialogOpen(true);
		},
		[normalizedLines, reset],
	);

	const persistLines = async (
		nextLines: Array<EditableOrderLine>,
		successMessage: string,
	): Promise<void> => {
		await onSaveOrderLines(nextLines.map(toWriteInput));
		toast.success(successMessage);
	};

	const saveLine = async (values: ProductFormValues): Promise<void> => {
		const baseLine =
			editingIndex !== null ? normalizedLines[editingIndex] : undefined;
		const nextLine: EditableOrderLine = {
			id: baseLine?.id ?? "",
			__tempId: baseLine?.__tempId ?? crypto.randomUUID(),
			supplierQuoteLineId: baseLine?.supplierQuoteLineId ?? null,
			houseModelId: baseLine?.houseModelId ?? null,
			productConfigurationId: baseLine?.productConfigurationId ?? null,
			description: values.description.trim() || null,
			quantity:
				values.quantity.trim() === ""
					? 0
					: Number(values.quantity),
			unitCost: {
				amount:
					values.unitCost.trim() === ""
						? 0
						: Number(values.unitCost),
				currencyCode: currency,
			},
			lineTotal: {
				amount:
					(Number(values.unitCost) || 0) * (Number(values.quantity) || 0),
				currencyCode: currency,
			},
			createdAt: baseLine?.createdAt ?? new Date().toISOString(),
		};

		const nextLines = [...normalizedLines];
		if (editingIndex !== null) {
			nextLines[editingIndex] = nextLine;
			await persistLines(nextLines, t("orders.productsToastUpdated"));
		} else {
			nextLines.push(nextLine);
			await persistLines(nextLines, t("orders.productsToastAdded"));
		}

		setIsDialogOpen(false);
		resetDialog();
	};

	const deleteLine = async (): Promise<void> => {
		if (deletingIndex === null) {
			return;
		}

		const nextLines = normalizedLines.filter((_, index) => index !== deletingIndex);
		await persistLines(nextLines, t("orders.productsToastRemoved"));
		setDeletingIndex(null);
	};

	const columns = useMemo<Array<ColumnDef<EditableOrderLine>>>(
		(): Array<ColumnDef<EditableOrderLine>> => {
			const baseColumns: Array<ColumnDef<EditableOrderLine>> = [
				{
					accessorKey: "description",
					header: t("orders.productsColumnProduct"),
					cell: ({ row }): string =>
						row.original.description?.trim() || t("orders.notApplicable"),
				},
				{
					accessorKey: "houseModelId",
					header: t("orders.productsColumnModel", { defaultValue: "Model ID" }),
					cell: ({ row }): string => renderReference(row.original.houseModelId),
				},
				{
					accessorKey: "productConfigurationId",
					header: t("orders.productsColumnConfiguration", {
						defaultValue: "Configuration ID",
					}),
					cell: ({ row }): string =>
						renderReference(row.original.productConfigurationId),
				},
				{
					id: "quantity",
					header: () => (
						<span className="block text-right">{t("orders.productsColumnQuantity")}</span>
					),
					cell: ({ row }): JSX.Element => (
						<span className="block text-right">{row.original.quantity}</span>
					),
				},
				{
					id: "unitCost",
					header: () => (
						<span className="block text-right">
							{t("orders.productsColumnUnitPrice", { defaultValue: "Unit cost" })}
						</span>
					),
					cell: ({ row }): JSX.Element => (
						<span className="block text-right">
							{formatAmount(row.original.unitCost.amount, row.original.unitCost.currencyCode)}
						</span>
					),
				},
				{
					id: "lineTotal",
					header: () => (
						<span className="block text-right">{t("orders.productsColumnTotal")}</span>
					),
					cell: ({ row }): JSX.Element => (
						<span className="block text-right font-medium">
							{formatAmount(
								row.original.lineTotal.amount,
								row.original.lineTotal.currencyCode,
							)}
						</span>
					),
				},
			];

			if (!editable) {
				return baseColumns;
			}

			return [
				...baseColumns,
				{
					id: "actions",
					header: t("orders.productsColumnActions"),
					cell: ({ row }): JSX.Element => (
						<div className="flex justify-end gap-1">
							<Button
								aria-label={t("orders.productsEditAction", {
									defaultValue: "Edit line",
								})}
								disabled={mutating}
								size="icon-sm"
								type="button"
								variant="ghost"
								onClick={() => {
									openEditDialog(row.index);
								}}
							>
								<Pencil className="size-4" />
							</Button>
							<Button
								aria-label={t("orders.productsDeleteAction", {
									defaultValue: "Remove line",
								})}
								disabled={mutating}
								size="icon-sm"
								type="button"
								variant="ghost"
								onClick={() => {
									setDeletingIndex(row.index);
								}}
							>
								<Trash2 className="size-4" />
							</Button>
						</div>
					),
				},
			];
		},
		[editable, formatAmount, mutating, openEditDialog, t],
	);

	const table = useReactTable({
		data: normalizedLines,
		columns,
		getCoreRowModel: getCoreRowModel(),
		getRowId: (row, index): string => row.id || row.__tempId || String(index),
	});

	return (
		<Card>
			<CardHeader className="flex flex-row items-center justify-between">
				<CardTitle>{t("orders.productsTitle")}</CardTitle>
				{editable ? (
					<Button
						disabled={mutating}
						size="sm"
						type="button"
						onClick={openAddDialog}
					>
						<Plus className="mr-2 size-4" />
						{t("orders.productsAddAction")}
					</Button>
				) : null}
			</CardHeader>
			<CardContent className="space-y-6">
				{!editable ? (
					<p className="text-sm text-muted-foreground">
						{t("orders.productsLockedDescription", {
							defaultValue:
								"Order lines are read-only after the order reaches a terminal status.",
						})}
					</p>
				) : null}
				{normalizedLines.length === 0 ? (
					<p className="text-sm text-muted-foreground">{t("orders.productsEmpty")}</p>
				) : (
					<Table>
						<TableHeader>
							{table.getHeaderGroups().map((group) => (
								<TableRow key={group.id}>
									{group.headers.map((header) => (
										<TableHead key={header.id}>
											{header.isPlaceholder
												? null
												: flexRender(
														header.column.columnDef.header,
														header.getContext(),
													)}
										</TableHead>
									))}
								</TableRow>
							))}
						</TableHeader>
						<TableBody>
							{table.getRowModel().rows.map((row) => (
								<TableRow key={row.id}>
									{row.getVisibleCells().map((cell) => (
										<TableCell key={cell.id}>
											{flexRender(cell.column.columnDef.cell, cell.getContext())}
										</TableCell>
									))}
								</TableRow>
							))}
						</TableBody>
					</Table>
				)}

				<div className="flex items-center justify-between rounded-lg border bg-muted/40 px-4 py-3">
					<span className="text-sm text-muted-foreground">
						{t("orders.productsTotalOrderAmount")}
					</span>
					<span className="text-lg font-semibold">
						{formatAmount(totalAmount, currency)}
					</span>
				</div>
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
					<FormProvider {...form}>
						<form
							className="contents"
							onSubmit={submit(async (values): Promise<void> => {
								await saveLine(values);
							})}
						>
							<DialogHeader>
								<DialogTitle>
									{editingIndex !== null
										? t("orders.productsEditLineTitle")
										: t("orders.productsAddToOrderTitle")}
								</DialogTitle>
								<DialogDescription>
									{t("orders.productsDialogDescription", {
										defaultValue: "Update the operational order line details.",
									})}
								</DialogDescription>
							</DialogHeader>
							{errors.root?.message ? (
								<p className="text-destructive text-sm" role="alert">
									{errors.root.message}
								</p>
							) : null}
							<div className="grid gap-3">
								<Field data-invalid={Boolean(errors.description?.message) || undefined}>
									<FieldLabel htmlFor="order-line-description">
										{t("orders.productsFieldProduct")}
									</FieldLabel>
									<Input
										aria-invalid={Boolean(errors.description?.message)}
										disabled={mutating}
										id="order-line-description"
										placeholder={t("orders.productsFieldProduct")}
										{...register("description")}
									/>
									{errors.description?.message ? (
										<FieldError>{errors.description.message}</FieldError>
									) : null}
								</Field>
								<Field data-invalid={Boolean(errors.quantity?.message) || undefined}>
									<FieldLabel htmlFor="order-line-quantity">
										{t("orders.productsFieldQuantity")}
									</FieldLabel>
									<Input
										aria-invalid={Boolean(errors.quantity?.message)}
										disabled={mutating}
										id="order-line-quantity"
										inputMode="numeric"
										placeholder={t("orders.productsFieldQuantity")}
										{...register("quantity")}
									/>
									{errors.quantity?.message ? (
										<FieldError>{errors.quantity.message}</FieldError>
									) : null}
								</Field>
								<Field data-invalid={Boolean(errors.unitCost?.message) || undefined}>
									<FieldLabel htmlFor="order-line-unit-cost">
										{t("orders.productsFieldUnitPrice", { currency })}
									</FieldLabel>
									<Input
										aria-invalid={Boolean(errors.unitCost?.message)}
										disabled={mutating}
										id="order-line-unit-cost"
										inputMode="decimal"
										placeholder={t("orders.productsFieldUnitPrice", { currency })}
										{...register("unitCost")}
									/>
									{errors.unitCost?.message ? (
										<FieldError>{errors.unitCost.message}</FieldError>
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
									{t("orders.save")}
								</Button>
							</DialogFooter>
						</form>
					</FormProvider>
				</DialogContent>
			</Dialog>

			<AlertDialog
				open={deletingIndex !== null}
				onOpenChange={(open) => {
					if (!open) {
						setDeletingIndex(null);
					}
				}}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>{t("orders.productsRemoveTitle")}</AlertDialogTitle>
						<AlertDialogDescription>
							{t("orders.productsRemoveDescription")}
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel disabled={mutating}>
							{t("common.cancel")}
						</AlertDialogCancel>
						<AlertDialogAction
							disabled={mutating}
							onClick={() => void deleteLine()}
						>
							{t("orders.productsRemoveAction")}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</Card>
	);
};

function mapProductField(
	key: string,
	editingIndex: number | null,
	lineCount: number,
): FieldPath<ProductFormValues> | undefined {
	if (key === "" || key === "root") {
		return "root";
	}

	const targetIndex = editingIndex ?? lineCount;
	if (key === `orderLines.${targetIndex}.description`) {
		return "description";
	}
	if (key === `orderLines.${targetIndex}.quantity`) {
		return "quantity";
	}
	if (key === `orderLines.${targetIndex}.unitCost`) {
		return "unitCost";
	}

	return undefined;
}
