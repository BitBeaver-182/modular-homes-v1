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
