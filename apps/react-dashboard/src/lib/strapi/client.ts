import qs from "qs";

import { StrapiRequestError, isStrapiErrorResponse } from "./error";

import type { StrapiErrorResponse, StrapiQueryParams, StrapiResponse, UnwrapArray } from "./types";

type CollectionName =
  | "suppliers"
  | "quotes"
  | "supplier-orders"
  | "supplier-invoices"

export interface UploadedMedia {
  id: number;
  documentId?: string;
  name: string;
  mime: string;
  size: number;
  url: string;
}

/**
 * Strapi upload plugin `ref` must be the **content-type UID** (`api::<singular>.<singular>`),
 * not the REST collection segment (`quotes` → `api::quote.quote`, not `api::quotes.quotes`).
 */
const COLLECTION_UPLOAD_REF: Record<CollectionName, string> = {
  quotes: "api::quote.quote",
  suppliers: "api::supplier.supplier",
  "supplier-orders": "api::supplier-order.supplier-order",
  "supplier-invoices": "api::supplier-invoice.supplier-invoice",
}

/* -------------------------------------------------------------------------- */
/* CLIENT                                   */
/* -------------------------------------------------------------------------- */

class StrapiClient {
  private baseURL: string;
  private token: string;

  constructor(baseUrl: string, token: string) {
    this.baseURL = `${baseUrl}/api`;
    this.token = token;
  }

  /**
   * Internal request engine
   */
  private async performRequest<T>(
    path: string,
    options: RequestInit & { query?: StrapiQueryParams<T> } = {}
  ): Promise<StrapiResponse<T>> {
    const { query, ...init } = options;

    const queryString = query && Object.keys(query).length > 0
      ? qs.stringify(query, { encodeValuesOnly: true, addQueryPrefix: true })
      : "";

    const url = `${this.baseURL}${path}${queryString}`;

    const headers = new Headers(init.headers);

    // Automatically set JSON header unless we are sending FormData (Uploads)
    if (!(init.body instanceof FormData)) {
      headers.set("Content-Type", "application/json");
    }

    headers.set("Authorization", `Bearer ${this.token}`);

    const response = await fetch(url, { ...init, headers });

    if (!response.ok) {
      const text = await response.text();
      let parsed: unknown;
      try {
        parsed = JSON.parse(text);
      } catch {
        parsed = null;
      }

      if (isStrapiErrorResponse(parsed)) {
        throw new StrapiRequestError(parsed.error);
      }

      const fallback: StrapiErrorResponse = {
        data: null,
        error: {
          status: response.status,
          name: "Error",
          message:
            text.trim().slice(0, 500) ||
            response.statusText ||
            "Request failed",
        },
      };
      throw new StrapiRequestError(fallback.error);
    }

    if (response.status === 204) {return { data: {} as T };}

    const text = await response.text();
    try {
      const parsed = JSON.parse(text);
      if (
        typeof parsed === "object" &&
        parsed !== null &&
        "data" in parsed
      ) {
        return parsed as StrapiResponse<T>;
      }
      return { data: parsed as T };
    } catch {
      return { data: {} as T }
    }
  }

  /**
   * Low-level GET/POST/… with the same auth and query serialization as {@link from}.
   * Prefer `api.from("…").find/create/update/delete` for collections.
   */
  request<T>(
    path: string,
    options: RequestInit & { query?: StrapiQueryParams<T> } = {}
  ): Promise<StrapiResponse<T>> {
    const p = path.startsWith("/") ? path : `/${path}`;
    return this.performRequest<T>(p, options);
  }

  /**
   * Fluent API for collections
   */
  from<T>(path: CollectionName) {
    const cleanPath = path.startsWith("/") ? path : `/${path}`;
    const uploadRefUid = COLLECTION_UPLOAD_REF[path];

    return {
      find: (query?: StrapiQueryParams<T>, options?: RequestInit) =>
        this.performRequest<T>(cleanPath, { ...options, method: "GET", query }),

      create: (data: Partial<UnwrapArray<T>>, options?: RequestInit) =>
        this.performRequest<T>(cleanPath, {
          ...options,
          method: "POST",
          body: JSON.stringify({ data }),
        }),

      update: (documentId: string, data: Partial<UnwrapArray<T>>, options?: RequestInit) =>
        this.performRequest<T>(`${cleanPath}/${documentId}`, {
          ...options,
          method: "PUT",
          body: JSON.stringify({ data }),
        }),

      delete: (documentId: string, options?: RequestInit) =>
        this.performRequest<T>(`${cleanPath}/${documentId}`, { ...options, method: "DELETE" }),

      upload: async (file: File, ref: { id: string | number; field: string }, options?: RequestInit) => {
        const formData = new FormData();
        formData.append("files", file);
        formData.append("refId", ref.id.toString());
        formData.append("ref", uploadRefUid);
        formData.append("field", ref.field);

        return this.performRequest<any>("/upload", {
          ...options,
          method: "POST",
          body: formData,
        });
      },

      uploadFile: async (file: File, options?: RequestInit) => {
        const formData = new FormData();
        formData.append("files", file);

        return this.performRequest<Array<UploadedMedia>>("/upload", {
          ...options,
          method: "POST",
          body: formData,
        });
      },
    };
  }
}

export interface StrapiConfig {
  baseUrl: string;
  apiToken?: string;
  timeoutMs: number;
}

const DEFAULT_TIMEOUT_MS = 15_000;

const sanitizeBaseUrl = (rawBaseUrl?: string): string => {
  if (!rawBaseUrl) {
    throw new Error("Missing required env var: VITE_STRAPI_URL");
  }

  return rawBaseUrl.replace(/\/+$/, "");
};

export const strapiConfig: StrapiConfig = {
  baseUrl: sanitizeBaseUrl(import.meta.env.VITE_STRAPI_URL),
  apiToken: import.meta.env.VITE_STRAPI_TOKEN,
  timeoutMs: Number(import.meta.env.VITE_STRAPI_TIMEOUT_MS || DEFAULT_TIMEOUT_MS),
};


export const api = new StrapiClient(strapiConfig.baseUrl, strapiConfig.apiToken ?? "");
