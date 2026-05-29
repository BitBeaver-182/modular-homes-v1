"use client";

import { Search } from "lucide-react";
import { useEffect, useState } from "react";
import { useDebouncedCallback } from "use-debounce";

import {
	InputGroup,
	InputGroupAddon,
	InputGroupInput,
} from "@/components/ui/input-group";
import { cn } from "@/lib/utilities";

export interface SearchInputProps {
	value?: string;
	placeholder: string;
	/** Called after `debounceMs` when the user types (for URL / parent state). */
	onDebouncedChange: (value: string) => void;
	debounceMs?: number;
	className?: string;
}

export const SearchInput = ({
	value,
	placeholder,
	onDebouncedChange,
	debounceMs = 300,
	className,
}: SearchInputProps) => {
	const [internalValue, setInternalValue] = useState(value);
	const debounced = useDebouncedCallback(onDebouncedChange, debounceMs);

	useEffect(() => {
		setInternalValue(value);
	}, [value]);

	return (
		<InputGroup className={cn("w-full", className)}>
			<InputGroupAddon>
				<Search aria-hidden className="size-4" />
			</InputGroupAddon>
			<InputGroupInput
				aria-label={placeholder}
				autoComplete="off"
				placeholder={placeholder}
				type="search"
				value={internalValue}
				onChange={(event) => {
					const next = event.target.value;
					setInternalValue(next);
					debounced(next);
				}}
			/>
		</InputGroup>
	);
}
