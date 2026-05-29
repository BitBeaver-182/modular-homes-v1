"use client";

import CurrencyListModule from "currency-list";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utilities";

const CurrencyList = CurrencyListModule;

interface CurrencyDisplayProps {
	amount: number | null | undefined;
	currencyCode?: string | null;
	className?: string;
}

/**
 * Renders a numeric amount with symbol and fraction digits from `currency-list`
 * for the given ISO currency code.
 */
export const CurrencyDisplay = ({
	amount,
	currencyCode,
	className,
}: CurrencyDisplayProps) => {
	const { i18n } = useTranslation();
	const locale = i18n.language?.split("-")[0] ?? "en";

	if (amount == null || Number.isNaN(Number(amount))) {
		return (
			<span aria-hidden className={cn("text-muted-foreground", className)}>
				—
			</span>
		);
	}

	const n = Number(amount);
	const code = (currencyCode ?? "EUR").toUpperCase();

	let meta: ReturnType<typeof CurrencyList.get> | undefined;
	try {
		meta = CurrencyList.get(code, locale);
	} catch {
		meta = undefined;
	}

	const digits = meta?.decimal_digits ?? 2;
	const symbol = meta?.symbol_native ?? meta?.symbol ?? code;
	const formatted = n.toLocaleString(locale, {
		minimumFractionDigits: digits,
		maximumFractionDigits: digits,
	});

	return (
		<span className={cn("tabular-nums", className)}>
			{symbol} {formatted}
		</span>
	);
}
