import type {
  ApiId,
  IsoDateString,
  PaginatedListResponse,
} from '../common';

export interface SupplierAddressRequest {
  line1: string;
  line2?: string;
  city?: string;
  region?: string;
  postalCode?: string;
  countryCode?: string;
}

export interface CreateSupplierRequest {
  name: string;
  phoneNumber?: string;
  email?: string;
  address?: SupplierAddressRequest;
  website?: string;
}

export interface UpdateSupplierAddressRequest {
  line1?: string;
  line2?: string;
  city?: string;
  region?: string;
  postalCode?: string;
  countryCode?: string;
}

export interface UpdateSupplierRequest {
  name?: string;
  phoneNumber?: string;
  email?: string;
  address?: UpdateSupplierAddressRequest;
  website?: string;
}

export interface SupplierAddressResponse {
  fullAddress: string;
  line1: string | null;
  line2: string | null;
  city: string | null;
  region: string | null;
  postalCode: string | null;
  countryCode: string | null;
}

export interface SupplierResponse {
  id: ApiId;
  name: string;
  phoneNumber: string | null;
  email: string | null;
  address: SupplierAddressResponse | null;
  website: string | null;
  createdAt: IsoDateString;
  updatedAt: IsoDateString;
}

export type SupplierListResponse = PaginatedListResponse<SupplierResponse>;
