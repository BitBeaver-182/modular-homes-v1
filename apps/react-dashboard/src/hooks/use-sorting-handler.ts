import { type OnChangeFn, type SortingState } from "@tanstack/react-table";
import { type NavigateOptions, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef } from "react";

type SortingParams<TSortBy extends string = string> = {
  sortBy?: TSortBy;
  sortOrder?: "asc" | "desc";
};

type TypedSortingState<T extends string> = Array<{
  id: T;
  desc: boolean;
}>;

type UseSortingHandlerOptions<
  TParams extends SortingParams = SortingParams,
> = {
  /** Current validated params from TanStack Router */
  currentParams: TParams;
  /** Default sorting configuration - id must match one of the valid sortBy values */
  defaultSorting?: TypedSortingState<NonNullable<TParams["sortBy"]>>;
  /** Optional custom navigate options */
  navigateOptions?: Omit<NavigateOptions, "search">;
};

type UseSortingHandlerReturn = {
  /** Current sorting state for TanStack Table */
  sorting: SortingState;
  /** Handler for TanStack Table's onSortingChange */
  onSortingChange: OnChangeFn<SortingState>;
};

/**
 * Creates a sorting handler that syncs TanStack Table sorting with TanStack Router params.
 * 
 * @example
 * ```tsx
 * const searchSchema = createSortSchema(["name", "email", "createdAt"] as const);
 * type SearchParams = z.infer<typeof searchSchema>;
 * 
 * const searchParams = Route.useSearch();
 * const { sorting, onSortingChange } = useSortingHandler<SearchParams>({
 *   currentParams: searchParams,
 *   defaultSorting: [{ id: "createdAt", desc: true }], // ✅ typed
 *   // defaultSorting: [{ id: "invalid", desc: true }], // ❌ type error
 * });
 * 
 * const table = useReactTable({
 *   // ...
 *   state: { sorting },
 *   onSortingChange,
 * });
 * ```
 */
export function useSortingHandler<TParams extends SortingParams = SortingParams>({
  currentParams,
  defaultSorting = [],
  navigateOptions = {},
}: UseSortingHandlerOptions<TParams>): UseSortingHandlerReturn {
  const navigate = useNavigate();
  const didApplyDefaultSortRef = useRef(false);

  // Ensure defaultSorting is reflected in the URL (single-sort only).
  useEffect(() => {
    if (didApplyDefaultSortRef.current) return;
    if (currentParams.sortBy) return;
    if (defaultSorting.length === 0) return;

    const first = defaultSorting[0];
    if (!first?.id) return;

    navigate({
      search: (prev) => {
        return {
          ...prev,
          sortBy: first.id as TParams["sortBy"],
          sortOrder: first.desc ? "desc" : "asc",
        } as typeof prev;
      },
      ...navigateOptions,
    });
    didApplyDefaultSortRef.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentParams.sortBy, defaultSorting, navigate]);

  // Convert URL params to TanStack Table sorting state
  const sorting: SortingState = currentParams.sortBy
    ? [
      {
        id: currentParams.sortBy,
        desc: currentParams.sortOrder === "desc",
      },
    ]
    : [];

  const onSortingChange: OnChangeFn<SortingState> = (updaterOrValue) => {
    const nextSorting =
      typeof updaterOrValue === "function"
        ? updaterOrValue(sorting)
        : updaterOrValue;

    const currentSortBy = currentParams.sortBy;
    const currentSortOrder = currentParams.sortOrder;

    // Enforce cycle: none -> desc -> asc -> none (single-column only)
    const nextId = nextSorting[0]?.id as TParams["sortBy"] | undefined;
    const isNewColumn = !!nextId && !!currentSortBy && nextId !== currentSortBy;

    let newParams: Partial<Pick<TParams, "sortBy" | "sortOrder">>;
    if (isNewColumn) {
      // First click on a new column always starts at "desc"
      newParams = { sortBy: nextId, sortOrder: "desc" };
    } else if (currentSortBy) {
      // Same column (or TanStack produced [] removal) - advance the cycle
      if (currentSortOrder === "desc") {
        newParams = { sortBy: currentSortBy, sortOrder: "asc" };
      } else if (currentSortOrder === "asc") {
        newParams = { sortBy: undefined, sortOrder: undefined };
      } else {
        newParams = { sortBy: currentSortBy, sortOrder: "desc" };
      }
    } else if (nextId) {
      // No current sorting but TanStack proposes an id - treat as first click
      newParams = { sortBy: nextId, sortOrder: "desc" };
    } else {
      newParams = { sortBy: undefined, sortOrder: undefined };
    }

    navigate({
      search: (prev) => {
        return {
          ...prev,
          ...newParams,
        } as typeof prev;
      },
      ...navigateOptions,
    });
  };

  return {
    sorting,
    onSortingChange,
  };
}