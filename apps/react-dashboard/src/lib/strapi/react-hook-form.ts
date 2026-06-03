
import { StrapiRequestError } from "./error";
import {
	type SerializeStrapiErrorsFormat,
	serializeStrapiErrors,
} from "./serialize-errors";
import { translateStrapiErrorDetailMessage } from "./translate-error";
import { isModuflowRequestError } from "../moduflow/client";

import type { StrapiErrorDetail } from "./types";
import type { ApiErrorDetail } from "@moduflow/types";
import type { TFunction } from "i18next";
import type {
	FieldPath,
	FieldValues,
	UseFormSetError,
} from "react-hook-form";

export type StrapiFieldMap<TFieldValues extends FieldValues> = (
	normalizedKey: string,
) => FieldPath<TFieldValues> | undefined;

export type StrapiErrorNormalizer = (
	raw: Record<string, string>,
) => Record<string, string>;

export interface ApplyStrapiErrorToFormOptions<TFieldValues extends FieldValues> {
	/**
	 * Optional normalizer applied after serialization (e.g. to strip a `data.`
	 * prefix or collapse backend-only paths like `slug` → `name`).
	 */
	normalize?: StrapiErrorNormalizer;
	/**
	 * Map a normalized Strapi path to the matching RHF field path.
	 * Return `undefined` to drop an entry (it will not be attached to the form).
	 * Defaults to identity — normalized key is used as the field path.
	 */
	mapField?: StrapiFieldMap<TFieldValues>;
	/** Message for non-{@link StrapiRequestError} errors (network, timeouts, …). */
	fallbackMessage: string;
}

/**
 * Strips Strapi's `data.` prefix produced by validation of nested write payloads.
 * Composable: pass into `normalize` or combine with a feature-specific normalizer.
 */
export const stripStrapiDataPrefix: StrapiErrorNormalizer = (raw) => {
	const out: Record<string, string> = { ...raw };
	for (const [key, value] of Object.entries(raw)) {
		if (key.startsWith("data.") && value && !out[key.slice(5)]) {
			out[key.slice(5)] = value;
		}
	}

	return out;
};

export const composeNormalizers = (
	...normalizers: Array<StrapiErrorNormalizer>
): StrapiErrorNormalizer => {
	return (raw) =>
		normalizers.reduce<Record<string, string>>(
			(accumulator, normalizer) => normalizer(accumulator),
			raw,
		);
};

const buildSerializeFormat = (t: TFunction): SerializeStrapiErrorsFormat => ({
	detailMessage: (item: StrapiErrorDetail): string =>
		translateStrapiErrorDetailMessage(item, t),
	rootMessage: (message: string): string =>
		t("errors.validation.unknown", { message, defaultValue: message }),
});

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

const toModuflowFlatErrorMap = (
	details: ApiErrorDetail[] | undefined
): Record<string, ApiErrorDetail> => {
	if (!details || details.length === 0) {
		return {};
	}

	return details.reduce<Record<string, ApiErrorDetail>>((accumulator, detail) => {
		const key = detail.path.join(".");
		accumulator[key] ??= detail;
		return accumulator;
	}, {});
};

const normalizeModuflowErrors = (
	raw: Record<string, ApiErrorDetail>,
	normalize?: StrapiErrorNormalizer
): Record<string, ApiErrorDetail> => {
	if (!normalize) {
		return raw;
	}

	const messageMap = Object.fromEntries(
		Object.entries(raw).map(([key, detail]) => [key, detail.message])
	);
	const normalizedMessages = normalize(messageMap);

	return Object.fromEntries(
		Object.entries(normalizedMessages).map(([key, message]) => [
			key,
			raw[key] ?? {
				path: key ? key.split(".") : [],
				message,
				name: "ValidationError",
			},
		])
	);
};

/**
 * Applies a Strapi API error to a React Hook Form:
 * - `StrapiRequestError` → per-field errors (with i18n) via `setError`.
 * - Anything else (network/runtime) → `root` error with `fallbackMessage`.
 */
export const applyStrapiErrorToForm = <TFieldValues extends FieldValues>(
	error: unknown,
	setError: UseFormSetError<TFieldValues>,
	t: TFunction,
	options: ApplyStrapiErrorToFormOptions<TFieldValues>,
): void => {
	const { normalize, mapField, fallbackMessage } = options;

	if (error instanceof StrapiRequestError) {
		const format = buildSerializeFormat(t);
		const raw = serializeStrapiErrors(error, format);
		const flat = normalize ? normalize(raw) : raw;

		if (Object.keys(flat).length === 0) {
			setError("root", {
				type: "server",
				message: format.rootMessage?.(error.message) ?? error.message,
			});
			return;
		}

		for (const [key, message] of Object.entries(flat)) {
			const path = mapField
				? mapField(key)
				: (key as FieldPath<TFieldValues>);
			if (path === undefined) {
				continue;
			}

			setError(path, { type: "server", message });
		}

		return;
	}

	if (isModuflowRequestError(error)) {
		const raw = toModuflowFlatErrorMap(error.details);
		const flat = normalizeModuflowErrors(raw, normalize);

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
