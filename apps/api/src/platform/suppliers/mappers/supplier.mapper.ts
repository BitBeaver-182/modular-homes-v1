import type {
  SupplierAddressResponse,
  SupplierListResponse,
  SupplierResponse,
} from '@moduflow/types';
import { toApiId, toIsoDateString } from '../../../common/mappers/transport';

type SupplierAddressRecord = {
  line1?: string | null;
  line2?: string | null;
  city?: string | null;
  region?: string | null;
  postalCode?: string | null;
  countryCode?: string | null;
  deletedAt?: Date | null;
};

type SupplierRecord = {
  id: bigint;
  name: string;
  phoneNumber: string | null;
  email: string | null;
  address?: SupplierAddressRecord | null;
  website: string | null;
  createdAt: Date;
  updatedAt: Date;
};

type SupplierListMeta = SupplierListResponse['meta'];

function formatFullAddress(address: SupplierAddressRecord): string {
  const regionPostalCode = [address.region, address.postalCode]
    .map((part) => part?.trim())
    .filter(Boolean)
    .join(' ');

  return [
    address.line1,
    address.line2,
    address.city,
    regionPostalCode,
    address.countryCode,
  ]
    .map((part) => part?.trim())
    .filter(Boolean)
    .join(', ');
}

export function toSupplierAddressResponse(
  address: SupplierAddressRecord | null | undefined,
): SupplierAddressResponse | null {
  if (!address || address.deletedAt) {
    return null;
  }

  return {
    fullAddress: formatFullAddress(address),
    line1: address.line1 ?? null,
    line2: address.line2 ?? null,
    city: address.city ?? null,
    region: address.region ?? null,
    postalCode: address.postalCode ?? null,
    countryCode: address.countryCode ?? null,
  };
}

export function toSupplierResponse(supplier: SupplierRecord): SupplierResponse {
  return {
    id: toApiId(supplier.id),
    name: supplier.name,
    phoneNumber: supplier.phoneNumber,
    email: supplier.email,
    address: toSupplierAddressResponse(supplier.address),
    website: supplier.website,
    createdAt: toIsoDateString(supplier.createdAt),
    updatedAt: toIsoDateString(supplier.updatedAt),
  };
}

export function toSupplierListResponse(
  suppliers: SupplierRecord[],
  meta: SupplierListMeta,
): SupplierListResponse {
  return {
    data: suppliers.map((supplier) => toSupplierResponse(supplier)),
    meta,
  };
}
