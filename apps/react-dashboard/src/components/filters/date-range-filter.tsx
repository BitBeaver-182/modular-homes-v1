"use client";

import { format } from "date-fns";
import { useMemo, type JSX, type ReactNode } from "react";
import { useTranslation } from "react-i18next";

import {
	DateRangeInput,
	type DateRangeValue,
} from "@/components/forms/inputs/date-range-input";

import { FilterPopover } from "./filter-popover";
import { FilterTrigger } from "./filter-trigger";

export interface YmdPair { from?: string; to?: string }

export interface DateRangeFilterProps {
	label: string;
	icon?: ReactNode;
	value?: YmdPair;
	onApply: (next: YmdPair) => void;
	showPresets?: boolean;
	disableFuture?: boolean;
	className?: string;
	disabled?: boolean;
}

const toDate = (ymd: string | null): Date | null => {
	if (!ymd) {return null;}
	const parsed = new Date(ymd);
	return Number.isNaN(parsed.getTime()) ? null : parsed;
};

/**
 * Date-range filter. Keeps YMD strings in the URL and converts them to the
 * `DateRangeInput` shape (Date objects) only while the popover is open.
 */
export const DateRangeFilter = ({
	label,
	icon,
	value,
	onApply,
	showPresets,
	disableFuture,
	className,
	disabled,
}: DateRangeFilterProps): JSX.Element => {
	const { t } = useTranslation();

	const triggerValue = useMemo((): ReactNode => {
		const fromDate = value?.from ? toDate(value.from) : null;
		const toEndDate = value?.to ? toDate(value.to) : null;
		if (!fromDate && !toEndDate) {return null;}
		if (fromDate && toEndDate) {
			return (
				<span className="truncate text-sm">
					{format(fromDate, "LLL dd")} – {format(toEndDate, "LLL dd, y")}
				</span>
			);
		}
		const solo = fromDate ?? toEndDate;
		return solo ? (
			<span className="truncate text-sm">{format(solo, "LLL dd, y")}</span>
		) : null;
	}, [value?.from, value?.to]);

	return (
		<FilterPopover<YmdPair>
			value={value ?? { from: undefined, to: undefined }}
			onApply={onApply}
			onClear={(): void => {
				onApply({ from: undefined, to: undefined });
			}}
			canClear={value?.from !== undefined || value?.to !== undefined}
			contentClassName="w-auto p-0 border-0"
			trigger={
				<FilterTrigger
					className={className}
					disabled={disabled}
					icon={icon}
					label={label}
					value={triggerValue}
				/>
			}
			applyLabel={t("filters.apply")}
		>
			{(draft, setDraft, _meta): JSX.Element => {
				const range: DateRangeValue = draft.from
					? {
						from: new Date(draft.from),
						to: draft.to ? new Date(draft.to) : undefined,
					}
					: undefined;

				return (
					<DateRangeInput
						inline
						disableFuture={disableFuture}
						showPresets={showPresets}
						value={range}
						onChange={(next): void => {
							if (!next?.from) {
								setDraft({ from: undefined, to: undefined });
								return;
							}
							const from = format(next.from, "yyyy-MM-dd");
							const to = next.to ? format(next.to, "yyyy-MM-dd") : from;
							setDraft({ from, to });
						}}
					/>
				);
			}}
		</FilterPopover>
	);
}
