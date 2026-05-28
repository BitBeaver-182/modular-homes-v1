import { useTranslation } from "react-i18next";

import CurrencyListModule from "currency-list";
import { useCallback, useMemo } from "react";

const CurrencyList = CurrencyListModule;

const SUPPORTED_CURRENCIES = ["EUR", "HUF", "USD", "CNY"] as const;

/** Truncate toward zero to `decimalDigits` fractional places (no rounding up). */
function truncateToDecimalDigits(value: number, decimalDigits: number): number {
  const factor = 10 ** decimalDigits;
  const scaled = value * factor;
  // For positive numbers, EPSILON helps avoid floating error (e.g. 1.23*100 -> 122.999999).
  // For negative numbers, we want truncation toward zero (ceil), and EPSILON should not push away from zero.
  const adjusted = scaled >= 0 ? scaled + Number.EPSILON : scaled - Number.EPSILON;
  const truncated = scaled >= 0 ? Math.floor(adjusted) : Math.ceil(adjusted);
  return truncated / factor;
}

function formatAmountForCurrencyDigits(
  value: number,
  decimalDigits: number,
): string {
  const t = truncateToDecimalDigits(value, decimalDigits);
  return t.toFixed(decimalDigits);
}

function parseAmountInput(raw: string): number | null {
  const normalized = raw.trim().replace(",", ".");
  if (normalized === "") return null;
  const n = Number.parseFloat(normalized);
  return Number.isFinite(n) ? n : null;
}

type UseCurrencyReturn = {
  getDecimalDigits: (code: string) => number;
  truncateToDecimalDigits: (value: number, decimalDigits: number) => number;
  formatAmountForCurrencyDigits: (value: number, decimalDigits: number) => string;
  parseAmountInput: (raw: string) => number | null;
  formatAmount: (amount: number, currencyCode: string) => string;
  currencies: Array<ReturnType<typeof CurrencyList.get>>;
}

export const useCurrency = (): UseCurrencyReturn => {
  const { i18n } = useTranslation();
  const locale = i18n.language?.split("-")[0] ?? "en";

  const getCurrencies = useCallback((code: string): ReturnType<typeof CurrencyList.get> => {
    return CurrencyList.get(code, locale);
  }, [locale]);

  const getDecimalDigits = useCallback((code: string): number => {
    const currency = CurrencyList.get(code, locale);
    return currency?.decimal_digits ?? 2;
  }, [locale]);

  const formatAmount = useCallback((amount: number, currencyCode: string): string => {
    const curr = CurrencyList.get(currencyCode, locale);

    // Hardcoded 'en-US' to have $ symbol in front of the string
    const numberFormat = new Intl.NumberFormat('en-US', {
      style: "currency",
      currency: curr?.code ?? currencyCode,
      maximumFractionDigits: curr?.decimal_digits ?? 2,
    });

    return numberFormat.format(Number.isFinite(amount) ? amount : 0);
  }, [locale]);

  return useMemo(() => ({
    getDecimalDigits,
    truncateToDecimalDigits,
    formatAmountForCurrencyDigits,
    parseAmountInput,
    formatAmount,
    currencies: SUPPORTED_CURRENCIES.map(getCurrencies),
  }), [locale, getDecimalDigits, formatAmount, getCurrencies]);
};
