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
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useStrapiForm } from "@/lib/strapi";

import type { Supplier, SupplierWriteInput } from "../types";

type SupplierFormValues = SupplierWriteInput & { root?: string };

const EMPTY_VALUES: SupplierFormValues = {
	name: "",
	phoneNumber: "",
	email: "",
	address: {
		fullAddress: "",
		line1: "",
		line2: "",
		city: "",
		region: "",
		postalCode: "",
		countryCode: "",
	},
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
		address: {
			fullAddress: supplier.address?.fullAddress ?? "",
			line1: supplier.address?.line1 ?? "",
			line2: supplier.address?.line2 ?? "",
			city: supplier.address?.city ?? "",
			region: supplier.address?.region ?? "",
			postalCode: supplier.address?.postalCode ?? "",
			countryCode: supplier.address?.countryCode ?? "",
		},
		website: supplier.website ?? "",
	};
};

const isValidPhoneNumber = (value: string): boolean => {
	if (!value.trim()) {
		return true;
	}

	return /^\+?[0-9().\-\s]{7,30}$/.test(value.trim());
};

const isValidOptionalWebsite = (value: string): boolean => {
	if (!value.trim()) {
		return true;
	}

	try {
		const url = new URL(value.trim());
		return url.protocol === "http:" || url.protocol === "https:";
	} catch {
		return false;
	}
};

const FIELD_MAP: Record<string, FieldPath<SupplierFormValues>> = {
	name: "name",
	phoneNumber: "phoneNumber",
	email: "email",
	fullAddress: "address.fullAddress",
	"address.fullAddress": "address.fullAddress",
	line1: "address.line1",
	"address.line1": "address.line1",
	line2: "address.line2",
	"address.line2": "address.line2",
	city: "address.city",
	"address.city": "address.city",
	region: "address.region",
	"address.region": "address.region",
	postalCode: "address.postalCode",
	"address.postalCode": "address.postalCode",
	countryCode: "address.countryCode",
	"address.countryCode": "address.countryCode",
	website: "website",
	root: "root",
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
	const form = useStrapiForm<SupplierFormValues>({
		defaultValues: EMPTY_VALUES,
		mapField: (key) => FIELD_MAP[key],
		mode: "onSubmit",
	});
	const {
		register,
		reset,
		submit,
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
		await onSubmit(payload);
		onOpenChange(false);
	};

	const isCreate = mode === "create";
	const rootError = errors.root?.message;
	const nameError = errors.name?.message;
	const phoneError = errors.phoneNumber?.message;
	const emailError = errors.email?.message;
	const addressFullError = errors.address?.fullAddress?.message;
	const addressLine1Error = errors.address?.line1?.message;
	const addressLine2Error = errors.address?.line2?.message;
	const cityError = errors.address?.city?.message;
	const regionError = errors.address?.region?.message;
	const postalCodeError = errors.address?.postalCode?.message;
	const countryCodeError = errors.address?.countryCode?.message;
	const websiteError = errors.website?.message;

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-2xl">
				<FormProvider {...form}>
					<form className="contents" onSubmit={submit(handleValid)}>
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
						<div className="grid gap-3 sm:grid-cols-2">
							<Field
								className="sm:col-span-2"
								data-invalid={Boolean(nameError) || undefined}
							>
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
									{...register("phoneNumber", {
										validate: (value) =>
											isValidPhoneNumber(value) ||
											t("errors.validation.phone"),
									})}
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
									type="email"
									{...register("email")}
								/>
								{emailError ? <FieldError>{emailError}</FieldError> : null}
							</Field>

							<Field
								className="sm:col-span-2"
								data-invalid={Boolean(addressFullError) || undefined}
							>
								<FieldLabel htmlFor="supplier-address-full">
									{t("suppliers.fieldAddressFull")}
								</FieldLabel>
								<Input
									aria-invalid={Boolean(addressFullError)}
									id="supplier-address-full"
									placeholder={t("suppliers.placeAddressFull")}
									{...register("address.fullAddress", {
										required: t("suppliers.fieldRequired"),
										validate: (value) =>
											value.trim().length > 0 || t("suppliers.fieldRequired"),
									})}
								/>
								{addressFullError ? (
									<FieldError>{addressFullError}</FieldError>
								) : null}
							</Field>

							<Field data-invalid={Boolean(addressLine1Error) || undefined}>
								<FieldLabel htmlFor="supplier-address-line-1">
									{t("suppliers.fieldAddressLine1")}
								</FieldLabel>
								<Input
									aria-invalid={Boolean(addressLine1Error)}
									id="supplier-address-line-1"
									placeholder={t("suppliers.placeAddressLine1")}
									{...register("address.line1")}
								/>
								{addressLine1Error ? (
									<FieldError>{addressLine1Error}</FieldError>
								) : null}
							</Field>

							<Field data-invalid={Boolean(addressLine2Error) || undefined}>
								<FieldLabel htmlFor="supplier-address-line-2">
									{t("suppliers.fieldAddressLine2")}
								</FieldLabel>
								<Input
									aria-invalid={Boolean(addressLine2Error)}
									id="supplier-address-line-2"
									placeholder={t("suppliers.placeAddressLine2")}
									{...register("address.line2")}
								/>
								{addressLine2Error ? (
									<FieldError>{addressLine2Error}</FieldError>
								) : null}
							</Field>

							<Field data-invalid={Boolean(cityError) || undefined}>
								<FieldLabel htmlFor="supplier-city">
									{t("suppliers.fieldCity")}
								</FieldLabel>
								<Input
									aria-invalid={Boolean(cityError)}
									id="supplier-city"
									placeholder={t("suppliers.placeCity")}
									{...register("address.city")}
								/>
								{cityError ? <FieldError>{cityError}</FieldError> : null}
							</Field>

							<Field data-invalid={Boolean(regionError) || undefined}>
								<FieldLabel htmlFor="supplier-region">
									{t("suppliers.fieldRegion")}
								</FieldLabel>
								<Input
									aria-invalid={Boolean(regionError)}
									id="supplier-region"
									placeholder={t("suppliers.placeRegion")}
									{...register("address.region")}
								/>
								{regionError ? <FieldError>{regionError}</FieldError> : null}
							</Field>

							<Field data-invalid={Boolean(postalCodeError) || undefined}>
								<FieldLabel htmlFor="supplier-postal-code">
									{t("suppliers.fieldPostalCode")}
								</FieldLabel>
								<Input
									aria-invalid={Boolean(postalCodeError)}
									id="supplier-postal-code"
									placeholder={t("suppliers.placePostalCode")}
									{...register("address.postalCode")}
								/>
								{postalCodeError ? (
									<FieldError>{postalCodeError}</FieldError>
								) : null}
							</Field>

							<Field data-invalid={Boolean(countryCodeError) || undefined}>
								<FieldLabel htmlFor="supplier-country-code">
									{t("suppliers.fieldCountryCode")}
								</FieldLabel>
								<Input
									aria-invalid={Boolean(countryCodeError)}
									id="supplier-country-code"
									maxLength={2}
									placeholder={t("suppliers.placeCountryCode")}
									{...register("address.countryCode")}
								/>
								{countryCodeError ? (
									<FieldError>{countryCodeError}</FieldError>
								) : null}
							</Field>

							<Field data-invalid={Boolean(websiteError) || undefined}>
								<FieldLabel htmlFor="supplier-website">
									{t("suppliers.fieldWebsite")}
								</FieldLabel>
								<Input
									aria-invalid={Boolean(websiteError)}
									id="supplier-website"
									placeholder={t("suppliers.placeWebsite")}
									{...register("website", {
										validate: (value) =>
											isValidOptionalWebsite(value) ||
											t("errors.validation.url"),
									})}
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
