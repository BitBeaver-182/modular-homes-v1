export type ApiId = string;
export type IsoDateString = string;

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
