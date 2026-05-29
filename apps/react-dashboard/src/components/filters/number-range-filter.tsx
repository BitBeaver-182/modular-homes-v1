"use client";

import { useMemo, type JSX, type ReactNode } from "react";

import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utilities";

import { FilterPopover } from "./filter-popover";
import { FilterTrigger } from "./filter-trigger";

export interface NumberPair { min?: number; max?: number }

export interface NumberRangeFilterProps {
	label: string;
	icon?: ReactNode;
	value?: { min?: number; max?: number };
	onApply: (next: NumberPair) => void;
	min?: number;
	max?: number;
	step?: number;
	prefix?: string;
	suffix?: string;
	className?: string;
	disabled?: boolean;
}

const clamp = (value: number, lo: number, hi: number): number =>
	Math.min(Math.max(value, lo), hi);

const parseInput = (raw: string): number | null => {
	if (raw === "") {return null;}
	const parsed = Number(raw);
	return Number.isFinite(parsed) ? parsed : null;
};

const thumbsFromDraft = (
	draft: NumberPair,
	rangeMin: number,
	rangeMax: number,
): [number, number] => {
	const lo =
		draft.min !== undefined ? clamp(draft.min, rangeMin, rangeMax) : rangeMin;
	const hi =
		draft.max !== undefined ? clamp(draft.max, rangeMin, rangeMax) : rangeMax;
	return lo <= hi ? [lo, hi] : [hi, lo];
};

export const NumberRangeFilter = ({
	label,
	icon,
	value,
	onApply,
	min = 0,
	max = 1_000_000,
	step = 1,
	prefix,
	suffix,
	className,
	disabled,
}: NumberRangeFilterProps): JSX.Element => {
	const triggerValue = useMemo((): ReactNode => {
		if (value?.min === undefined && value?.max === undefined) {return null;}
		const lo = value?.min !== undefined ? String(value.min) : String(min);
		const hi = value?.max !== undefined ? String(value.max) : String(max);
		return (
			<span className="truncate text-sm tabular-nums">
				{prefix ?? ""}
				{lo} – {prefix ?? ""}
				{hi}
				{suffix ? ` ${suffix}` : ""}
			</span>
		);
	}, [value?.min, value?.max, min, max, prefix, suffix]);

	return (
		<FilterPopover<NumberPair>
			value={value ?? { min: undefined, max: undefined }}
			onApply={onApply}
			onClear={(): void => {
				onApply({ min: undefined, max: undefined });
			}}
			canClear={value?.min !== undefined || value?.max !== undefined}
			contentClassName="w-auto p-0"
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
			{(draft, setDraft, _meta): JSX.Element => {
				const [thumbLo, thumbHi] = thumbsFromDraft(draft, min, max);

				return (
					<div className="flex flex-col gap-3 p-2">
						<div className={cn("flex items-center gap-1.5")}>
							{prefix ? (
								<span className="text-muted-foreground text-xs">{prefix}</span>
							) : null}
							<Input
								type="number"
								inputMode="decimal"
								className="h-8 w-20 text-xs"
								min={min}
								max={max}
								step={step}
								placeholder="Min"
								value={draft.min ?? ""}
								onChange={(event): void => {
									setDraft(
										(previous): NumberPair => ({
											...previous,
											min: parseInput(event.target.value) ?? undefined,
										}),
									);
								}}
							/>
							<span className="text-muted-foreground text-xs">–</span>
							<Input
								type="number"
								inputMode="decimal"
								className="h-8 w-20 text-xs"
								min={min}
								max={max}
								step={step}
								placeholder="Max"
								value={draft.max ?? ""}
								onChange={(event): void => {
									setDraft(
										(previous): NumberPair => ({
											...previous,
											max: parseInput(event.target.value) ?? undefined,
										}),
									);
								}}
							/>
							{suffix ? (
								<span className="text-muted-foreground text-xs">{suffix}</span>
							) : null}
						</div>
						<Slider
							className="w-full"
							min={min}
							max={max}
							step={step}
							value={[thumbLo, thumbHi]}
							onValueChange={(next): void => {
								const [lo, hi] = next;
								setDraft({
									min: lo ?? undefined,
									max: hi ?? undefined,
								});
							}}
						/>
					</div>
				);
			}}
		</FilterPopover>
	);
}
