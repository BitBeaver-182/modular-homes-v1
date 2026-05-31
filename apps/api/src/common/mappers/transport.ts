import type { Prisma } from '@prisma/client';

export function toApiId(value: bigint): string {
  return value.toString();
}

export function toIsoDateString(value: Date): string {
  return value.toISOString();
}

export function toOptionalIsoDateString(
  value: Date | null | undefined,
): string | null | undefined {
  if (value === undefined) {
    return undefined;
  }

  return value ? toIsoDateString(value) : null;
}

export function toDateOnlyString(value: Date | null | undefined): string | null {
  return value ? value.toISOString().slice(0, 10) : null;
}

export function decimalToNumber(value: Prisma.Decimal | number): number {
  return Number(value);
}
