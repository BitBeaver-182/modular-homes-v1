import { isModuflowRequestError } from "./client";

import type { ApiErrorDetail } from "@moduflow/types";
import type { TFunction } from "i18next";
import type {
	FieldPath,
	FieldValues,
	UseFormSetError,
} from "react-hook-form";

export type ModuflowFieldMap<TFieldValues extends FieldValues> = (
	normalizedKey: string,
) => FieldPath<TFieldValues> | undefined;

export type ModuflowErrorNormalizer = (
	raw: Record<string, ApiErrorDetail>,
) => Record<string, ApiErrorDetail>;

export interface ApplyModuflowErrorToFormOptions<TFieldValues extends FieldValues> {
	normalize?: ModuflowErrorNormalizer;
	mapField?: ModuflowFieldMap<TFieldValues>;
	fallbackMessage: string;
}

const translateApiError = (detail: ApiErrorDetail, t: TFunction): string => {
	if (!detail.key) {
		return detail.message;
	}

	return t(`errors.${detail.key}`, {
		...detail.params,
		defaultValue: detail.message,
		message: detail.message,
	});
};

const toFlatErrorMap = (
	details: ApiErrorDetail[] | undefined,
): Record<string, ApiErrorDetail> => {
	if (!details || details.length === 0) {
		return {};
	}

	return Object.fromEntries(
		details.map((detail) => [detail.path.join("."), detail] as const),
	);
};

export const applyModuflowErrorToForm = <TFieldValues extends FieldValues>(
	error: unknown,
	setError: UseFormSetError<TFieldValues>,
	t: TFunction,
	options: ApplyModuflowErrorToFormOptions<TFieldValues>,
): void => {
	const { normalize, mapField, fallbackMessage } = options;

	if (isModuflowRequestError(error)) {
		const raw = toFlatErrorMap(error.details);
		const flat = normalize ? normalize(raw) : raw;

		if (Object.keys(flat).length === 0) {
			setError("root", {
				type: "server",
				message: error.message || fallbackMessage,
			});
			return;
		}

		for (const [key, detail] of Object.entries(flat)) {
			const path = mapField
				? mapField(key)
				: (key as FieldPath<TFieldValues>);
			if (path === undefined) {
				continue;
			}

			setError(path, {
				type: "server",
				message: translateApiError(detail, t),
			});
		}

		return;
	}

	setError("root", {
		type: "server",
		message: fallbackMessage,
	});
};
