import { Plus } from "lucide-react";
import { type JSX, useCallback, useState } from "react";
import { useTranslation } from "react-i18next";

import { FiltersBar, SearchFilter } from "@/components/filters";
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
import { usePaginationHandler } from "@/hooks/use-pagination-handler";
import { useSortingHandler } from "@/hooks/use-sorting-handler";
import { getCoreRowModel, useReactTable } from "@/lib/tanstack-react-table";
import {
	Route,
	type SuppliersQueryParams,
} from "@/routes/$locale.o.$organizationSlug._admin._operations.suppliers";

import { SupplierDeleteAlert } from "./components/supplier-delete-alert";
import { SupplierFormDialog } from "./components/supplier-form-dialog";
import { useCreateSupplier } from "./hooks/use-create-supplier";
import { useDeleteSupplier } from "./hooks/use-delete-supplier";
import { useGetSuppliers } from "./hooks/use-get-suppliers";
import { useSuppliersTable } from "./hooks/use-suppliers-table";
import { useUpdateSupplier } from "./hooks/use-update-supplier";

import type { SupplierResponse, CreateSupplierRequest } from "@moduflow/types";

const SuppliersPage = (): JSX.Element => {
	const { t } = useTranslation();
	const searchParams = Route.useSearch();
	const navigate = Route.useNavigate();
	const { activeMembership } = Route.useRouteContext();
	const organizationId = activeMembership.organization.id;
	const [createOpen, setCreateOpen] = useState(false);
	const [editingSupplier, setEditingSupplier] = useState<SupplierResponse | null>(null);
	const [deletingSupplier, setDeletingSupplier] = useState<SupplierResponse | null>(
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
	} = useGetSuppliers(organizationId, searchParams);
	const { isPending: isCreating, mutateAsync: createSupplier } =
		useCreateSupplier(organizationId);
	const { isPending: isUpdating, mutateAsync: updateSupplier } =
		useUpdateSupplier(organizationId);
	const { isPending: isDeleting, mutateAsync: deleteSupplier } =
		useDeleteSupplier(organizationId);
	const suppliers = data?.data ?? [];
	const pagination = data?.meta.pagination;
	const recordCount = pagination?.total ?? 0;
	const pageCount = pagination?.pageCount ?? 0;
	const { columns } = useSuppliersTable({
		onEdit: (supplier: SupplierResponse) => {
			setEditingSupplier(supplier);
		},
		onDelete: (supplier: SupplierResponse) => {
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

	const handleCreate = async (value: CreateSupplierRequest): Promise<void> => {
		await createSupplier(value);
	};

	const handleUpdate = async (value: CreateSupplierRequest): Promise<void> => {
		if (!editingSupplier) {
			return;
		}

		await updateSupplier({
			id: editingSupplier.id,
			input: value,
		});
	};

	const handleDelete = async (supplier: SupplierResponse): Promise<void> => {
		await deleteSupplier(supplier.id);
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
		getRowId: (row): string => row.id,
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
