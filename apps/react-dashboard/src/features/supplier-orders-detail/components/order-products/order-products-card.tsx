import { type ColumnDef, flexRender } from "@tanstack/react-table";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useCallback, useMemo, useState, type JSX } from "react";
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
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import type {
	SupplierOrder,
	SupplierOrderLine,
} from "@/features/supplier-orders/types";
import { useCurrency } from "@/hooks/use-currency";
import { getCoreRowModel, useReactTable } from "@/lib/tanstack-react-table";

interface ProductFormState {
	description: string;
	unitPrice: string;
	quantity: string;
}

interface OrderProductsCardProps {
	currency: string;
	mutating: boolean;
	order: SupplierOrder;
	onSaveOrderLines: (lines: Array<SupplierOrderLine>) => Promise<void>;
}

const EMPTY_FORM: ProductFormState = {
	description: "",
	unitPrice: "",
	quantity: "",
};

const toNumeric = (value: number | string | null | undefined): number => {
	if (typeof value === "number") {
		return value;
	}
	if (typeof value === "string") {
		const parsed = Number.parseFloat(value);
		return Number.isFinite(parsed) ? parsed : 0;
	}
	return 0;
};

const normalizeLine = (
	line: SupplierOrderLine,
	currency: string,
): SupplierOrderLine => {
	const quantity = toNumeric(line.quantity);
	const unitPrice = toNumeric(line.unit_price?.amount);
	const lineTotal = quantity * unitPrice;

	return {
		...line,
		quantity,
		unit_price: {
			amount: unitPrice,
			currency_code: line.unit_price?.currency_code?.toUpperCase() ?? currency,
		},
		line_total: {
			amount: lineTotal,
			currency_code: line.unit_price?.currency_code?.toUpperCase() ?? currency,
		},
	};
};

const toFormState = (line: SupplierOrderLine): ProductFormState => ({
	description: line.description,
	unitPrice: String(toNumeric(line.unit_price.amount)),
	quantity: String(toNumeric(line.quantity)),
});

const toOrderLinePayload = (
	line: SupplierOrderLine,
	currency: string,
): SupplierOrderLine => {
	const normalized = normalizeLine(line, currency);
	return {
		id: normalized.id,
		description: normalized.description,
		quantity: normalized.quantity,
		unit_price: normalized.unit_price,
		line_total: normalized.line_total,
	};
};

export const OrderProductsCard = ({
	currency,
	mutating,
	order,
	onSaveOrderLines,
}: OrderProductsCardProps): JSX.Element => {
	const { t } = useTranslation();
	const { formatAmount } = useCurrency();

	const [isDialogOpen, setIsDialogOpen] = useState(false);
	const [editingIndex, setEditingIndex] = useState<number | null>(null);
	const [deletingIndex, setDeletingIndex] = useState<number | null>(null);
	const [form, setForm] = useState<ProductFormState>(EMPTY_FORM);

	const orderLines = useMemo(
		(): Array<SupplierOrderLine> =>
			(order.orderLines ?? []).map((line) => normalizeLine(line, currency)),
		[currency, order.orderLines],
	);

	const totalAmount = useMemo(
		(): number =>
			orderLines.reduce((sum, line) => sum + toNumeric(line.line_total?.amount), 0),
		[orderLines],
	);

	const resetDialog = (): void => {
		setEditingIndex(null);
		setForm(EMPTY_FORM);
	};

	const openAddDialog = (): void => {
		resetDialog();
		setIsDialogOpen(true);
	};

	const openEditDialog = useCallback(
		(index: number): void => {
			setEditingIndex(index);
			setForm(toFormState(orderLines[index]!));
			setIsDialogOpen(true);
		},
		[orderLines],
	);

	const persistLines = async (nextLines: Array<SupplierOrderLine>, successMessage: string): Promise<void> => {
		await onSaveOrderLines(nextLines.map((line) => toOrderLinePayload(line, currency)));
		toast.success(successMessage);
	};

	const upsertLine = async (): Promise<void> => {
		const description = form.description.trim();
		const unitPrice = Number.parseFloat(form.unitPrice);
		const quantity = Number.parseFloat(form.quantity);

		if (!description || !Number.isFinite(unitPrice) || !Number.isFinite(quantity)) {
			toast.error(t("orders.productsToastCompleteFields"));
			return;
		}
		if (unitPrice <= 0 || quantity <= 0) {
			toast.error(t("orders.productsToastPriceQtyPositive"));
			return;
		}

		const nextLine: SupplierOrderLine = {
			id: editingIndex !== null ? orderLines[editingIndex]?.id : undefined,
			__tempId:
				editingIndex !== null
					? orderLines[editingIndex]?.__tempId
					: crypto.randomUUID(),
			description,
			quantity,
			unit_price: {
				amount: unitPrice,
				currency_code: currency,
			},
			line_total: {
				amount: unitPrice * quantity,
				currency_code: currency,
			},
		};

		const nextLines = [...orderLines];
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

		const nextLines = orderLines.filter((_, index) => index !== deletingIndex);
		await persistLines(nextLines, t("orders.productsToastRemoved"));
		setDeletingIndex(null);
	};

	const columns = useMemo<Array<ColumnDef<SupplierOrderLine>>>(
		(): Array<ColumnDef<SupplierOrderLine>> => [
			{
				accessorKey: "description",
				header: t("orders.productsColumnProduct"),
				cell: ({ row }): string => row.original.description,
			},
			{
				id: "quantity",
				header: () => (
					<span className="block text-right">{t("orders.productsColumnQuantity")}</span>
				),
				cell: ({ row }): JSX.Element => (
					<span className="block text-right">{toNumeric(row.original.quantity)}</span>
				),
			},
			{
				id: "unitPrice",
				header: () => (
					<span className="block text-right">{t("orders.productsColumnUnitPrice")}</span>
				),
				cell: ({ row }): JSX.Element => (
					<span className="block text-right">
						{formatAmount(toNumeric(row.original.unit_price.amount), currency)}
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
						{formatAmount(toNumeric(row.original.line_total?.amount), currency)}
					</span>
				),
			},
			{
				id: "actions",
				header: t("orders.productsColumnActions"),
				cell: ({ row }): JSX.Element => (
					<div className="flex justify-end gap-1">
						<Button
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
		],
		[currency, formatAmount, mutating, openEditDialog, t],
	);

	const table = useReactTable({
		data: orderLines,
		columns,
		getCoreRowModel: getCoreRowModel(),
		getRowId: (row, index): string => String(row.id ?? row.__tempId ?? index),
	});

	return (
		<Card>
			<CardHeader className="flex flex-row items-center justify-between">
				<CardTitle>{t("orders.productsTitle")}</CardTitle>
				<Button
					disabled={mutating}
					size="sm"
					type="button"
					onClick={openAddDialog}
				>
					<Plus className="mr-2 size-4" />
					{t("orders.productsAddAction")}
				</Button>
			</CardHeader>
			<CardContent className="space-y-6">
				{orderLines.length === 0 ? (
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
					<DialogHeader>
						<DialogTitle>
							{editingIndex !== null
								? t("orders.productsEditLineTitle")
								: t("orders.productsAddToOrderTitle")}
						</DialogTitle>
					</DialogHeader>
					<div className="space-y-3">
						<Input
							disabled={mutating}
							placeholder={t("orders.productsFieldProduct")}
							value={form.description}
							onChange={(event) => {
								setForm((previous) => ({
									...previous,
									description: event.target.value,
								}));
							}}
						/>
						<Input
							disabled={mutating}
							inputMode="decimal"
							placeholder={t("orders.productsFieldQuantity")}
							value={form.quantity}
							onChange={(event) => {
								setForm((previous) => ({
									...previous,
									quantity: event.target.value,
								}));
							}}
						/>
						<Input
							disabled={mutating}
							inputMode="decimal"
							placeholder={t("orders.productsFieldUnitPrice", { currency })}
							value={form.unitPrice}
							onChange={(event) => {
								setForm((previous) => ({
									...previous,
									unitPrice: event.target.value,
								}));
							}}
						/>
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
							<Button disabled={mutating} type="button" onClick={() => void upsertLine()}>
								{t("orders.save")}
							</Button>
					</DialogFooter>
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
