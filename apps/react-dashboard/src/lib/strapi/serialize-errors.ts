import type { StrapiRequestError } from "./error";
import type { StrapiErrorDetail } from "./types";

export interface SerializeStrapiErrorsFormat {
	/** Transform each field-level error into the message shown to users. */
	detailMessage?: (item: StrapiErrorDetail) => string;
	/** Transform the global error message (no field path). */
	rootMessage?: (message: string) => string;
}

/**
 * Flattens `StrapiRequestError.details.errors` into `{ "dotted.path": message }`.
 * When no field-level errors exist (or none have a `path`), returns `{ root: message }`.
 */
export const serializeStrapiErrors = (
	error: StrapiRequestError,
	format?: SerializeStrapiErrorsFormat,
): Record<string, string> => {
	const {items} = error;
	if (items.length === 0) {
		return {
			root: format?.rootMessage?.(error.message) ?? error.message,
		};
	}

	const out: Record<string, string> = {};
	let rootMessage: string | undefined;
	for (const item of items) {
		const {path} = item;
		if (!path?.length) {
			rootMessage = format?.detailMessage?.(item) ?? item.message;
			continue;
		}

		out[path.join(".")] = format?.detailMessage?.(item) ?? item.message;
	}

	return Object.keys(out).length > 0
		? out
		: {
			root:
				rootMessage ?? format?.rootMessage?.(error.message) ?? error.message,
		};
};
