export const SUPPORTED_LOCALES = ["en", "es", "hu", "sk"] as const;

export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];

export const DEFAULT_LOCALE: SupportedLocale = "en";

export const isSupportedLocale = (value: string): value is SupportedLocale =>
	SUPPORTED_LOCALES.includes(value as SupportedLocale);
