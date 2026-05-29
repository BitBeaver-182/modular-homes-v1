import { enUS, es, hu, sk, type Locale } from "date-fns/locale";


const dateFnsLocales: Record<string, Locale> = {
	en: enUS,
	hu,
	es,
	sk,
};

export function getDateFnsLocale(locale: string): Locale {
	return dateFnsLocales[locale] ?? enUS;
}
