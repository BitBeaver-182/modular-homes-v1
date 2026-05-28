import { type JSX, useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { CalendarIcon, ListChecks } from "lucide-react";

import {
	DateRangeFilter,
	FiltersBar,
	FiltersResetButton,
	MultiSelectFilter,
	SearchFilter,
} from "@/components/filters";
import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
	DataGrid,
	DataGridContainer,
} from "@/components/reui/data-grid/data-grid";
import { DataGridPagination } from "@/components/reui/data-grid/data-grid-pagination";
import { DataGridScrollArea } from "@/components/reui/data-grid/data-grid-scroll-area";
import { DataGridTable } from "@/components/reui/data-grid/data-grid-table";
import { getCoreRowModel, useReactTable } from "@/lib/tanstack-react-table";
import { SupplierFilter } from "@/features/suppliers/components/supplier-filter";
import { Route } from "@/routes/$locale.o.$organizationSlug._admin._operations.supplier-orders";
import type { SupplierOrdersSearchParameters } from "@/features/supplier-orders/search-parameters";
import { usePaginationHandler } from "@/hooks/use-pagination-handler";
import { useSortingHandler } from "@/hooks/use-sorting-handler";
import type { YmdPair } from "@/components/filters/date-range-filter";
import { useGetOrders } from "./hooks/use-get-orders";
import { useOrdersTable } from "./hooks/use-orders-table";
import {
	SUPPLIER_ORDER_STATUSES,
	type SupplierOrder,
	type SupplierOrderStatus,
} from "./types";

const OrdersPage = (): JSX.Element => {
	const { t } = useTranslation();
	const searchParameters = Route.useSearch();
	const { locale, organizationSlug } = Route.useParams();
	const navigate = Route.useNavigate();

	const { sorting, onSortingChange } = useSortingHandler({
		currentParams: searchParameters,
	});

	const { pagination: paginationState, onPaginationChange } =
		usePaginationHandler({
			currentParams: searchParameters,
		});

	const {
		data,
		isLoading: isLoadingList,
		isError: isErrorList,
	} = useGetOrders(searchParameters);

	const rows = data?.data ?? [];
	const pagination = data?.meta.pagination;
	const recordCount = pagination?.total ?? 0;
	const pageCount = pagination?.pageCount ?? 0;

	const updateSearchParameters = useCallback(
		(patch: Partial<SupplierOrdersSearchParameters>): void => {
			void navigate({
				search: (previous) => ({ ...previous, ...patch }),
			});
		},
		[navigate]
	);

	const hasAnyFilter = useMemo(
		(): boolean =>
			searchParameters.order_status !== undefined ||
			searchParameters.createdAt !== undefined ||
			searchParameters.supplier_ids !== undefined,
		[
			searchParameters.order_status,
			searchParameters.createdAt,
			searchParameters.supplier_ids,
		]
	);

	const statusOptions = useMemo(
		(): Array<{ value: SupplierOrderStatus; label: string }> => [
			{
				value: SUPPLIER_ORDER_STATUSES[0],
				label: t("orders.statusDraft", { defaultValue: "Draft" }),
			},
			{
				value: SUPPLIER_ORDER_STATUSES[1],
				label: t("orders.statusProcessing"),
			},
			{ value: SUPPLIER_ORDER_STATUSES[2], label: t("orders.statusShipped") },
			{ value: SUPPLIER_ORDER_STATUSES[3], label: t("orders.statusDelivered") },
			{ value: SUPPLIER_ORDER_STATUSES[4], label: t("orders.statusCancelled") },
		],
		[t]
	);

	const handleOpenOrder = useCallback(
		(order: SupplierOrder): void => {
			void navigate({
				to: "/$locale/o/$organizationSlug/supplier-orders/$orderId",
				params: {
					locale,
					organizationSlug,
					orderId: order.documentId || String(order.id),
				},
				search: (previous) => previous,
			});
		},
		[navigate]
	);

	const { columns } = useOrdersTable({
		onOpenOrder: handleOpenOrder,
	});

	const table = useReactTable({
		data: rows,
		columns,
		getCoreRowModel: getCoreRowModel(),
		state: {
			sorting,
			pagination: paginationState,
		},
		manualPagination: true,
		manualSorting: true,
		onPaginationChange,
		onSortingChange,
		pageCount,
		getRowId: (row): string => row.documentId,
	});

	const handleStatusChange = useCallback(
		(next: Array<SupplierOrderStatus>): void => {
			if (next.length === 0) {
				updateSearchParameters({ order_status: undefined, page: 1 });
				return;
			}
			updateSearchParameters({ order_status: next, page: 1 });
		},
		[updateSearchParameters]
	);

	const handleSearchChange = useCallback(
		(next: string): void => {
			if (next === "") {
				updateSearchParameters({ search: undefined, page: 1 });
				return;
			}
			updateSearchParameters({ search: next, page: 1 });
		},
		[updateSearchParameters]
	);

	const handleDateRangeChange = useCallback(
		(next: YmdPair): void => {
			if (next.from === undefined && next.to === undefined) {
				updateSearchParameters({ createdAt: undefined, page: 1 });
				return;
			}
			updateSearchParameters({
				createdAt: { from: next.from, to: next.to },
				page: 1,
			});
		},
		[updateSearchParameters]
	);

	const handleSupplierChange = useCallback(
		(next: Array<string>): void => {
			if (next.length === 0) {
				updateSearchParameters({ supplier_ids: undefined, page: 1 });
				return;
			}
			updateSearchParameters({ supplier_ids: next, page: 1 });
		},
		[updateSearchParameters]
	);

	const resetFilters = useCallback((): void => {
		updateSearchParameters({
			order_status: undefined,
			createdAt: undefined,
			supplier_ids: undefined,
			page: 1,
		});
	}, [updateSearchParameters]);

	return (
		<div className="flex min-h-0 flex-1 flex-col gap-2">
			<div className="flex shrink-0 flex-col gap-2">
				<Breadcrumb>
					<BreadcrumbList>
						<BreadcrumbItem>
							<BreadcrumbPage className="text-gray-400">
								{t("nav.operations")}
							</BreadcrumbPage>
						</BreadcrumbItem>
						<BreadcrumbSeparator />
						<BreadcrumbItem>
							<BreadcrumbPage className="text-gray-600">
								{t("orders.title")}
							</BreadcrumbPage>
						</BreadcrumbItem>
					</BreadcrumbList>
				</Breadcrumb>

				<div className="flex items-center justify-between">
					<h1 className="text-2xl font-bold">{t("orders.title")}</h1>
				</div>

				<FiltersBar>
					<SearchFilter
						className="mr-1 w-64 flex-none"
						placeholder={t("orders.searchPlaceholder")}
						value={searchParameters.search}
						onDebouncedChange={handleSearchChange}
					/>
					<MultiSelectFilter
						icon={<ListChecks className="size-3.5" />}
						label={t("orders.filterFieldStatus")}
						options={statusOptions}
						value={searchParameters.order_status ?? []}
						onApply={handleStatusChange}
					/>
					<DateRangeFilter
						disableFuture
						showPresets
						icon={<CalendarIcon className="size-3.5" />}
						label={t("orders.filterFieldCreated")}
						value={searchParameters.createdAt}
						onApply={handleDateRangeChange}
					/>
					<SupplierFilter
						value={searchParameters.supplier_ids ?? []}
						onApply={handleSupplierChange}
					/>
					{hasAnyFilter && <FiltersResetButton onClick={resetFilters} />}
				</FiltersBar>
			</div>

			<DataGrid
				emptyMessage={t("orders.noOrders")}
				isLoading={isLoadingList}
				recordCount={recordCount}
				table={table}
				tableClassNames={{
					headerSticky: "sticky top-0 z-10 bg-muted/90 backdrop-blur-xs",
				}}
				tableLayout={{
					width: "fixed",
					headerSticky: true,
				}}
			>
				<div className="w-full space-y-1.5">
					<DataGridContainer>
						<DataGridScrollArea>
							<DataGridTable />
						</DataGridScrollArea>
					</DataGridContainer>
					<DataGridPagination
						info={t("orders.dataGridPaginationInfo")}
						nextPageLabel={t("orders.paginationNext")}
						previousPageLabel={t("orders.paginationPrevious")}
						rowsPerPageLabel={t("orders.pageSize")}
					/>
				</div>
			</DataGrid>

			{isErrorList ? (
				<p className="text-sm text-destructive">{t("orders.listLoadError")}</p>
			) : null}
		</div>
	);
};

export default OrdersPage;
