"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState, type JSX, type ReactNode } from "react";
import { useInView } from "react-intersection-observer";
import { useDebounce } from "use-debounce";

import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
	Combobox,
	ComboboxChip,
	ComboboxChips,
	ComboboxChipsInput,
	ComboboxContent,
	ComboboxEmpty,
	ComboboxInput,
	ComboboxItem,
	ComboboxList,
	ComboboxValue,
} from "@/components/ui/combobox";
import { Spinner } from "@/components/ui/spinner";

export interface InfiniteComboboxPage<T> {
	data: Array<T>;
	meta: { pagination: { page: number; pageCount: number } };
}

export interface FetchPageArgs {
	page: number;
	pageSize: number;
	search: string;
}

export interface InfiniteComboboxProps<T, M extends boolean = false> {
	multiple?: M;
	clearable?: boolean;
	disabled?: boolean;
	invalid?: boolean;
	name?: string;
	id?: string;
	defaultValue?: M extends true ? Array<T> : T | null;
	value?: M extends true ? Array<T> : T | null;
	onChange?: (value: M extends true ? Array<T> : T | null) => void;

	queryKey: ReadonlyArray<unknown>;
	fetchPage: (args: FetchPageArgs) => Promise<InfiniteComboboxPage<T>>;
	getId: (item: T) => string;
	getLabel: (item: T) => string;

	pageSize?: number;
	debounceMs?: number;
	searchPlaceholder?: string;
	noResultsLabel?: ReactNode;
	selectAllLabel?: string;
	selectedCountLabel?: (count: number) => string;
	/** Max visible chips in the trigger before the overflow badge appears. */
	maxVisibleChips?: number;
}

/**
 * Generic infinite-scroll combobox: single or multiple selection, debounced
 * search, intersection-observer auto-load-more, select-all over the loaded
 * set, chip overflow, and optional hidden `<input>`s for native forms.
 *
 * Kept entirely domain-agnostic — supply `queryKey`, `fetchPage`, `getId`,
 * `getLabel` and any entity works. `SuppliersCombobox` and
 * `InfiniteComboboxFilter` both build on this.
 */
export const InfiniteCombobox = <T, M extends boolean = false>({
	multiple = false as M,
	clearable = false,
	disabled = false,
	invalid = false,
	name,
	id,
	defaultValue,
	value,
	onChange,
	queryKey,
	fetchPage,
	getId,
	getLabel,
	pageSize = 25,
	debounceMs = 300,
	searchPlaceholder,
	noResultsLabel,
	selectAllLabel,
	selectedCountLabel,
	maxVisibleChips = 1,
}: InfiniteComboboxProps<T, M>): JSX.Element => {
	const isControlled = value !== undefined;
	const [open, setOpen] = useState(false);
	const [search, setSearch] = useState("");
	const [debouncedSearch] = useDebounce(search, debounceMs);

	type Selected = M extends true ? Array<T> : T | null;
	const emptyValue = (multiple ? [] : null) as Selected;

	const [internalValue, setInternalValue] = useState<Selected>(
		defaultValue ?? emptyValue
	);

	useEffect((): void => {
		if (!isControlled) {
			setInternalValue(defaultValue ?? emptyValue);
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [defaultValue, isControlled, multiple]);

	const selectedValue = isControlled ? value : internalValue;

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

	const allItems = useMemo(
		(): Array<T> => data?.pages.flatMap((page): Array<T> => page.data) ?? [],
		[data]
	);

	const selectedList = useMemo(
		(): Array<T> =>
			multiple ? ((selectedValue as Array<T> | undefined) ?? []) : [],
		[multiple, selectedValue]
	);

	const isItemSelected = (item: T): boolean => {
		const id = getId(item);
		if (multiple) {
			return selectedList.some((s): boolean => getId(s) === id);
		}
		const single = selectedValue as T | null | undefined;
		return single !== null && single !== undefined && getId(single) === id;
	};

	const items = useMemo((): Array<T> => {
		if (!multiple) {
			return allItems;
		}
		const selectedIds = new Set(
			selectedList.map((item): string => getId(item))
		);
		return [
			...allItems.filter((item): boolean => selectedIds.has(getId(item))),
			...allItems.filter((item): boolean => !selectedIds.has(getId(item))),
		];
	}, [allItems, multiple, selectedList, getId]);

	const handleValueChange = (next: T | Array<T> | null): void => {
		if (!isControlled) {
			(setInternalValue as (v: T | Array<T> | null) => void)(next);
		}

		if (multiple) {
			(onChange as ((v: Array<T>) => void) | undefined)?.(
				(next as Array<T>) ?? []
			);
		} else {
			(onChange as ((v: T | null) => void) | undefined)?.(next as T | null);
		}
	};

	const handleSelectAll = (): void => {
		const loadedIds = new Set(allItems.map((item): string => getId(item)));
		const allLoaded =
			allItems.length > 0 &&
			allItems.every((item): boolean => isItemSelected(item));

		if (allLoaded) {
			const next = selectedList.filter(
				(s): boolean => !loadedIds.has(getId(s))
			);
			(onChange as ((v: Array<T>) => void) | undefined)?.(next);
			if (!isControlled) {
				setInternalValue(next as Selected);
			}
			return;
		}

		const next = [
			...selectedList,
			...allItems.filter((item): boolean => !isItemSelected(item)),
		];
		(onChange as ((v: Array<T>) => void) | undefined)?.(next);
		if (!isControlled) {
			setInternalValue(next as Selected);
		}
	};

	const handleOpenChange = (next: boolean): void => {
		if (!next) {
			setSearch("");
		}
		setOpen(next);
	};

	const allLoaded =
		allItems.length > 0 &&
		allItems.every((item): boolean => isItemSelected(item));

	const chipItems = selectedList.slice(0, maxVisibleChips);
	const overflowCount = selectedList.length - maxVisibleChips;

	const renderHiddenInputs = (): ReactNode => {
		if (!name) {
			return null;
		}

		if (multiple) {
			if (selectedList.length === 0) {
				return <input name={name} type="hidden" value="" />;
			}
			return selectedList.map(
				(item): JSX.Element => (
					<input
						key={getId(item)}
						name={name}
						type="hidden"
						value={getId(item)}
					/>
				)
			);
		}

		const single = selectedValue as T | null | undefined;
		return (
			<input name={name} type="hidden" value={single ? getId(single) : ""} />
		);
	};

	return (
		<>
			{renderHiddenInputs()}
			<Combobox
				disabled={disabled}
				filter={(): boolean => true}
				id={id}
				itemToStringLabel={getLabel}
				itemToStringValue={getLabel}
				items={items}
				multiple={multiple as never}
				open={open}
				value={selectedValue as never}
				isItemEqualToValue={(a: T, b: T): boolean => getId(a) === getId(b)}
				onOpenChange={handleOpenChange}
				onValueChange={handleValueChange}
				onInputValueChange={(nextValue): void => {
					setSearch(nextValue);
				}}
			>
				{multiple ? (
					<ComboboxChips>
						<ComboboxValue>
							{(): JSX.Element => (
								<>
									{chipItems.map(
										(item): JSX.Element => (
											<ComboboxChip key={getId(item)}>
												{getLabel(item)}
											</ComboboxChip>
										)
									)}
									{overflowCount > 0 ? (
										<Badge
											className="pointer-events-none h-6 rounded-sm px-1.5 font-normal"
											variant="secondary"
										>
											+{overflowCount}
										</Badge>
									) : null}
								</>
							)}
						</ComboboxValue>
						<ComboboxChipsInput
							placeholder={
								selectedList.length === 0 ? searchPlaceholder : undefined
							}
						/>
					</ComboboxChips>
				) : (
					<ComboboxInput
						aria-invalid={invalid}
						placeholder={searchPlaceholder}
						showClear={clearable}
					/>
				)}

				<ComboboxContent>
					<ComboboxEmpty>
						{isLoading ? (
							<Spinner className="mx-auto" />
						) : (
							(noResultsLabel ?? null)
						)}
					</ComboboxEmpty>

					<ComboboxList>
						{multiple && !debouncedSearch && allItems.length > 0 ? (
							<>
								<ComboboxItem
									className="font-medium"
									value="__select_all__"
									onSelect={handleSelectAll}
								>
									<Checkbox
										aria-hidden
										checked={allLoaded}
										className="pointer-events-none mr-2"
									/>
									{selectAllLabel}
									{selectedList.length > 0 && selectedCountLabel ? (
										<span className="text-muted-foreground ml-auto text-xs tabular-nums">
											{selectedCountLabel(selectedList.length)}
										</span>
									) : null}
								</ComboboxItem>
								<div className="bg-border mx-1 my-1 h-px" />
							</>
						) : null}

						{items.map(
							(item): JSX.Element => (
								<ComboboxItem key={getId(item)} value={item}>
									{multiple ? (
										<Checkbox
											aria-hidden
											checked={isItemSelected(item)}
											className="pointer-events-none mr-2"
										/>
									) : null}
									{getLabel(item)}
								</ComboboxItem>
							)
						)}
					</ComboboxList>

					{hasNextPage ? (
						<div ref={loaderRef} className="flex justify-center p-2">
							{isFetchingNextPage ? <Spinner className="size-4" /> : null}
						</div>
					) : null}
				</ComboboxContent>
			</Combobox>
		</>
	);
};
