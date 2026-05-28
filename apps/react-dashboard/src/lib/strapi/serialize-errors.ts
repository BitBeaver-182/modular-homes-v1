import type { StrapiErrorDetail } from "./types";
import type { StrapiRequestError } from "./error";

export type SerializeStrapiErrorsFormat = {
	/** Transform each field-level error into the message shown to users. */
	detailMessage?: (item: StrapiErrorDetail) => string;
	/** Transform the global error message (no field path). */
	rootMessage?: (message: string) => string;
};

/**
 * Flattens `StrapiRequestError.details.errors` into `{ "dotted.path": message }`.
 * When no field-level errors exist (or none have a `path`), returns `{ root: message }`.
 */
export const serializeStrapiErrors = (
	error: StrapiRequestError,
	format?: SerializeStrapiErrorsFormat,
): Record<string, string> => {
	const items = error.items;
	if (items.length === 0) {
		return {
			root: format?.rootMessage?.(error.message) ?? error.message,
		};
	}

	const out: Record<string, string> = {};
	for (const item of items) {
		const path = item.path;
		if (!path?.length) {
			continue;
		}

		out[path.join(".")] = format?.detailMessage?.(item) ?? item.message;
	}

	return Object.keys(out).length > 0
		? out
		: { root: format?.rootMessage?.(error.message) ?? error.message };
};
