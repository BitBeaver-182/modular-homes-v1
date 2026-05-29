import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

import {
	createSortSchema,
	createTableSchema,
} from "@/common/validation-schema";
import SuppliersPage from "@/features/suppliers";
import { SUPPLIER_SORT_FIELDS } from "@/features/suppliers/types";

const supplierSortSchema = createSortSchema(SUPPLIER_SORT_FIELDS);
const tableSchema = createTableSchema(15);

const queryParamsSchema = z.object({
	...tableSchema.shape,
	...supplierSortSchema.shape,
});

export type SuppliersQueryParams = z.infer<typeof queryParamsSchema>;

export const Route = createFileRoute(
	"/$locale/o/$organizationSlug/_admin/_operations/suppliers"
)({
	validateSearch: queryParamsSchema,
	component: SuppliersPage,
});
