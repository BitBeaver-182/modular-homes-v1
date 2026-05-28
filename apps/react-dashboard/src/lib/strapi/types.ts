/* -------------------------------------------------------------------------- */
/* TYPES                                    */
/* -------------------------------------------------------------------------- */

export type UnwrapArray<T> = T extends Array<infer U> ? U : T;

export type StrapiFilterOperator<T> = {
  $eq?: T;
  $eqi?: T;
  $ne?: T;
  $nei?: T;
  $lt?: number | string;
  $lte?: number | string;
  $gt?: number | string;
  $gte?: number | string;
  $in?: T[];
  $notIn?: T[];
  $contains?: string;
  $notContains?: string;
  $containsi?: string;
  $notContainsi?: string;
  $null?: boolean;
  $notNull?: boolean;
  $between?: [number | string, number | string];
  $startsWith?: string;
  $startsWithi?: string;
  $endsWith?: string;
  $endsWithi?: string;
  $not?: StrapiFilterOperator<T>;
};

// A loose, recursive filter type that handles deep/nested filtering on relations and components
export type StrapiFilters<T = any> = {
  [K in keyof UnwrapArray<T>]?:
  | UnwrapArray<T>[K]
  | StrapiFilterOperator<UnwrapArray<T>[K]>
  | StrapiFilters<any>; // allow deep nesting into relations/components
} & {
  [key: string]:  // allow arbitrary relation/component keys not in T
  | any
  | StrapiFilterOperator<any>
  | StrapiFilters<any>;
} & {
  $or?: Array<StrapiFilters<any>>;
  $and?: Array<StrapiFilters<any>>;
  $not?: StrapiFilters<any>;
};

export interface StrapiQueryParams<T> {
  sort?: string | string[];
  filters?: StrapiFilters<T>;
  populate?: string | string[] | Record<string, any>;
  fields?: (keyof UnwrapArray<T>)[];
  pagination?: {
    page?: number;
    pageSize?: number;
    withCount?: boolean;
    start?: number;
    limit?: number;
  };
  status?: 'draft' | 'published';
  locale?: string | string[];
}

export interface StrapiErrorDetail {
  path: (string | number)[];
  message: string;
  name: string;
  /** Optional enriched fields from Strapi middleware */
  key?: string | null;
  params?: Record<string, unknown>;
}

export interface StrapiErrorResponse {
  data: null;
  error: {
    status: number;
    name: string;
    message: string;
    details?: { errors?: StrapiErrorDetail[] };
  };
}

export interface StrapiResponse<T> {
  data: T;
  meta?: {
    pagination?: {
      page: number;
      pageSize: number;
      pageCount: number;
      total: number;
    };
  };
}


export interface AttachmentMedia {
  id: number;
  documentId: string;
  name: string
  alternativeText: string | null;
  caption: string | null;
  focalPoint: string | null;
  width: number | null;
  height: number | null;
  formats: Record<string, any> | null;
  hash: string;
  ext: string;
  mime: string;
  size: number;
  url: string;
  previewUrl: string | null;
  provider: string;
  provider_metadata: Record<string, any> | null;
  createdAt: string;
  updatedAt: string;
  publishedAt: string;
}

export interface StrapiCurrency {
  id: number;
  documentId: string;
  code: string;
  decimals: number;
  symbol: string | null;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
}

export interface StrapiMoney {
  amount: number | string;
  currency_code: string;
}
