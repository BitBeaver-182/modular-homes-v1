/**
 * Internal filter value model. One variant per filter shape we support.
 *
 * - `multi-select`  → `{ values: string[] }`
 * - `date-range`    → `{ from, to }` as `YYYY-MM-DD` or `null`
 * - `number-range`  → `{ min, max }` as numbers or `null`
 *
 * The UI never works in terms of operators (is / is_not / between / …). That
 * mapping lives in the Strapi URL adapter. Keep this model deliberately small
 * so each concrete filter component can own its own prop type and the bar is
 * pure composition.
 */
export type MultiSelectFilterValue = {
	kind: "multi-select";
	field: string;
	values: Array<string>;
};

export type DateRangeFilterValue = {
	kind: "date-range";
	field: string;
	from: string | null;
	to: string | null;
};

export type NumberRangeFilterValue = {
	kind: "number-range";
	field: string;
	min: number | null;
	max: number | null;
};

export type FilterValue =
	| MultiSelectFilterValue
	| DateRangeFilterValue
	| NumberRangeFilterValue;
