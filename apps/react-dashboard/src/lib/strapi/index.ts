export { api as strapiClient, strapiConfig } from "./client";
export type { StrapiConfig } from "./client";

export { StrapiRequestError, isStrapiErrorResponse } from "./error";

export {
	serializeStrapiErrors,
	type SerializeStrapiErrorsFormat,
} from "./serialize-errors";

export { translateStrapiErrorDetailMessage } from "./translate-error";

export {
	applyStrapiErrorToForm,
	composeNormalizers,
	stripStrapiDataPrefix,
	type ApplyStrapiErrorToFormOptions,
	type StrapiErrorNormalizer,
	type StrapiFieldMap,
} from "./react-hook-form";

export {
	useStrapiForm,
	type StrapiSubmitHandler,
	type UseStrapiFormOptions,
	type UseStrapiFormReturn,
} from "./use-strapi-form";

export type * from "./types";
