import { useCallback } from "react";
import {
	type DefaultValues,
	type FieldValues,
	type SubmitHandler,
	type UseFormProps,
	type UseFormReturn,
	useForm,
} from "react-hook-form";
import { useTranslation } from "react-i18next";

import {
	applyModuflowErrorToForm,
	type ModuflowErrorNormalizer,
	type ModuflowFieldMap,
} from "./react-hook-form";

export type UseModuflowFormOptions<TFieldValues extends FieldValues> = Omit<
	UseFormProps<TFieldValues>,
	"defaultValues"
> & {
	defaultValues: DefaultValues<TFieldValues>;
	fallbackMessageKey?: string;
	normalize?: ModuflowErrorNormalizer;
	mapField?: ModuflowFieldMap<TFieldValues>;
};

export type ModuflowSubmitHandler<TFieldValues extends FieldValues> = (
	onValid: SubmitHandler<TFieldValues>,
) => (event?: React.BaseSyntheticEvent) => Promise<void>;

export type UseModuflowFormReturn<TFieldValues extends FieldValues> =
	UseFormReturn<TFieldValues> & {
		submit: ModuflowSubmitHandler<TFieldValues>;
	};

const DEFAULT_FALLBACK_KEY = "errors.validation.unknown";

export const useModuflowForm = <TFieldValues extends FieldValues>(
	options: UseModuflowFormOptions<TFieldValues>,
): UseModuflowFormReturn<TFieldValues> => {
	const {
		fallbackMessageKey = DEFAULT_FALLBACK_KEY,
		normalize,
		mapField,
		...useFormOptions
	} = options;

	const { t } = useTranslation();
	const form = useForm<TFieldValues>(useFormOptions);
	const { clearErrors, handleSubmit, setError } = form;

	const submit = useCallback<ModuflowSubmitHandler<TFieldValues>>(
		(onValid) =>
			async (event?: React.BaseSyntheticEvent): Promise<void> => {
				clearErrors();
				await handleSubmit(async (values): Promise<void> => {
					try {
						await onValid(values);
					} catch (error) {
						applyModuflowErrorToForm(error, setError, t, {
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
				})(event);
			},
		[clearErrors, fallbackMessageKey, handleSubmit, mapField, normalize, setError, t],
	);

	return { ...form, submit };
};
