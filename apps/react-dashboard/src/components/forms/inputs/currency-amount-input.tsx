"use client";

import { type JSX, useEffect, useState } from "react";
import { useCurrency } from "@/hooks/use-currency";
import { ChevronDownIcon } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
  InputGroupText,
} from "@/components/ui/input-group";

type CurrencyAmountInputProps = {
  id?: string;
  name: string;
  defaultValue?: string;
  defaultCurrency?: string;
  disabled?: boolean;
  dissableCurrencyChange?: boolean;
  invalid?: boolean;
  placeholder?: string;
  /** Controlled amount string (mutually exclusive with uncontrolled-only usage). */
  amountValue?: string;
  onAmountValueChange?: (value: string) => void;
  /** Controlled ISO currency code. */
  currencyValue?: string;
  onCurrencyValueChange?: (value: string) => void;
};

export function CurrencyAmountInput({
  id,
  name,
  defaultValue = "",
  defaultCurrency = "EUR",
  disabled = false,
  dissableCurrencyChange = false,
  invalid = false,
  placeholder,
  amountValue,
  onAmountValueChange,
  currencyValue,
  onCurrencyValueChange,
}: CurrencyAmountInputProps): JSX.Element {
  const [currency, setCurrency] = useState(defaultCurrency);
  const [amountString, setAmountString] = useState(defaultValue);
  const { getDecimalDigits, parseAmountInput, formatAmountForCurrencyDigits, currencies } = useCurrency();

  const isAmountControlled = onAmountValueChange !== undefined;
  const isCurrencyControlled = onCurrencyValueChange !== undefined;
  const resolvedAmountString = isAmountControlled ? (amountValue ?? "") : amountString;
  const resolvedCurrency = isCurrencyControlled
    ? (currencyValue ?? defaultCurrency)
    : currency;

  useEffect(() => {
    setCurrency(defaultCurrency);
  }, [defaultCurrency]);

  useEffect(() => {
    if (!isAmountControlled) {
      setAmountString(defaultValue);
    }
  }, [defaultValue, isAmountControlled]);

  const selectedCurrency =
    currencies.find((entry) => entry.code === resolvedCurrency) ?? currencies[0]!;

  const applyCurrencyChange = (newCode: string): void => {
    const nextDigits = getDecimalDigits(newCode);
    const parsed = parseAmountInput(resolvedAmountString);
    const nextAmount =
      parsed != null
        ? formatAmountForCurrencyDigits(parsed, nextDigits)
        : resolvedAmountString;

    if (isAmountControlled) {
      onAmountValueChange?.(nextAmount);
    } else {
      setAmountString(nextAmount);
    }
    if (isCurrencyControlled) {
      onCurrencyValueChange?.(newCode);
    } else {
      setCurrency(newCode);
    }
  };

  return (
    <>
      {!isAmountControlled && !isCurrencyControlled && resolvedAmountString.length > 0 && (
        <input
          readOnly
          name={`${name}.currency_code`}
          type="hidden"
          value={resolvedCurrency}
        />
      )}
      <InputGroup>
        <InputGroupAddon>
          <InputGroupText>{selectedCurrency.symbol}</InputGroupText>
        </InputGroupAddon>
        <InputGroupInput
          aria-invalid={invalid}
          disabled={disabled}
          id={id}
          inputMode="decimal"
          name={isAmountControlled || isCurrencyControlled ? undefined : `${name}.amount`}
          placeholder={placeholder}
          type="text"
          value={resolvedAmountString}
          onChange={(event) => {
            const next = event.target.value.trim();
            if (isAmountControlled) {
              onAmountValueChange?.(next);
            } else {
              setAmountString(next);
            }
          }}
        />
        <InputGroupAddon align="inline-end">
          {!dissableCurrencyChange ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <InputGroupButton variant="ghost" >
                  <span className="tabular-nums">{selectedCurrency.code}</span>
                  <ChevronDownIcon />
                </InputGroupButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="min-w-40">
                {currencies.map((entry) => (
                  <DropdownMenuItem
                    key={entry.code}
                    onClick={() => {
                      applyCurrencyChange(entry.code);
                    }}
                  >
                    {entry.code}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <span className="tabular-nums">{selectedCurrency.code}</span>
          )}

        </InputGroupAddon>
      </InputGroup>
    </>
  );
}
