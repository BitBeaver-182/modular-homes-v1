import countries from "i18n-iso-countries";
import enCountries from "i18n-iso-countries/langs/en.json";
import { Check, ChevronsUpDown } from "lucide-react";
import { type JSX, useEffect, useMemo, useState } from "react";
import { Controller, FormProvider, type FieldPath } from "react-hook-form";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from "@/components/ui/command";
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
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { useStrapiForm } from "@/lib/strapi";
import { cn } from "@/lib/utilities";

import type { Supplier, SupplierWriteInput } from "../types";

type SupplierFormValues = SupplierWriteInput & { root?: string };

interface CountryOption {
	code: string;
	name: string;
}

countries.registerLocale(enCountries);

const EMPTY_VALUES: SupplierFormValues = {
	name: "",
	phoneNumber: "",
	email: "",
	address: {
		line1: "",
		line2: "",
		city: "",
		region: "",
		postalCode: "",
		countryCode: "",
	},
	website: "",
};

const FIELD_MAP: Record<string, FieldPath<SupplierFormValues>> = {
	name: "name",
	phoneNumber: "phoneNumber",
	email: "email",
	address: "address.line1",
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

const countryOptions: Array<CountryOption> = Object.entries(
	countries.getNames("en", { select: "official" })
)
	.map(([code, name]) => ({ code, name }))
	.sort((a, b) => a.name.localeCompare(b.name));

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
		control,
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
									{...register("name")}
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
									{...register("email")}
								/>
								{emailError ? <FieldError>{emailError}</FieldError> : null}
							</Field>

							<Field
								className="sm:col-span-2"
								data-invalid={Boolean(addressLine1Error) || undefined}
							>
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
								<Controller
									control={control}
									name="address.countryCode"
									render={({ field }) => (
										<CountryCombobox
											id="supplier-country-code"
											value={field.value}
											onChange={field.onChange}
										/>
									)}
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

interface CountryComboboxProps {
	id: string;
	value: string;
	onChange: (value: string) => void;
}

function CountryCombobox({
	id,
	value,
	onChange,
}: CountryComboboxProps): JSX.Element {
	const { t } = useTranslation();
	const [open, setOpen] = useState(false);
	const selectedCountry = useMemo(
		() => countryOptions.find((country) => country.code === value),
		[value],
	);

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger asChild>
				<Button
					aria-expanded={open}
					className="w-full justify-between"
					id={id}
					role="combobox"
					type="button"
					variant="outline"
				>
					<span className="truncate">
						{selectedCountry
							? `${selectedCountry.name} (${selectedCountry.code})`
							: t("suppliers.placeCountryCode")}
					</span>
					<ChevronsUpDown className="size-4 opacity-50" />
				</Button>
			</PopoverTrigger>
			<PopoverContent align="start" className="w-[--radix-popover-trigger-width] p-0">
				<Command>
					<CommandInput placeholder={t("suppliers.searchCountries")} />
					<CommandList>
						<CommandEmpty>{t("suppliers.noCountries")}</CommandEmpty>
						<CommandGroup>
							{countryOptions.map((country) => (
								<CommandItem
									key={country.code}
									value={`${country.name} ${country.code}`}
									onSelect={() => {
										onChange(country.code);
										setOpen(false);
									}}
								>
									<Check
										className={cn(
											"size-4",
											value === country.code ? "opacity-100" : "opacity-0",
										)}
									/>
									<span>{country.name}</span>
									<span className="ml-auto text-xs text-muted-foreground">
										{country.code}
									</span>
								</CommandItem>
							))}
						</CommandGroup>
					</CommandList>
				</Command>
			</PopoverContent>
		</Popover>
	);
}
