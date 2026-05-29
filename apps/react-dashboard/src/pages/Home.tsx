import { useTranslation } from "react-i18next";

import type { FunctionComponent } from "../common/types";

export const Home = (): FunctionComponent => {
	const { t } = useTranslation();

	return (
		<div className="flex h-screen w-screen items-center justify-center">
			<p className="text-2xl font-semibold">{t("common.appName")}</p>
		</div>
	);
};
