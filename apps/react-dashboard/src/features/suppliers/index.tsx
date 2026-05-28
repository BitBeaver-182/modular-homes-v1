import { type JSX, useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { FiltersBar, SearchFilter } from "@/components/filters";
import {
	DataGrid,
	DataGridContainer,
} from "@/components/reui/data-grid/data-grid";
import { DataGridPagination } from "@/components/reui/data-grid/data-grid-pagination";
import { DataGridScrollArea } from "@/components/reui/data-grid/data-grid-scroll-area";
import { DataGridTable } from "@/components/reui/data-grid/data-grid-table";
import { getCoreRowModel, useReactTable } from "@/lib/tanstack-react-table";
import { useGetSuppliers } from "./hooks/use-get-suppliers";
import { useCreateSupplier } from "./hooks/use-create-supplier";
import { useUpdateSupplier } from "./hooks/use-update-supplier";
import { useDeleteSupplier } from "./hooks/use-delete-supplier";
import { SupplierFormDialog } from "./components/supplier-form-dialog";
import type { Supplier, SupplierWriteInput } from "./types";
import { SupplierDeleteAlert } from "./components/supplier-delete-alert";
import { useSuppliersTable } from "./hooks/use-suppliers-table";
import {
	Route,
	type SuppliersQueryParams,
} from "@/routes/$locale.o.$organizationSlug._admin._operations.suppliers";
import { usePaginationHandler } from "@/hooks/use-pagination-handler";
import { useSortingHandler } from "@/hooks/use-sorting-handler";

const SuppliersPage = (): JSX.Element => {
	const { t } = useTranslation();
	const searchParams = Route.useSearch();
	const navigate = Route.useNavigate();
	const [createOpen, setCreateOpen] = useState(false);
	const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
	const [deletingSupplier, setDeletingSupplier] = useState<Supplier | null>(
		null
	);

	const { sorting, onSortingChange } = useSortingHandler({
		currentParams: searchParams,
		defaultSorting: [{ id: "name", desc: false }],
	});

	const { pagination: paginationState, onPaginationChange } =
		usePaginationHandler({
			currentParams: searchParams,
		});

	const {
		data,
		isLoading: isLoadingList,
		isError: isErrorList,
	} = useGetSuppliers(searchParams);
	const { isPending: isCreating, mutateAsync: createSupplier } =
		useCreateSupplier();
	const { isPending: isUpdating, mutateAsync: updateSupplier } =
		useUpdateSupplier();
	const { isPending: isDeleting, mutateAsync: deleteSupplier } =
		useDeleteSupplier();
	const suppliers = data?.data ?? [];
	const pagination = data?.meta.pagination;
	const recordCount = pagination?.total ?? 0;
	const pageCount = pagination?.pageCount ?? 0;
	const { columns } = useSuppliersTable({
		onEdit: (supplier: Supplier) => {
			setEditingSupplier(supplier);
		},
		onDelete: (supplier: Supplier) => {
			setDeletingSupplier(supplier);
		},
	});

	const updateSearchParams = useCallback(
		(patch: Partial<SuppliersQueryParams>): void => {
			void navigate({
				search: (prev) => ({ ...prev, ...patch }),
			});
		},
		[navigate]
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

	const handleCreate = async (value: SupplierWriteInput): Promise<void> => {
		await createSupplier(value);
	};

	const handleUpdate = async (value: SupplierWriteInput): Promise<void> => {
		if (!editingSupplier) {
			return;
		}

		await updateSupplier({
			documentId: editingSupplier.documentId,
			input: value,
		});
	};

	const handleDelete = async (supplier: Supplier): Promise<void> => {
		await deleteSupplier(supplier.documentId);
	};

	const table = useReactTable({
		data: suppliers,
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

	return (
		<div className="flex min-h-0 flex-1 flex-col gap-2">
			<Breadcrumb className="mb-1">
				<BreadcrumbList>
					<BreadcrumbItem>
						<BreadcrumbPage className="text-gray-400">
							{t("nav.operations")}
						</BreadcrumbPage>
					</BreadcrumbItem>
					<BreadcrumbSeparator />
					<BreadcrumbItem>
						<BreadcrumbPage className="text-gray-600">
							{t("suppliers.title")}
						</BreadcrumbPage>
					</BreadcrumbItem>
				</BreadcrumbList>
			</Breadcrumb>

			<div className="flex items-center justify-between mb-3">
				<h1 className="text-2xl font-bold">{t("suppliers.title")}</h1>
				<Button
					type="button"
					size="lg"
					onClick={(): void => {
						setCreateOpen(true);
					}}
				>
					<Plus className="size-4" />
					{t("suppliers.addSupplier")}
				</Button>
			</div>

			<FiltersBar>
				<SearchFilter
					className="mr-1 w-72 flex-none"
					placeholder={t("suppliers.searchPlaceholder")}
					value={searchParams.search}
					onDebouncedChange={handleSearchChange}
				/>
			</FiltersBar>

			<DataGrid
				emptyMessage={t("suppliers.noSuppliers")}
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
						info={t("suppliers.dataGridPaginationInfo")}
						nextPageLabel={t("suppliers.paginationNext")}
						previousPageLabel={t("suppliers.paginationPrevious")}
						rowsPerPageLabel={t("suppliers.pageSize")}
					/>
				</div>
			</DataGrid>

			{isErrorList ? (
				<p className="text-sm text-destructive">
					{t("suppliers.listLoadError")}
				</p>
			) : null}

			<SupplierFormDialog
				loading={isCreating}
				mode="create"
				open={createOpen}
				onOpenChange={setCreateOpen}
				onSubmit={handleCreate}
			/>

			<SupplierFormDialog
				initialValue={editingSupplier}
				loading={isUpdating}
				mode="edit"
				open={!!editingSupplier}
				onSubmit={handleUpdate}
				onOpenChange={(open): void => {
					if (!open) {
						setEditingSupplier(null);
					}
				}}
			/>

			<SupplierDeleteAlert
				// key={deleteDialogNonce}
				loading={isDeleting}
				open={!!deletingSupplier}
				supplier={deletingSupplier}
				onConfirm={handleDelete}
				onOpenChange={(open): void => {
					if (!open) {
						setDeletingSupplier(null);
					}
				}}
			/>
		</div>
	);
};

export default SuppliersPage;
