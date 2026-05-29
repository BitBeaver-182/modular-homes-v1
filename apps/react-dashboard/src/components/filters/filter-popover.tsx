"use client";

import { useEffect, useState, type JSX, type ReactNode } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utilities";

export interface FilterPopoverProps<T> {
	/** The committed value. Also used to reset `draft` when the popover opens. */
	value: T;
	/** Trigger button (usually a `<FilterTrigger />`). */
	trigger: ReactNode;
	/** Tailwind classes forwarded to `PopoverContent`. */
	contentClassName?: string;
	/** Render-prop for the popover body — in-flight draft, setter, and `open` state. */
	children: (
		draft: T,
		setDraft: React.Dispatch<React.SetStateAction<T>>,
		meta: { open: boolean },
	) => ReactNode;
	/** Called with the draft when the user clicks Apply. */
	onApply: (next: T) => void;
	/** Optional custom apply button label. Defaults to i18n `filters.apply`. */
	applyLabel?: string;
	/**
	 * When provided, a destructive Clear button is rendered in the footer.
	 * Clicking it calls `onClear` and closes the popover.
	 */
	onClear?: () => void;
	/**
	 * Controls the disabled state of the Clear button. Defaults to `true`
	 * (i.e. enabled) when `onClear` is provided.
	 */
	canClear?: boolean;
	/** Optional custom clear button label. Defaults to i18n `filters.clear`. */
	clearLabel?: string;
}

/**
 * Generic draft-and-apply shell shared by every concrete filter component.
 * Keeps the committed URL state untouched until the user clicks Apply.
 */
export function FilterPopover<T>({
	value,
	trigger,
	contentClassName,
	children,
	onApply,
	applyLabel,
	onClear,
	canClear,
	clearLabel,
}: FilterPopoverProps<T>): JSX.Element {
	const { t } = useTranslation();
	const [open, setOpen] = useState(false);
	const [draft, setDraft] = useState<T>(value);

	useEffect((): void => {
		if (!open) {
			setDraft(value);
		}
	}, [value, open]);

	const handleOpenChange = (nextOpen: boolean): void => {
		setOpen(nextOpen);
		if (nextOpen) {
			setDraft(value);
		}
	};

	const handleApply = (): void => {
		onApply(draft);
		setOpen(false);
	};

	const handleClear = (): void => {
		onClear?.();
		setOpen(false);
	};

	return (
		<Popover open={open} onOpenChange={handleOpenChange}>
			<PopoverTrigger asChild>{trigger}</PopoverTrigger>
			<PopoverContent
				align="start"
				className={cn("w-64 gap-0 p-0", contentClassName)}
			>
				{children(draft, setDraft, { open })}
				<Separator />
				<div className="flex items-center justify-between gap-2 p-2">
					{onClear ? (
						<Button
							disabled={canClear === false}
							onClick={handleClear}
							size="sm"
							type="button"
							variant="destructive"
						>
							{clearLabel ?? t("filters.clear")}
						</Button>
					) : (
						<span />
					)}
					<Button size="sm" type="button" onClick={handleApply}>
						{applyLabel ?? t("filters.apply")}
					</Button>
				</div>
			</PopoverContent>
		</Popover>
	);
}
