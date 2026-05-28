import { z } from "zod";


export const createSortSchema = <T extends readonly [string, ...string[]]>(
  validFields: T
) => {
  return z.object({
    sortBy: z.enum(validFields).optional(),
    sortOrder: z.enum(["asc", "desc"]).optional(),
  });
};


export type SortSchema = z.infer<ReturnType<typeof createSortSchema>>;

export const createRequiredSortSchema = <T extends readonly [string, ...string[]]>(
  validFields: T
) => {
  return z.object({
    sortBy: z.enum(validFields),
    sortOrder: z.enum(["asc", "desc"]).optional(),
  });
};

export type RequiredSortSchema = z.infer<ReturnType<typeof createRequiredSortSchema>>;

export const createTableSchema = (pageSize: number = 15) => z.object({
  page: z.coerce.number().min(1).catch(1),
  pageSize: z.coerce.number().min(1).catch(pageSize),
  search: z.coerce.string().optional(),
});

export type TableSchema = z.infer<ReturnType<typeof createTableSchema>>;

export const dateRangeSchema = z.object({
  from: z.string().optional().catch(undefined),
  to: z.string().optional().catch(undefined),
});

export type DateRangeSchema = z.infer<typeof dateRangeSchema>;

export const numberRangeSchema = z.object({
  min: z.coerce.number().optional(),
  max: z.coerce.number().optional(),
});

export type NumberRangeSchema = z.infer<typeof numberRangeSchema>;