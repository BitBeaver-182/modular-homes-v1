import { type JSX } from "react";
import { useFormContext } from "react-hook-form";
import { useTranslation } from "react-i18next";

import {
	Field,
	FieldError,
	FieldGroup,
	FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";

import type { ProductFormValues } from "./product-form-dialog";

interface ProductFormFieldsProps {
	currency: string;
	disabled: boolean;
}

export const ProductFormFields = ({
	currency,
	disabled,
}: ProductFormFieldsProps): JSX.Element => {
	const { t } = useTranslation();
	const {
		register,
		formState: { errors },
	} = useFormContext<ProductFormValues>();

	const descriptionError = errors.description?.message;
	const quantityError = errors.quantity?.message;
	const unitCostError = errors.unitCost?.message;

	return (
		<FieldGroup className="grid gap-4">
			<Field data-invalid={Boolean(descriptionError) || undefined}>
				<FieldLabel htmlFor="order-line-description">
					{t("orders.productsFieldProduct")}
				</FieldLabel>
				<Input
					aria-invalid={Boolean(descriptionError)}
					disabled={disabled}
					id="order-line-description"
					placeholder={t("orders.productsFieldProduct")}
					{...register("description")}
				/>
				{descriptionError ? <FieldError>{descriptionError}</FieldError> : null}
			</Field>

			<Field data-invalid={Boolean(quantityError) || undefined}>
				<FieldLabel htmlFor="order-line-quantity">
					{t("orders.productsFieldQuantity")}
				</FieldLabel>
				<Input
					aria-invalid={Boolean(quantityError)}
					disabled={disabled}
					id="order-line-quantity"
					inputMode="numeric"
					placeholder={t("orders.productsFieldQuantity")}
					{...register("quantity")}
				/>
				{quantityError ? <FieldError>{quantityError}</FieldError> : null}
			</Field>

			<Field data-invalid={Boolean(unitCostError) || undefined}>
				<FieldLabel htmlFor="order-line-unit-cost">
					{t("orders.productsFieldUnitPrice", { currency })}
				</FieldLabel>
				<Input
					aria-invalid={Boolean(unitCostError)}
					disabled={disabled}
					id="order-line-unit-cost"
					inputMode="decimal"
					placeholder={t("orders.productsFieldUnitPrice", { currency })}
					{...register("unitCost")}
				/>
				{unitCostError ? <FieldError>{unitCostError}</FieldError> : null}
			</Field>
		</FieldGroup>
	);
};
