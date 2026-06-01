import { type ColumnDef, flexRender } from "@tanstack/react-table";
import { type JSX, useMemo } from "react";
import { useTranslation } from "react-i18next";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { useCurrency } from "@/hooks/use-currency";
import { getCoreRowModel, useReactTable } from "@/lib/tanstack-react-table";

import type { SupplierOrderDetailLineResponse } from "@moduflow/types";

interface OrderProductsCardProps {
	currency: string;
	orderLines: Array<SupplierOrderDetailLineResponse>;
}

const renderReference = (value: string | null): string => value ?? "—";

export const OrderProductsCard = ({
	currency,
	orderLines,
}: OrderProductsCardProps): JSX.Element => {
	const { t } = useTranslation();
	const { formatAmount } = useCurrency();

	const totalAmount = useMemo(
		(): number =>
			orderLines.reduce((sum, line) => sum + line.lineTotal.amount, 0),
		[orderLines],
	);

	const columns = useMemo<Array<ColumnDef<SupplierOrderDetailLineResponse>>>(
		(): Array<ColumnDef<SupplierOrderDetailLineResponse>> => [
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
		],
		[formatAmount, t],
	);

	const table = useReactTable({
		data: orderLines,
		columns,
		getCoreRowModel: getCoreRowModel(),
		getRowId: (row): string => row.id,
	});

	return (
		<Card>
			<CardHeader className="flex flex-row items-center justify-between">
				<CardTitle>{t("orders.productsTitle")}</CardTitle>
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
		</Card>
	);
};
