"use client";


import {
	SearchInput,
	type SearchInputProps,
} from "@/components/forms/inputs/search-input";
import { cn } from "@/lib/utilities";

import type { JSX } from "react";

export type SearchFilterProps = Omit<SearchInputProps, "className"> & {
	className?: string;
};

/**
 * Inline search filter — the one filter that isn't a trigger-chip. Drops the
 * existing `SearchInput` into the bar at a fixed min-width so it aligns with
 * the chip triggers around it.
 */
export const SearchFilter = ({
	className,
	...props
}: SearchFilterProps): JSX.Element => {
	return (
		<div className={cn("min-w-0 flex-1", className)}>
			<SearchInput {...props} />
		</div>
	);
}
