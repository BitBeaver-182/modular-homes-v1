"use client";

import { FunnelXIcon } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utilities";

import type { JSX, ReactNode } from "react";

export interface FiltersBarProps {
	children: ReactNode;
	className?: string;
}

/**
 * Pure layout wrapper for the filter toolbar. Renders children on a single
 * wrapping row. No add-filter dropdown: every filter is a first-class child
 * whose trigger is always visible.
 */
export const FiltersBar = ({ children, className }: FiltersBarProps): JSX.Element => {
	return (
		<div
			className={cn(
				"flex min-w-0 flex-wrap items-center gap-2",
				className,
			)}
		>
			{children}
		</div>
	);
}

export interface FiltersResetButtonProps {
	onClick: () => void;
	label?: string;
	className?: string;
}

/**
 * Reset-all button intended as the last child of `FiltersBar`. Only render it
 * when at least one filter is active — this component stays dumb and does not
 * compute that itself.
 */
export const FiltersResetButton = ({
	onClick,
	label,
	className,
}: FiltersResetButtonProps): JSX.Element => {
	const { t } = useTranslation();
	return (
		<Button
			type="button"
			variant="ghost"
			size="sm"
			onClick={onClick}
			className={cn("h-9 gap-1.5 text-muted-foreground", className)}
		>
			<FunnelXIcon className="size-4" />
			{label ?? t("filters.clearAll")}
		</Button>
	);
}
