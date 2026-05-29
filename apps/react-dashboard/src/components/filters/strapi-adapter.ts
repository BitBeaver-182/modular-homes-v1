import qs from "qs";

import {
	endOfDayLocal,
	formatYmdLocal,
	parseYmdLocal,
	startOfDayLocal,
} from "@/lib/date-ymd";

import type { FilterValue } from "./types";

const FILTER_PREFIX = "filters[";

const isRecord = (value: unknown): value is Record<string, unknown> =>
	typeof value === "object" && value !== null && !Array.isArray(value);

const isoToYmd = (iso: unknown): string | null => {
	if (typeof iso !== "string") {return null;}
	const parsed = new Date(iso);
	if (Number.isNaN(parsed.getTime())) {return null;}
	return formatYmdLocal(parsed);
};

/**
 * Serialize a `FilterValue[]` into the shape Strapi expects. The result mirrors
 * the JSON tree you'd feed directly to `strapiClient`, but already encoded as a
 * `filters[key][$op]=value` flat `URLSearchParams` block for the route URL.
 *
 * - `multi-select` → `filters[field][$in][]=v1&filters[field][$in][]=v2`
 * - `date-range`   → `filters[field][$gte]=…&filters[field][$lte]=…` (ISO)
 * - `number-range` → `filters[field][$gte]=…&filters[field][$lte]=…` (number)
 */
export function filterValuesToSearchParams(
	values: Array<FilterValue>,
): URLSearchParams {
	const filters: Record<string, unknown> = {};

	for (const entry of values) {
		if (entry.kind === "multi-select" && entry.values.length > 0) {
			filters[entry.field] = { $in: entry.values };
			continue;
		}

		if (entry.kind === "date-range" && (entry.from || entry.to)) {
			const range: { $gte?: string; $lte?: string } = {};
			if (entry.from) {
				const d = parseYmdLocal(entry.from);
				if (d) {range.$gte = startOfDayLocal(d).toISOString();}
			}
			if (entry.to) {
				const d = parseYmdLocal(entry.to);
				if (d) {range.$lte = endOfDayLocal(d).toISOString();}
			}
			if (range.$gte !== undefined || range.$lte !== undefined) {
				filters[entry.field] = range;
			}
			continue;
		}

		if (
			entry.kind === "number-range" &&
			(entry.min !== null || entry.max !== null)
		) {
			const range: { $gte?: number; $lte?: number } = {};
			if (entry.min !== null) {range.$gte = entry.min;}
			if (entry.max !== null) {range.$lte = entry.max;}
			filters[entry.field] = range;
		}
	}

	const encoded = qs.stringify(
		{ filters },
		{ encodeValuesOnly: true, arrayFormat: "brackets" },
	);

	return new URLSearchParams(encoded);
}

/**
 * Merge the encoded `filters[…]` output into an existing `URLSearchParams`
 * without touching other keys (`page`, `sort`, `search`, …). Always resets
 * `page` to `1` because filter changes invalidate the current offset.
 */
export function applyFiltersToSearchParams(
	base: URLSearchParams,
	values: Array<FilterValue>,
): URLSearchParams {
	const next = new URLSearchParams(base.toString());

	for (const key of Array.from(next.keys())) {
		if (key.startsWith(FILTER_PREFIX)) {
			next.delete(key);
		}
	}

	const encoded = filterValuesToSearchParams(values);
	encoded.forEach((value, key): void => {
		next.append(key, value);
	});

	next.set("page", "1");
	return next;
}

const pickMultiSelect = (
	field: string,
	value: unknown,
): FilterValue | null => {
	if (!isRecord(value)) {return null;}
	const inList = value["$in"];
	if (Array.isArray(inList) && inList.length > 0) {
		const arr = inList
			.map((v): string => (v === null || v === undefined ? "" : String(v)))
			.filter((v): boolean => v !== "");
		if (arr.length > 0) {
			return { kind: "multi-select", field, values: arr };
		}
	}
	const eqValue = value["$eq"];
	if (eqValue !== undefined && eqValue !== null) {
		return { kind: "multi-select", field, values: [String(eqValue)] };
	}
	return null;
};

const pickDateRange = (field: string, value: unknown): FilterValue | null => {
	if (!isRecord(value)) {return null;}
	const from = isoToYmd(value["$gte"]);
	const to = isoToYmd(value["$lte"]);
	if (!from && !to) {return null;}
	return { kind: "date-range", field, from, to };
};

const pickNumberRange = (field: string, value: unknown): FilterValue | null => {
	if (!isRecord(value)) {return null;}
	const gte = value["$gte"];
	const lte = value["$lte"];
	const min =
		typeof gte === "number" && Number.isFinite(gte)
			? gte
			: typeof gte === "string" && gte !== ""
				? Number(gte)
				: null;
	const max =
		typeof lte === "number" && Number.isFinite(lte)
			? lte
			: typeof lte === "string" && lte !== ""
				? Number(lte)
				: null;

	const finiteMin = min !== null && Number.isFinite(min) ? min : null;
	const finiteMax = max !== null && Number.isFinite(max) ? max : null;
	if (finiteMin === null && finiteMax === null) {return null;}
	return { kind: "number-range", field, min: finiteMin, max: finiteMax };
};

/**
 * Re-parse flat `filters[…]` keys from a record (e.g. the Zod-passthrough search
 * params) into the nested shape Strapi consumes directly. Useful at the API
 * boundary so the request builder can merge filters with a `$or` search block.
 */
export function decodeStrapiFiltersFromRecord(
	source: Record<string, unknown>,
): Record<string, unknown> {
	const query = new URLSearchParams();
	for (const [key, value] of Object.entries(source)) {
		if (!key.startsWith(FILTER_PREFIX)) {continue;}
		if (value === undefined || value === null) {continue;}
		if (Array.isArray(value)) {
			for (const v of value) {query.append(key, String(v));}
		} else {
			query.append(key, String(value));
		}
	}
	const parsed = qs.parse(query.toString(), { depth: 10 }) as {
		filters?: Record<string, unknown>;
	};
	return parsed.filters ?? {};
}

export type FilterFieldKind = FilterValue["kind"];

/**
 * Decode a flat `URLSearchParams` / record (TanStack search) back into
 * `FilterValue[]`. Callers pass the set of fields they expose so the adapter
 * knows which decoder to apply and which unknown keys to ignore.
 */
export function searchParamsToFilterValues(
	source: Record<string, unknown> | URLSearchParams,
	fields: Array<{ field: string; kind: FilterFieldKind }>,
): Array<FilterValue> {
	const searchRecord: Record<string, string | Array<string>> = {};

	if (source instanceof URLSearchParams) {
		for (const key of new Set(Array.from(source.keys()))) {
			const all = source.getAll(key);
			searchRecord[key] = all.length <= 1 ? (all[0] ?? "") : all;
		}
	} else {
		for (const [key, value] of Object.entries(source)) {
			if (value === undefined || value === null) {continue;}
			if (Array.isArray(value)) {
				searchRecord[key] = value.map(String);
			} else {
				searchRecord[key] = String(value);
			}
		}
	}

	const queryString = new URLSearchParams();
	for (const [key, value] of Object.entries(searchRecord)) {
		if (!key.startsWith(FILTER_PREFIX)) {continue;}
		if (Array.isArray(value)) {
			for (const v of value) {queryString.append(key, v);}
		} else {
			queryString.append(key, value);
		}
	}

	const parsed = qs.parse(queryString.toString(), { depth: 10 }) as {
		filters?: Record<string, unknown>;
	};
	const filters = parsed.filters ?? {};

	const out: Array<FilterValue> = [];
	for (const { field, kind } of fields) {
		const raw = filters[field];
		if (raw === undefined) {continue;}
		const picker =
			kind === "multi-select"
				? pickMultiSelect
				: kind === "date-range"
					? pickDateRange
					: pickNumberRange;
		const decoded = picker(field, raw);
		if (decoded) {out.push(decoded);}
	}
	return out;
}
