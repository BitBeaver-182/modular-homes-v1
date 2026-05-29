import { useLocation, useNavigate, useParams } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import {
	SUPPORTED_LOCALES,
	type SupportedLocale,
	isSupportedLocale,
} from "../../common/locales";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "../ui/select";

interface LocaleSwitcherProps {
	currentLocale: SupportedLocale;
}

export const LocaleSwitcher = ({ currentLocale }: LocaleSwitcherProps) => {
	const location = useLocation();
	const navigate = useNavigate();
	const parameters = useParams({ strict: false });
	const { t } = useTranslation();

	const handleLocaleChange = (nextLocale: SupportedLocale) => {
		if (nextLocale === currentLocale) {
			return;
		}

		const currentHash = location.hash.replace(/^#/, "");
		const localeFromParameters =
			typeof parameters.locale === "string" ? parameters.locale : undefined;
		const hasLocaleParameter = isSupportedLocale(localeFromParameters ?? "");

		if (hasLocaleParameter) {
			void navigate({
				to: ".",
				params: (previous) => ({ ...previous, locale: nextLocale }),
				search: (previous) => previous,
				hash: currentHash,
			});
			return;
		}

		void navigate({
			to: "/$locale",
			params: { locale: nextLocale },
			search: true,
			hash: currentHash,
		});
	};

	return (
		<div className="flex items-center gap-2">
			<span className="text-sm text-muted-foreground">
				{t("shell.language")}
			</span>
			<Select
				value={currentLocale}
				onValueChange={(value) => {
					if (isSupportedLocale(value)) {
						handleLocaleChange(value);
					}
				}}
			>
				<SelectTrigger className="h-8 w-[140px]">
					<SelectValue />
				</SelectTrigger>
				<SelectContent>
					{SUPPORTED_LOCALES.map((locale) => (
						<SelectItem key={locale} value={locale}>
							{locale.toUpperCase()}
						</SelectItem>
					))}
				</SelectContent>
			</Select>
		</div>
	);
};
