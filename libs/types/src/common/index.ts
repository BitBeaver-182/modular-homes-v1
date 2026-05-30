export type ApiId = string;
export type IsoDateString = string;
export const API_ERROR_KEYS = [
  'validation.email',
  'validation.phone',
  'validation.countryCode',
  'validation.required',
  'validation.string',
  'validation.url',
  'validation.maxLength',
  'validation.minLength',
  'validation.unknown',
  'validation.unique',
  'http.badRequest',
  'http.unauthorized',
  'http.forbidden',
  'http.notFound',
  'http.error',
  'http.internalServerError',
] as const;
export type ApiErrorKey = (typeof API_ERROR_KEYS)[number];

export interface PaginationMeta {
  page: number;
  pageSize: number;
  pageCount: number;
  total: number;
}

export interface HealthResponse {
  status: string;
  service: string;
  timestamp: IsoDateString;
}

export interface ApiErrorDetail {
  path: Array<string | number>;
  message: string;
  name: string;
  key?: ApiErrorKey | null;
  params?: Record<string, string | number>;
}

export interface ApiErrorHttpResponse {
  message: string;
  errors?: ApiErrorDetail[];
}
