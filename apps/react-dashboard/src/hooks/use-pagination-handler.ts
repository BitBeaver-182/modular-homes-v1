import { type PaginationState, type OnChangeFn } from "@tanstack/react-table";
import { type NavigateOptions, useNavigate } from "@tanstack/react-router";
import { useCallback, useMemo } from "react";

type PaginationParams = {
	page: number;
	pageSize: number;
};

type UsePaginationHandlerOptions<TParams extends PaginationParams> = {
	/** Current validated params from TanStack Router */
	currentParams: TParams;
	/** Optional custom navigate options */
	navigateOptions?: Omit<NavigateOptions, "search">;
};

type UsePaginationHandlerReturn = {
	/** Current pagination state for TanStack Table */
	pagination: PaginationState;
	/** Handler for TanStack Table's onPaginationChange */
	onPaginationChange: OnChangeFn<PaginationState>;
};

export function usePaginationHandler<TParams extends PaginationParams>({
	currentParams,
	navigateOptions,
}: UsePaginationHandlerOptions<TParams>): UsePaginationHandlerReturn {
	const navigate = useNavigate();

	const pagination: PaginationState = useMemo(() => {
		return {
			pageIndex: currentParams.page - 1,
			pageSize: currentParams.pageSize,
		};
	}, [currentParams.page, currentParams.pageSize]);

	const onPaginationChange: OnChangeFn<PaginationState> = useCallback(
		(updaterOrValue) => {
			const next =
				typeof updaterOrValue === "function"
					? updaterOrValue(pagination)
					: updaterOrValue;

			const hasPageSizeChanged = next.pageSize !== pagination.pageSize;

			void navigate({
				search: (prev) => {
					return {
						...prev,
						page: hasPageSizeChanged ? 1 : next.pageIndex + 1,
						pageSize: next.pageSize,
					} as typeof prev;
				},
				...(navigateOptions ?? {}),
			});
		},
		[navigate, navigateOptions, pagination],
	);

	return {
		pagination,
		onPaginationChange,
	};
}

