"use client";

import { PlusIcon } from "lucide-react";
import { forwardRef, type JSX, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utilities";

export interface FilterTriggerProps {
	/** Field label (e.g. "Status", "Amount"). */
	label: string;
	/** Optional left-side icon displayed before the label. Defaults to a `+`. */
	icon?: ReactNode;
	/** When provided, renders the right-hand "value segment" of the ButtonGroup
	 * (e.g. "4 selected", `<Badge>…</Badge>`). When absent, only the `[+] Label`
	 * muted state is rendered. */
	value?: ReactNode;
	className?: string;
	disabled?: boolean;
	/** Standard click forwarded to the underlying `<Button>`. The popover
	 * wires this via `asChild` + Radix, so authors rarely set it directly. */
	onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
}

/**
 * Shared trigger for every concrete filter component.
 *
 * - Empty state: `[+] Label` with muted text, ordinary outline button.
 * - Filled state: ButtonGroup-style `[+] Label │ <value>` — still one `<Button>`
 *   so Radix `asChild` works with the popover; the divider is a rendered border
 *   inside the button's flex row.
 */
export const FilterTrigger = forwardRef<HTMLButtonElement, FilterTriggerProps>(
	function FilterTrigger(
		{ label, icon, value, className, disabled, onClick, ...rest },
		ref,
	): JSX.Element {
		const hasValue = value !== undefined && value !== null && value !== "";

		return (
			<Button
				ref={ref}
				type="button"
				variant="outline"
				disabled={disabled}
				onClick={onClick}
				className={cn(
					"h-9 gap-2 font-normal",
					hasValue ? "pr-2" : "text-muted-foreground",
					className,
				)}
				{...rest}
			>
				<span className="flex items-center gap-1.5">
					<span className="text-muted-foreground flex size-3.5 shrink-0 items-center justify-center">
						{icon ?? <PlusIcon className="size-3.5" />}
					</span>
					<span className="truncate">{label}</span>
				</span>
				{hasValue ? (
					<>
						<span
							aria-hidden
							className="bg-border mx-0.5 h-5 w-px shrink-0"
						/>
						<span className="flex min-w-0 items-center gap-1 text-foreground">
							{value}
						</span>
					</>
				) : null}
			</Button>
		);
	},
);
