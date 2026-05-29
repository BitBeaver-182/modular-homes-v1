"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { CheckIcon } from "lucide-react";
import { useMemo, useState, useEffect, type JSX, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { useInView } from "react-intersection-observer";
import { useDebounce } from "use-debounce";

import type {
	FetchPageArgs,
	InfiniteComboboxPage,
} from "@/components/forms/inputs/infinite-combobox";
import { Badge } from "@/components/ui/badge";
import {
	Command,
	CommandEmpty,
	CommandInput,
	CommandItem,
	CommandList,
} from "@/components/ui/command";
import { Spinner } from "@/components/ui/spinner";

import { FilterPopover } from "./filter-popover";
import { FilterTrigger } from "./filter-trigger";

export interface InfiniteComboboxFilterProps<T> {
	label: string;
	icon?: ReactNode;
	/** Selected entity ids. */
	value: Array<string>;
	onApply: (next: Array<string>) => void;

	queryKey: ReadonlyArray<unknown>;
	fetchPage: (args: FetchPageArgs) => Promise<InfiniteComboboxPage<T>>;
	getId: (item: T) => string;
	getLabel: (item: T) => string;

	pageSize?: number;
	debounceMs?: number;
	searchPlaceholder?: string;
	noResultsLabel?: string;
	className?: string;
	disabled?: boolean;
	maxVisibleChips?: number;
}

/**
 * Filter-bar equivalent of `InfiniteCombobox`: committing on Apply, persisting
 * only ids in the URL, and rendering a picker that streams pages from the
 * backend. Share-able across entities via `queryKey` + `fetchPage`.
 */
export function InfiniteComboboxFilter<T>({
	label,
	icon,
	value,
	onApply,
	queryKey,
	fetchPage,
	getId,
	getLabel,
	pageSize = 25,
	debounceMs = 300,
	searchPlaceholder,
	noResultsLabel,
	className,
	disabled,
	maxVisibleChips = 1,
}: InfiniteComboboxFilterProps<T>): JSX.Element {
	const { t } = useTranslation();
	const [itemCache, setItemCache] = useState<Map<string, T>>(new Map());

	const cachedSelected = useMemo(
		(): Array<T> =>
			value
				.map((id): T | undefined => itemCache.get(id))
				.filter((item): item is T => item !== undefined),
		[value, itemCache],
	);

	const triggerValue = useMemo((): ReactNode => {
		if (value.length === 0) {return null;}
		if (value.length > maxVisibleChips) {
			return (
				<span className="truncate text-sm">
					{t("filters.selectedCount", { count: value.length })}
				</span>
			);
		}
		return (
			<>
				{value.map((id): JSX.Element => {
					const item = itemCache.get(id);
					return (
						<Badge
							key={id}
							variant="secondary"
							className="rounded-sm px-1 py-0 text-xs font-normal"
						>
							{item ? getLabel(item) : id}
						</Badge>
					);
				})}
			</>
		);
	}, [value, maxVisibleChips, itemCache, getLabel, t]);

	return (
		<FilterPopover<Array<string>>
			value={value}
			onApply={onApply}
			onClear={(): void => {
				onApply([]);
			}}
			canClear={value.length > 0}
			contentClassName="w-64 p-0"
			trigger={
				<FilterTrigger
					className={className}
					disabled={disabled}
					icon={icon}
					label={label}
					value={triggerValue}
				/>
			}
		>
			{(draft, setDraft, { open }): JSX.Element => (
				<InfiniteComboboxFilterBody<T>
					cachedSelected={cachedSelected}
					draft={draft}
					fetchPage={fetchPage}
					getId={getId}
					getLabel={getLabel}
					onItemsLoaded={(items): void => {
						setItemCache((prev): Map<string, T> => {
							let changed = false;
							const next = new Map(prev);
							for (const item of items) {
								const id = getId(item);
								if (!next.has(id)) {
									next.set(id, item);
									changed = true;
								}
							}
							return changed ? next : prev;
						});
					}}
					debounceMs={debounceMs}
					noResultsLabel={noResultsLabel ?? t("filters.noResults")}
					pageSize={pageSize}
					popoverOpen={open}
					queryKey={queryKey}
					searchPlaceholder={searchPlaceholder ?? t("filters.searchPlaceholder")}
					setDraft={setDraft}
				/>
			)}
		</FilterPopover>
	);
}

interface InfiniteComboboxFilterBodyProps<T> {
	cachedSelected: Array<T>;
	draft: Array<string>;
	fetchPage: (args: FetchPageArgs) => Promise<InfiniteComboboxPage<T>>;
	getId: (item: T) => string;
	getLabel: (item: T) => string;
	onItemsLoaded: (items: Array<T>) => void;
	debounceMs: number;
	noResultsLabel: string;
	pageSize: number;
	popoverOpen: boolean;
	queryKey: ReadonlyArray<unknown>;
	searchPlaceholder: string;
	setDraft: React.Dispatch<React.SetStateAction<Array<string>>>;
}

function mergeItemMap<T>(
	pageItems: Array<T>,
	cachedSelected: Array<T>,
	getId: (item: T) => string,
): Map<string, T> {
	const idToItem = new Map<string, T>();
	for (const item of cachedSelected) {
		idToItem.set(getId(item), item);
	}
	for (const item of pageItems) {
		idToItem.set(getId(item), item);
	}
	return idToItem;
}

function buildSelectedFirstList<T>(
	draft: Array<string>,
	idToItem: Map<string, T>,
	getId: (item: T) => string,
): Array<T> {
	const selectedIds = new Set(draft);
	const selected: Array<T> = [];
	const rest: Array<T> = [];
	for (const item of idToItem.values()) {
		if (selectedIds.has(getId(item))) {
			selected.push(item);
		} else {
			rest.push(item);
		}
	}
	return [...selected, ...rest];
}

function InfiniteComboboxFilterBody<T>({
	cachedSelected,
	draft,
	fetchPage,
	getId,
	getLabel,
	onItemsLoaded,
	debounceMs,
	noResultsLabel,
	pageSize,
	popoverOpen,
	queryKey,
	searchPlaceholder,
	setDraft,
}: InfiniteComboboxFilterBodyProps<T>): JSX.Element {
	const [search, setSearch] = useState("");
	const [debouncedSearch] = useDebounce(search, debounceMs);
	const [rowIdOrder, setRowIdOrder] = useState<Array<string> | null>(null);
	const { ref: loaderRef, inView } = useInView({ threshold: 0.1 });

	const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } =
		useInfiniteQuery({
			queryKey: [...queryKey, debouncedSearch] as ReadonlyArray<unknown>,
			queryFn: async ({ pageParam }): Promise<InfiniteComboboxPage<T>> =>
				fetchPage({
					page: pageParam,
					pageSize,
					search: debouncedSearch,
				}),
			initialPageParam: 1,
			getNextPageParam: (lastPage): number | undefined => {
				const { page, pageCount } = lastPage.meta.pagination;
				return page < pageCount ? page + 1 : undefined;
			},
		});

	useEffect((): void => {
		if (inView && hasNextPage && !isFetchingNextPage) {
			void fetchNextPage();
		}
	}, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

	const pageItems = useMemo(
		(): Array<T> => data?.pages.flatMap((page): Array<T> => page.data) ?? [],
		[data],
	);

	useEffect((): void => {
		if (pageItems.length > 0) {
			onItemsLoaded(pageItems);
		}
	}, [pageItems, onItemsLoaded]);

	/** Re-open: selected-first. Close or search: reset. */
	useEffect((): void => {
		if (!popoverOpen) {
			setRowIdOrder(null);
		}
	}, [popoverOpen]);

	useEffect((): void => {
		setRowIdOrder(null);
	}, [debouncedSearch]);

	/**
	 * Before the first in-session change: selected rows first. After a toggle, we
	 * freeze the row id order (snapshot taken with the pre-toggle draft) so
	 * further toggles only change checkmarks—no list reordering / scroll jump.
	 */
	const items = useMemo((): Array<T> => {
		const idToItem = mergeItemMap(pageItems, cachedSelected, getId);
		if (debouncedSearch) {
			return pageItems;
		}
		if (rowIdOrder) {
			const seen = new Set<string>();
			const out: Array<T> = [];
			for (const rowId of rowIdOrder) {
				const t = idToItem.get(rowId);
				if (t) {
					seen.add(rowId);
					out.push(t);
				}
			}
			for (const id of draft) {
				if (seen.has(id)) {continue;}
				const t = idToItem.get(id);
				if (t) {
					seen.add(id);
					out.push(t);
				}
			}
			return out;
		}
		return buildSelectedFirstList(draft, idToItem, getId);
	}, [
		pageItems,
		cachedSelected,
		draft,
		debouncedSearch,
		getId,
		rowIdOrder,
	]);

	const toggle = (id: string): void => {
		if (rowIdOrder === null) {
			const idToItem = mergeItemMap(pageItems, cachedSelected, getId);
			if (debouncedSearch) {
				setRowIdOrder(pageItems.map((item) => getId(item)));
			} else {
				setRowIdOrder(
					buildSelectedFirstList(draft, idToItem, getId).map((item) =>
						getId(item),
					),
				);
			}
		}
		setDraft((previous): Array<string> =>
			previous.includes(id)
				? previous.filter((v): boolean => v !== id)
				: [...previous, id],
		);
	};

	return (
		<Command shouldFilter={false}>
			<CommandInput
				className="h-8"
				placeholder={searchPlaceholder}
				value={search}
				onValueChange={setSearch}
			/>
			<CommandList className="mt-2">
				<CommandEmpty>
					{isLoading ? <Spinner className="mx-auto size-4" /> : noResultsLabel}
				</CommandEmpty>
				{items.map((item): JSX.Element => {
					const id = getId(item);
					const isSelected = draft.includes(id);
					return (
						<CommandItem
							key={id}
							className="gap-2 mx-1"
							value={id}
							onSelect={(): void => {
								toggle(id);
							}}
						>
							<span className="flex-1 truncate">{getLabel(item)}</span>
							{isSelected ? <CheckIcon className="size-3.5 shrink-0" /> : null}
						</CommandItem>
					);
				})}
				{hasNextPage ? (
					<div ref={loaderRef} className="flex justify-center p-2">
						{isFetchingNextPage ? <Spinner className="size-4" /> : null}
					</div>
				) : null}
			</CommandList>
		</Command>
	);
}
