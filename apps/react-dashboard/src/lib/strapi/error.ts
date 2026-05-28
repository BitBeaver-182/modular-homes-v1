import type { StrapiErrorDetail, StrapiErrorResponse } from "./types";

type StrapiErrorPayload = StrapiErrorResponse["error"];

/**
 * Thrown by {@link StrapiClient} when the backend returns a non-2xx response.
 * Wraps the original Strapi error body so callers can i18n-translate detail
 * items via their `key` / `params` (see `errors-parser` middleware).
 */
export class StrapiRequestError extends Error {
	public readonly status: number;
	public readonly details: StrapiErrorPayload["details"];
	public readonly payloadName: string;

	public constructor(payload: StrapiErrorPayload) {
		super(payload.message);
		this.name = "StrapiRequestError";
		this.status = payload.status;
		this.details = payload.details;
		this.payloadName = payload.name;
	}

	public get items(): Array<StrapiErrorDetail> {
		return this.details?.errors ?? [];
	}
}

export const isStrapiErrorResponse = (
	value: unknown,
): value is StrapiErrorResponse => {
	if (typeof value !== "object" || value === null) {
		return false;
	}

	const candidate = value as { error?: StrapiErrorPayload };
	return (
		typeof candidate.error?.status === "number" &&
		typeof candidate.error?.name === "string" &&
		typeof candidate.error?.message === "string"
	);
};
