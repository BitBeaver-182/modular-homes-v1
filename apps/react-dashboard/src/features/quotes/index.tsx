import { CalendarIcon, DollarSignIcon, ListChecks, Plus } from "lucide-react";
import { type JSX, useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import {
	DateRangeFilter,
	FiltersBar,
	FiltersResetButton,
	MultiSelectFilter,
	NumberRangeFilter,
	SearchFilter,
} from "@/components/filters";
import type { YmdPair } from "@/components/filters/date-range-filter";
import type { NumberPair } from "@/components/filters/number-range-filter";
import {
	DataGrid,
	DataGridContainer,
} from "@/components/reui/data-grid/data-grid";
import { DataGridPagination } from "@/components/reui/data-grid/data-grid-pagination";
import { DataGridScrollArea } from "@/components/reui/data-grid/data-grid-scroll-area";
import { DataGridTable } from "@/components/reui/data-grid/data-grid-table";
import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { useCreateSupplierOrderFromQuote } from "@/features/supplier-orders-detail/hooks/use-create-supplier-order-from-quote";
import { SupplierFilter } from "@/features/suppliers/components/supplier-filter";
import { getCoreRowModel, useReactTable } from "@/lib/tanstack-react-table";
import {
	Route,
	type QuotesQueryParams,
} from "@/routes/$locale.o.$organizationSlug._admin._operations.quotes";

import { QuoteCreateSupplierOrderAlert } from "./components/quote-create-supplier-order-alert";
import { QuoteDeleteAlert } from "./components/quote-delete-alert";
import { QuoteFormDialog } from "./components/quote-form-dialog";
import { QuoteStatusAlert } from "./components/quote-status-alert";
import { QuotesEmptyState } from "./components/quotes-empty-state";
import { useCreateQuote } from "./hooks/use-create-quote";
import { useDeleteQuote } from "./hooks/use-delete-quote";
import { useGetQuotes } from "./hooks/use-get-quotes";
import { useQuotesTable } from "./hooks/use-quotes-table";
import { useUpdateQuote } from "./hooks/use-update-quote";
import { quoteToWriteInput } from "./lib/quote-form";
import { usePaginationHandler } from "../../hooks/use-pagination-handler";
import { useSortingHandler } from "../../hooks/use-sorting-handler";

import type { Quote, QuoteStatus, QuoteWriteInput } from "./types";

interface StatusAction {
	quote: Quote;
	status: Extract<QuoteStatus, "accepted" | "rejected">;
}

const QuotesPage = (): JSX.Element => {
	const { t } = useTranslation();
	const { locale, organizationSlug } = Route.useParams();
	const searchParams = Route.useSearch();
	const navigate = Route.useNavigate();
	const [createOpen, setCreateOpen] = useState(false);
	const [editingQuote, setEditingQuote] = useState<Quote | null>(null);
	const [deletingQuote, setDeletingQuote] = useState<Quote | null>(null);
	const [statusAction, setStatusAction] = useState<StatusAction | null>(null);
	const [supplierOrderConfirmQuote, setSupplierOrderConfirmQuote] =
		useState<Quote | null>(null);

	const { sorting, onSortingChange } = useSortingHandler({
		currentParams: searchParams,
		defaultSorting: [{ id: "createdAt", desc: true }],
	});

	const { pagination: paginationState, onPaginationChange } =
		usePaginationHandler({
			currentParams: searchParams,
		});

	const {
		data,
		isLoading: isLoadingList,
		isError: isErrorList,
	} = useGetQuotes(searchParams);

	const { isPending: isCreating, mutateAsync: createQuote } = useCreateQuote();
	const { isPending: isUpdating, mutateAsync: updateQuote } = useUpdateQuote();
	const { isPending: isDeleting, mutateAsync: deleteQuote } = useDeleteQuote();
	const {
		mutateAsync: createSupplierOrder,
		isPending: isCreatingSupplierOrder,
	} = useCreateSupplierOrderFromQuote();

	const rows = data?.data ?? [];
	const pagination = data?.meta.pagination;
	const recordCount = pagination?.total ?? 0;
	const pageCount = pagination?.pageCount ?? 0;

	const updateSearchParams = useCallback(
		(patch: Partial<QuotesQueryParams>): void => {
			void navigate({
				search: (prev) => ({ ...prev, ...patch }),
			});
		},
		[navigate]
	);

	const hasAnyFilter = useMemo((): boolean => {
		return (
			searchParams.quote_status !== undefined ||
			searchParams.createdAt !== undefined ||
			searchParams.amount !== undefined ||
			searchParams.supplier_ids !== undefined
		);
	}, [
		searchParams.quote_status,
		searchParams.createdAt,
		searchParams.amount,
		searchParams.supplier_ids,
	]);

	const statusOptions = useMemo(
		(): Array<{ value: QuoteStatus; label: string }> => [
			{ value: "pending", label: t("quotes.statusPending") },
			{ value: "accepted", label: t("quotes.statusAccepted") },
			{ value: "rejected", label: t("quotes.statusRejected") },
		],
		[t]
	);

	const { columns } = useQuotesTable({
		onEdit: (quote: Quote): void => {
			setEditingQuote(quote);
		},
		onDelete: (quote: Quote): void => {
			setDeletingQuote(quote);
		},
		onCreateSupplierOrder: (quote: Quote): void => {
			setSupplierOrderConfirmQuote(quote);
		},
		onRequestStatus: (quote, status): void => {
			setStatusAction({ quote, status });
		},
	});

	const emptyMessage = useMemo((): string | JSX.Element => {
		if (isLoadingList) {
			return t("quotes.noQuotes");
		}

		if (rows.length === 0) {
			return (
				<QuotesEmptyState
					onAddQuote={(): void => {
						setCreateOpen(true);
					}}
				/>
			);
		}

		return t("quotes.noQuotes");
	}, [isLoadingList, rows.length, t]);

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

	const handleCreate = async (value: QuoteWriteInput): Promise<void> => {
		await createQuote(value);
	};

	const handleUpdate = async (value: QuoteWriteInput): Promise<void> => {
		if (!editingQuote) {
			return;
		}

		await updateQuote({ documentId: editingQuote.documentId, input: value });
	};

	const handleDelete = async (quote: Quote): Promise<void> => {
		await deleteQuote(quote.documentId);
	};

	const handleCreateSupplierOrderConfirm = async (
		quote: Quote
	): Promise<void> => {
		const order = await createSupplierOrder({
			quoteDocumentId: quote.documentId,
		});
		void navigate({
			to: "/$locale/o/$organizationSlug/supplier-orders/$orderId",
			params: {
				locale,
				organizationSlug,
				orderId: order.documentId,
			},
			search: {
				page: 1,
				pageSize: 10,
			},
		});
	};

	const handleStatusChange = useCallback(
		(next: Array<QuoteStatus>): void => {
			if (next.length === 0) {
				updateSearchParams({ quote_status: undefined, page: 1 });
				return;
			}
			updateSearchParams({ quote_status: next, page: 1 });
		},
		[updateSearchParams]
	);

	const handleSearchChange = useCallback(
		(next: string): void => {
			if (next === "") {
				updateSearchParams({ search: undefined, page: 1 });
				return;
			}
			updateSearchParams({ search: next, page: 1 });
		},
		[updateSearchParams]
	);

	const handleDateRangeChange = useCallback(
		(next: YmdPair): void => {
			if (next.from === undefined && next.to === undefined) {
				updateSearchParams({ createdAt: undefined, page: 1 });
				return;
			}
			updateSearchParams({
				createdAt: { from: next.from, to: next.to },
				page: 1,
			});
		},
		[updateSearchParams]
	);

	const handleAmountChange = useCallback(
		(next: NumberPair): void => {
			if (next.min === undefined && next.max === undefined) {
				updateSearchParams({ amount: undefined, page: 1 });
				return;
			}
			updateSearchParams({ amount: { min: next.min, max: next.max }, page: 1 });
		},
		[updateSearchParams]
	);

	const handleSupplierChange = useCallback(
		(next: Array<string>): void => {
			if (next.length === 0) {
				updateSearchParams({ supplier_ids: undefined, page: 1 });
				return;
			}
			updateSearchParams({ supplier_ids: next, page: 1 });
		},
		[updateSearchParams]
	);

	const resetFilters = useCallback((): void => {
		updateSearchParams({
			quote_status: undefined,
			createdAt: undefined,
			amount: undefined,
			supplier_ids: undefined,
			page: 1,
		});
	}, [updateSearchParams]);

	const handleStatusConfirm = async (
		quote: Quote,
		status: QuoteStatus
	): Promise<void> => {
		await updateQuote({
			documentId: quote.documentId,
			input: { ...quoteToWriteInput(quote), status },
		});
	};

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
								{t("quotes.title")}
							</BreadcrumbPage>
						</BreadcrumbItem>
					</BreadcrumbList>
				</Breadcrumb>

				<div className="flex items-center justify-between">
					<h1 className="text-2xl font-bold">{t("quotes.title")}</h1>
					<Button
						size="lg"
						type="button"
						onClick={(): void => {
							setCreateOpen(true);
						}}
					>
						<Plus className="size-4" />
						{t("quotes.addQuote")}
					</Button>
				</div>

				<FiltersBar>
					<SearchFilter
						className="mr-1 w-64 flex-none"
						placeholder={t("quotes.searchPlaceholder")}
						value={searchParams.search}
						onDebouncedChange={handleSearchChange}
					/>
					<MultiSelectFilter
						label={t("quotes.filterFieldStatus")}
						icon={<ListChecks className="size-3.5" />}
						options={statusOptions}
						value={searchParams.quote_status ?? []}
						onApply={handleStatusChange}
					/>
					<DateRangeFilter
						label={t("quotes.filterFieldCreated")}
						icon={<CalendarIcon className="size-3.5" />}
						showPresets
						disableFuture
						value={searchParams.createdAt}
						onApply={handleDateRangeChange}
					/>
					<NumberRangeFilter
						label={t("quotes.filterFieldAmount")}
						icon={<DollarSignIcon className="size-3.5" />}
						min={0}
						max={100_000}
						step={10}
						value={searchParams.amount}
						onApply={handleAmountChange}
					/>
					<SupplierFilter
						value={searchParams.supplier_ids ?? []}
						onApply={handleSupplierChange}
					/>
					{hasAnyFilter && <FiltersResetButton onClick={resetFilters} />}
				</FiltersBar>
			</div>

			<DataGrid
				emptyMessage={emptyMessage}
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
						info={t("quotes.dataGridPaginationInfo")}
						nextPageLabel={t("quotes.paginationNext")}
						previousPageLabel={t("quotes.paginationPrevious")}
						rowsPerPageLabel={t("quotes.pageSize")}
					/>
				</div>
			</DataGrid>

			{isErrorList ? (
				<p className="text-sm text-destructive">{t("quotes.listLoadError")}</p>
			) : null}

			<QuoteFormDialog
				loading={isCreating}
				mode="create"
				open={createOpen}
				onOpenChange={setCreateOpen}
				onSubmit={handleCreate}
			/>

			<QuoteFormDialog
				initialQuote={editingQuote}
				loading={isUpdating}
				mode="edit"
				open={!!editingQuote}
				onSubmit={handleUpdate}
				onOpenChange={(open): void => {
					if (!open) {
						setEditingQuote(null);
					}
				}}
			/>

			<QuoteDeleteAlert
				key={deletingQuote?.documentId ?? "none"}
				loading={isDeleting}
				open={!!deletingQuote}
				quote={deletingQuote}
				onConfirm={handleDelete}
				onOpenChange={(open): void => {
					if (!open) {
						setDeletingQuote(null);
					}
				}}
			/>

			<QuoteStatusAlert
				key={
					statusAction
						? `${statusAction.quote.documentId}-${statusAction.status}`
						: "none"
				}
				loading={isUpdating}
				nextStatus={statusAction?.status ?? null}
				open={!!statusAction}
				quote={statusAction?.quote ?? null}
				onConfirm={handleStatusConfirm}
				onOpenChange={(open): void => {
					if (!open) {
						setStatusAction(null);
					}
				}}
			/>

			<QuoteCreateSupplierOrderAlert
				key={supplierOrderConfirmQuote?.documentId ?? "none"}
				loading={isCreatingSupplierOrder}
				open={!!supplierOrderConfirmQuote}
				quote={supplierOrderConfirmQuote}
				onConfirm={handleCreateSupplierOrderConfirm}
				onOpenChange={(open): void => {
					if (!open) {
						setSupplierOrderConfirmQuote(null);
					}
				}}
			/>
		</div>
	);
};

export default QuotesPage;
