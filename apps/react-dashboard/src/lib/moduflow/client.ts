import { authStorage } from "@/features/auth/lib/auth-storage";

type ModuflowRequestOptions = Omit<RequestInit, "body"> & {
	auth?: boolean;
	body?: BodyInit | object | null;
};

export class ModuflowRequestError extends Error {
	public readonly status: number;

	public constructor(message: string, status: number) {
		super(message);
		this.name = "ModuflowRequestError";
		this.status = status;
	}
}

const sanitizeBaseUrl = (rawBaseUrl?: string): string => {
	if (!rawBaseUrl) {
		throw new Error("Missing required env var: VITE_MODUFLOW_API_URL");
	}

	return rawBaseUrl.replace(/\/+$/, "");
};

const moduflowApiBaseUrl = sanitizeBaseUrl(
	import.meta.env.VITE_MODUFLOW_API_URL
);

const readErrorMessage = async (response: Response): Promise<string> => {
	const text = await response.text();
	if (!text) {
		return response.statusText || "Request failed";
	}

	try {
		const parsed: unknown = JSON.parse(text);

		if (typeof parsed === "object" && parsed !== null && "message" in parsed) {
			const { message } = parsed;
			if (Array.isArray(message)) {
				return message.join("\n");
			}

			if (typeof message === "string") {
				return message;
			}
		}
	} catch {
		return text.trim().slice(0, 500);
	}

	return response.statusText || "Request failed";
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

	const response = await fetch(`${moduflowApiBaseUrl}${cleanPath}`, {
		...init,
		body:
			body != null && !(body instanceof FormData) ? JSON.stringify(body) : body,
		headers,
	});

	if (!response.ok) {
		throw new ModuflowRequestError(
			await readErrorMessage(response),
			response.status
		);
	}

	if (response.status === 204) {
		return undefined as T;
	}

	return (await response.json()) as T;
};
