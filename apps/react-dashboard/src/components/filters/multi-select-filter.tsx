"use client";

import { useMemo, type JSX, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { CheckIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from "@/components/ui/command";

import { FilterPopover } from "./filter-popover";
import { FilterTrigger } from "./filter-trigger";

export type MultiSelectOption<T extends string = string> = {
	value: T;
	label: string;
	/** Optional right-aligned count (e.g. server-returned totals per bucket). */
	count?: number;
	icon?: ReactNode;
};

export type MultiSelectFilterProps<T extends string = string> = {
	label: string;
	icon?: ReactNode;
	value: Array<T>;
	options: Array<MultiSelectOption<T>>;
	onApply: (next: Array<T>) => void;
	/** Max labels rendered in the trigger before collapsing to `N selected`. */
	maxBadges?: number;
	/** Override the built-in "N selected" label. */
	selectedLabel?: (count: number) => string;
	className?: string;
	disabled?: boolean;
};

/**
 * Multi-select filter: trigger → popover with `Command` + checkbox items.
 * Value is an array of option `value`s; the parent is responsible for URL sync.
 */
export function MultiSelectFilter<T extends string = string>({
	label,
	icon,
	value,
	options,
	onApply,
	maxBadges = 2,
	selectedLabel,
	className,
	disabled,
}: MultiSelectFilterProps<T>): JSX.Element {
	const { t } = useTranslation();
	const optionByValue = useMemo(
		(): Map<string, MultiSelectOption> =>
			new Map(options.map((option): [string, MultiSelectOption] => [option.value, option])),
		[options],
	);

	const triggerValue = useMemo((): ReactNode => {
		if (value.length === 0) return null;
		if (value.length > maxBadges) {
			return (
				<span className="truncate text-sm">
					{selectedLabel
						? selectedLabel(value.length)
						: t("filters.selectedCount", { count: value.length })}
				</span>
			);
		}
		return (
			<>
				{value.map((v): JSX.Element => {
					const option = optionByValue.get(v);
					return (
						<Badge
							key={v}
							className="rounded-sm px-1 py-0 text-xs font-normal"
							variant="secondary"
						>
							{option?.label ?? v}
						</Badge>
					);
				})}
			</>
		);
	}, [value, maxBadges, optionByValue, selectedLabel, t]);

	return (
		<FilterPopover<Array<T>>
			canClear={value.length > 0}
			contentClassName="w-56 p-0"
			value={value}
			trigger={
				<FilterTrigger
					className={className}
					disabled={disabled}
					icon={icon}
					label={label}
					value={triggerValue}
				/>
			}
			onApply={onApply}
			onClear={(): void => {
				onApply([]);
			}}
		>
			{(draft, setDraft): JSX.Element => {
				const toggle = (next: T): void => {
					setDraft((previous): Array<T> =>
						previous.includes(next)
							? previous.filter((v): boolean => v !== next)
							: [...previous, next],
					);
				};

				return (
					<Command>
						{options.length > 6 ? (
							<CommandInput
								className="h-8"
								placeholder={t("filters.searchPlaceholder")}
							/>
						) : null}
						<CommandList>
							<CommandEmpty>{t("filters.noResults")}</CommandEmpty>
							<CommandGroup>
								{options.map((option): JSX.Element => {
									const isSelected = draft.includes(option.value);
									return (
										<CommandItem
											key={option.value}
											className="gap-2"
											value={option.value}
											onSelect={(): void => {
												toggle(option.value);
											}}
										>
											{option.icon ? (
												<span className="text-muted-foreground size-4 shrink-0">
													{option.icon}
												</span>
											) : null}
											<span className="flex-1 truncate">{option.label}</span>
											{option.count !== undefined ? (
												<span className="text-muted-foreground text-xs tabular-nums">
													{option.count}
												</span>
											) : null}
											{isSelected ? (
												<CheckIcon className="size-3.5 shrink-0" />
											) : null}
										</CommandItem>
									);
								})}
							</CommandGroup>
						</CommandList>
					</Command>
				);
			}}
		</FilterPopover>
	);
}
