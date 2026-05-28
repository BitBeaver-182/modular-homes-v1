import type { TFunction } from "i18next";

import type { StrapiErrorDetail } from "./types";

const safeParameters = (
	parameters: Record<string, unknown> | undefined,
): Record<string, string | number> => {
	const out: Record<string, string | number> = {};
	if (!parameters) {
		return out;
	}

	for (const [key, value] of Object.entries(parameters)) {
		if (typeof value === "string" || typeof value === "number") {
			out[key] = value;
		}
	}

	return out;
};

/**
 * Bridges the backend's enriched error shape (`key` + `params` added by the
 * `errors-parser` middleware) to i18next under the `errors.<key>` namespace.
 * Falls back to the raw Strapi `message` when the backend hasn't tagged the item.
 */
export const translateStrapiErrorDetailMessage = (
	item: StrapiErrorDetail,
	t: TFunction,
): string => {
	const { key } = item;
	if (typeof key === "string" && key.length > 0) {
		return t(`errors.${key}`, {
			...safeParameters(item.params),
			defaultValue: item.message,
		});
	}

	return item.message;
};
