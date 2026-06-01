import { authStorage } from "@/features/auth/lib/auth-storage";
import {
	StrapiRequestError,
	isStrapiErrorResponse,
} from "@/lib/strapi/error";
import type { ApiErrorDetail } from "@moduflow/types";

type ModuflowRequestOptions = Omit<RequestInit, "body"> & {
	auth?: boolean;
	body?: BodyInit | object | null;
};

export class ModuflowRequestError extends Error {
	public readonly status: number;
	public readonly details?: ApiErrorDetail[];

	public constructor(message: string, status: number, details?: ApiErrorDetail[]) {
		super(message);
		this.name = "ModuflowRequestError";
		this.status = status;
		this.details = details;
	}
}

interface ModuflowErrorEnvelope {
	error: {
		status?: number;
		message?: string;
		details?: {
			errors?: ApiErrorDetail[];
		};
	};
}

const sanitizeBaseUrl = (rawBaseUrl?: string): string => {
	if (!rawBaseUrl) {
		throw new Error("Missing required env var: VITE_MODUFLOW_API_URL");
	}

	return rawBaseUrl.replace(/\/+$/, "");
};

const getModuflowApiBaseUrl = (): string =>
	sanitizeBaseUrl(import.meta.env.VITE_MODUFLOW_API_URL);

const isApiErrorDetail = (value: unknown): value is ApiErrorDetail => {
	if (typeof value !== "object" || value === null) {
		return false;
	}

	return (
		"path" in value &&
		Array.isArray((value as { path?: unknown }).path) &&
		"message" in value &&
		typeof (value as { message?: unknown }).message === "string" &&
		"name" in value &&
		typeof (value as { name?: unknown }).name === "string"
	);
};

const isModuflowErrorEnvelope = (value: unknown): value is ModuflowErrorEnvelope => {
	if (typeof value !== "object" || value === null || !("error" in value)) {
		return false;
	}

	const error = (value as { error?: unknown }).error;
	if (typeof error !== "object" || error === null) {
		return false;
	}

	const message = (error as { message?: unknown }).message;
	if (message !== undefined && typeof message !== "string") {
		return false;
	}

	const details = (error as { details?: unknown }).details;
	if (details === undefined) {
		return true;
	}
	if (typeof details !== "object" || details === null) {
		return false;
	}

	const errors = (details as { errors?: unknown }).errors;
	return errors === undefined || (Array.isArray(errors) && errors.every(isApiErrorDetail));
};

const readErrorResponse = async (
	response: Response,
): Promise<{ details?: ApiErrorDetail[]; message: string }> => {
	const text = await response.text();
	if (!text) {
		return { message: response.statusText || "Request failed" };
	}

	try {
		const parsed: unknown = JSON.parse(text);

		if (isStrapiErrorResponse(parsed)) {
			throw new StrapiRequestError(parsed.error);
		}
		if (isModuflowErrorEnvelope(parsed)) {
			return {
				details: parsed.error.details?.errors,
				message: parsed.error.message || response.statusText || "Request failed",
			};
		}

		if (typeof parsed === "object" && parsed !== null && "message" in parsed) {
			const { message } = parsed;
			if (Array.isArray(message)) {
				return { message: message.join("\n") };
			}

			if (typeof message === "string") {
				return { message };
			}
		}
	} catch (error) {
		if (error instanceof StrapiRequestError) {
			throw error;
		}

		return { message: text.trim().slice(0, 500) };
	}

	return { message: response.statusText || "Request failed" };
};

export const moduflowRequest = async <T>(
	path: string,
	options: ModuflowRequestOptions = {}
): Promise<T> => {
	const { auth = true, body, headers: initHeaders, ...init } = options;
	const cleanPath = path.startsWith("/") ? path : `/${path}`;
	const headers = new Headers(initHeaders);

	if (body != null && !(body instanceof FormData)) {
		headers.set("Content-Type", "application/json");
	}

	if (auth) {
		const token = authStorage.getToken();
		if (token) {
			headers.set("Authorization", `Bearer ${token}`);
		}
	}

	const response = await fetch(`${getModuflowApiBaseUrl()}${cleanPath}`, {
		...init,
		body:
			body != null && !(body instanceof FormData) ? JSON.stringify(body) : body,
		headers,
	});

	if (!response.ok) {
		const errorResponse = await readErrorResponse(response);
		throw new ModuflowRequestError(
			errorResponse.message,
			response.status,
			errorResponse.details,
		);
	}

	if (response.status === 204) {
		return undefined as T;
	}

	return (await response.json()) as T;
};
