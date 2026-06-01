import { type JSX, useEffect } from "react";
import { FormProvider, type FieldPath } from "react-hook-form";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { useModuflowForm } from "@/lib/moduflow/use-moduflow-form";

import { ProductFormFields } from "./product-form-fields";

import type { SupplierOrderDetailLineResponse } from "@moduflow/types";

export interface ProductFormValues {
	description: string;
	unitCost: string;
	quantity: string;
	root?: string;
}

export interface EditableOrderLine extends SupplierOrderDetailLineResponse {
	__tempId?: string;
}

interface ProductFormDialogProps {
	currency: string;
	editingIndex: number | null;
	initialLine: EditableOrderLine | null;
	lineCount: number;
	loading: boolean;
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onSubmit: (values: ProductFormValues) => Promise<void>;
}

const EMPTY_VALUES: ProductFormValues = {
	description: "",
	unitCost: "",
	quantity: "",
};

const toFormValues = (line: EditableOrderLine | null): ProductFormValues =>
	line
		? {
				description: line.description ?? "",
				unitCost: String(line.unitCost.amount),
				quantity: String(line.quantity),
			}
		: EMPTY_VALUES;

const mapProductField = (
	key: string,
	editingIndex: number | null,
	lineCount: number,
): FieldPath<ProductFormValues> | undefined => {
	if (key === "" || key === "root") {
		return "root";
	}

	const targetIndex = editingIndex ?? lineCount;
	const map: Record<string, FieldPath<ProductFormValues>> = {
		description: "description",
		quantity: "quantity",
		unitCost: "unitCost",
		[`orderLines.${targetIndex}.description`]: "description",
		[`orderLines.${targetIndex}.quantity`]: "quantity",
		[`orderLines.${targetIndex}.unitCost`]: "unitCost",
	};

	return map[key];
};

export const ProductFormDialog = ({
	currency,
	editingIndex,
	initialLine,
	lineCount,
	loading,
	open,
	onOpenChange,
	onSubmit,
}: ProductFormDialogProps): JSX.Element => {
	const { t } = useTranslation();
	const form = useModuflowForm<ProductFormValues>({
		defaultValues: EMPTY_VALUES,
		mapField: (key) => mapProductField(key, editingIndex, lineCount),
		mode: "onSubmit",
	});
	const { reset, submit, formState } = form;

	useEffect((): void => {
		if (!open) {
			return;
		}

		reset(toFormValues(initialLine));
	}, [initialLine, open, reset]);

	const rootError = formState.errors.root?.message;

	return (
		<Dialog onOpenChange={onOpenChange} open={open}>
			<DialogContent className="max-h-[min(90dvh,720px)] gap-4 overflow-y-auto sm:max-w-xl">
				<FormProvider {...form}>
					<form className="contents" onSubmit={submit(onSubmit)}>
						<DialogHeader>
							<DialogTitle>
								{editingIndex !== null
									? t("orders.productsEditLineTitle")
									: t("orders.productsAddToOrderTitle")}
							</DialogTitle>
							<DialogDescription>
								{t("orders.productsDialogDescription", {
									defaultValue: "Update the operational order line details.",
								})}
							</DialogDescription>
						</DialogHeader>

						{rootError ? (
							<p className="text-destructive text-sm" role="alert">
								{rootError}
							</p>
						) : null}

						<ProductFormFields currency={currency} disabled={loading} />

						<DialogFooter>
							<Button
								disabled={loading}
								type="button"
								variant="outline"
								onClick={() => {
									onOpenChange(false);
								}}
							>
								{t("common.cancel")}
							</Button>
							<Button disabled={loading} type="submit">
								{t("orders.save")}
							</Button>
						</DialogFooter>
					</form>
				</FormProvider>
			</DialogContent>
		</Dialog>
	);
};
