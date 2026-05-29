import { type JSX, useEffect } from "react";
import { FormProvider, useForm } from "react-hook-form";
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
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

import type { Supplier, SupplierWriteInput } from "../types";

type SupplierFormValues = SupplierWriteInput & { root?: string };

const EMPTY_VALUES: SupplierFormValues = {
	name: "",
	phoneNumber: "",
	email: "",
	address: "",
	website: "",
};

const toFormValues = (
	supplier: Supplier | null | undefined
): SupplierFormValues => {
	if (!supplier) {
		return EMPTY_VALUES;
	}

	return {
		name: supplier.name ?? "",
		phoneNumber: supplier.phoneNumber ?? "",
		email: supplier.email ?? "",
		address: supplier.address ?? "",
		website: supplier.website ?? "",
	};
};

export interface SupplierFormDialogProps {
	mode: "create" | "edit";
	open: boolean;
	onOpenChange: (open: boolean) => void;
	loading: boolean;
	initialValue?: Supplier | null;
	onSubmit: (value: SupplierWriteInput) => Promise<void>;
}

export const SupplierFormDialog = ({
	mode,
	open,
	onOpenChange,
	loading,
	initialValue,
	onSubmit,
}: SupplierFormDialogProps): JSX.Element => {
	const { t } = useTranslation();
	const form = useForm<SupplierFormValues>({
		defaultValues: EMPTY_VALUES,
		mode: "onSubmit",
	});
	const {
		register,
		reset,
		handleSubmit,
		setError,
		formState: { errors },
	} = form;

	useEffect((): void => {
		if (!open) {
			return;
		}

		reset(mode === "edit" ? toFormValues(initialValue) : EMPTY_VALUES);
	}, [initialValue, mode, open, reset]);

	const handleValid = async (values: SupplierFormValues): Promise<void> => {
		const { root: _root, ...payload } = values;
		void _root;
		try {
			await onSubmit(payload);
			onOpenChange(false);
		} catch (error) {
			setError("root", {
				message:
					error instanceof Error
						? error.message
						: t("suppliers.toastRequestFailed"),
			});
		}
	};

	const isCreate = mode === "create";
	const rootError = errors.root?.message;
	const nameError = errors.name?.message;
	const phoneError = errors.phoneNumber?.message;
	const emailError = errors.email?.message;
	const addressError = errors.address?.message;
	const websiteError = errors.website?.message;

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-md">
				<FormProvider {...form}>
					<form className="contents" onSubmit={handleSubmit(handleValid)}>
						<DialogHeader>
							<DialogTitle>
								{isCreate
									? t("suppliers.dialogAddTitle")
									: t("suppliers.dialogEditTitle")}
							</DialogTitle>
							<DialogDescription>
								{isCreate
									? t("suppliers.dialogAddDesc")
									: t("suppliers.dialogEditDesc")}
							</DialogDescription>
						</DialogHeader>
						{rootError ? (
							<p className="text-destructive text-sm" role="alert">
								{rootError}
							</p>
						) : null}
						<div className="space-y-3">
							<Field data-invalid={Boolean(nameError) || undefined}>
								<FieldLabel htmlFor="supplier-name">
									{t("suppliers.fieldName")}
								</FieldLabel>
								<Input
									aria-invalid={Boolean(nameError)}
									id="supplier-name"
									placeholder={t("suppliers.placeName")}
									{...register("name", {
										required: t("suppliers.fieldRequired"),
										validate: (value) =>
											value.trim().length > 0 || t("suppliers.fieldRequired"),
									})}
								/>
								{nameError ? <FieldError>{nameError}</FieldError> : null}
							</Field>

							<Field data-invalid={Boolean(phoneError) || undefined}>
								<FieldLabel htmlFor="supplier-phone">
									{t("suppliers.fieldPhone")}
								</FieldLabel>
								<Input
									aria-invalid={Boolean(phoneError)}
									id="supplier-phone"
									placeholder={t("suppliers.placePhone")}
									{...register("phoneNumber")}
								/>
								{phoneError ? <FieldError>{phoneError}</FieldError> : null}
							</Field>

							<Field data-invalid={Boolean(emailError) || undefined}>
								<FieldLabel htmlFor="supplier-email">
									{t("suppliers.fieldEmail")}
								</FieldLabel>
								<Input
									aria-invalid={Boolean(emailError)}
									id="supplier-email"
									placeholder={t("suppliers.placeEmail")}
									// type="email"
									{...register("email")}
								/>
								{emailError ? <FieldError>{emailError}</FieldError> : null}
							</Field>

							<Field data-invalid={Boolean(addressError) || undefined}>
								<FieldLabel htmlFor="supplier-address">
									{t("suppliers.fieldAddress")}
								</FieldLabel>
								<Textarea
									aria-invalid={Boolean(addressError)}
									className="min-h-20 resize-y"
									id="supplier-address"
									placeholder={t("suppliers.placeAddress")}
									{...register("address")}
								/>
								{addressError ? <FieldError>{addressError}</FieldError> : null}
							</Field>

							<Field data-invalid={Boolean(websiteError) || undefined}>
								<FieldLabel htmlFor="supplier-website">
									{t("suppliers.fieldWebsite")}
								</FieldLabel>
								<Input
									aria-invalid={Boolean(websiteError)}
									id="supplier-website"
									placeholder={t("suppliers.placeWebsite")}
									{...register("website")}
								/>
								{websiteError ? <FieldError>{websiteError}</FieldError> : null}
							</Field>
						</div>
						<DialogFooter>
							<Button disabled={loading} type="submit">
								{loading
									? isCreate
										? t("suppliers.creatingSupplier")
										: t("suppliers.savingSupplier")
									: isCreate
										? t("suppliers.createSupplier")
										: t("suppliers.saveChanges")}
							</Button>
						</DialogFooter>
					</form>
				</FormProvider>
			</DialogContent>
		</Dialog>
	);
};
