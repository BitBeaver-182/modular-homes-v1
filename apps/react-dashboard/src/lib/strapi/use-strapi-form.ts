import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import {
	type DefaultValues,
	type FieldValues,
	type SubmitHandler,
	type UseFormProps,
	type UseFormReturn,
	useForm,
} from "react-hook-form";

import {
	applyStrapiErrorToForm,
	type StrapiErrorNormalizer,
	type StrapiFieldMap,
} from "./react-hook-form";

export type UseStrapiFormOptions<TFieldValues extends FieldValues> = Omit<
	UseFormProps<TFieldValues>,
	"defaultValues"
> & {
	defaultValues: DefaultValues<TFieldValues>;
	/** i18n key used for non-Strapi errors (network, timeouts, runtime). */
	fallbackMessageKey?: string;
	/** Pre-processes normalized Strapi error paths (e.g. strip `data.`). */
	normalize?: StrapiErrorNormalizer;
	/** Maps a normalized Strapi key to an RHF field path. */
	mapField?: StrapiFieldMap<TFieldValues>;
};

export type StrapiSubmitHandler<TFieldValues extends FieldValues> = (
	onValid: SubmitHandler<TFieldValues>,
) => (event?: React.BaseSyntheticEvent) => Promise<void>;

export type UseStrapiFormReturn<TFieldValues extends FieldValues> =
	UseFormReturn<TFieldValues> & {
		/**
		 * Drop-in replacement for `handleSubmit`. Clears existing server errors,
		 * runs your async `onValid`, and — on throw — routes `StrapiRequestError`
		 * to field errors (i18n-translated) or falls back to a root error.
		 */
		submit: StrapiSubmitHandler<TFieldValues>;
	};

const DEFAULT_FALLBACK_KEY = "errors.validation.unknown";

export const useStrapiForm = <TFieldValues extends FieldValues>(
	options: UseStrapiFormOptions<TFieldValues>,
): UseStrapiFormReturn<TFieldValues> => {
	const {
		fallbackMessageKey = DEFAULT_FALLBACK_KEY,
		normalize,
		mapField,
		...useFormOptions
	} = options;

	const { t } = useTranslation();
	const form = useForm<TFieldValues>(useFormOptions);
	const { handleSubmit, clearErrors, setError } = form;

	const submit = useCallback<StrapiSubmitHandler<TFieldValues>>(
		(onValid) =>
			handleSubmit(async (values): Promise<void> => {
				clearErrors();
				try {
					await onValid(values);
				} catch (error) {
					applyStrapiErrorToForm(error, setError, t, {
						normalize,
						mapField,
						fallbackMessage: t(fallbackMessageKey, {
							message:
								error instanceof Error ? error.message : String(error),
							defaultValue:
								error instanceof Error ? error.message : String(error),
						}),
					});
				}
			}),
		[handleSubmit, clearErrors, setError, t, normalize, mapField, fallbackMessageKey],
	);

	return { ...form, submit };
};
