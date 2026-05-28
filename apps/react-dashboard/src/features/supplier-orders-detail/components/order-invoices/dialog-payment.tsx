import { type JSX, useEffect } from "react";
import { FormProvider, type FieldPath } from "react-hook-form";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { DateInput } from "@/components/forms/inputs/date-input";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
	SUPPLIER_INVOICE_PAYMENT_METHODS,
	type SupplierInvoicePaymentMethod,
	type SupplierOrderInvoicePayment,
} from "@/features/supplier-orders/types";
import { stripStrapiDataPrefix, useStrapiForm } from "@/lib/strapi";

export type PaymentFormValues = {
	amount: string;
	paymentDate: string;
	method: SupplierInvoicePaymentMethod;
	notes: string;
	root?: string;
};

type PaymentDialogProps = {
	open: boolean;
	editingPayment: SupplierOrderInvoicePayment | null;
	initialValues: PaymentFormValues;
	amountCurrency: string;
	mutating: boolean;
	onOpenChange: (open: boolean) => void;
	onSubmit: (value: PaymentFormValues) => Promise<void>;
};

const mapPaymentField = (
	key: string,
): FieldPath<PaymentFormValues> | undefined => {
	if (key === "root") {
		return "root";
	}
	if (key === "paymentDate") {
		return "paymentDate";
	}
	if (key === "method") {
		return "method";
	}
	if (key === "notes") {
		return "notes";
	}
	if (key === "paymentAmount" || key.startsWith("paymentAmount.amount")) {
		return "amount";
	}
	if (key.startsWith("paymentAmount.currency_code") || key === "currency_code") {
		return "amount";
	}
	return undefined;
};

export const PaymentDialog = ({
	open,
	editingPayment,
	initialValues,
	amountCurrency,
	mutating,
	onOpenChange,
	onSubmit,
}: PaymentDialogProps): JSX.Element => {
	const { t } = useTranslation();
	const form = useStrapiForm<PaymentFormValues>({
		defaultValues: initialValues,
		mode: "onSubmit",
		normalize: stripStrapiDataPrefix,
		mapField: mapPaymentField,
	});
	const {
		register,
		reset,
		submit,
		setValue,
		watch,
		formState: { errors },
	} = form;

	useEffect((): void => {
		if (!open) {
			return;
		}
		reset(initialValues);
	}, [initialValues, open, reset]);

	const rootError = errors.root?.message;
	const amountError = errors.amount?.message;
	const paymentDateError = errors.paymentDate?.message;
	const methodError = errors.method?.message;
	const notesError = errors.notes?.message;
	const method = watch("method");

	const paymentMethodText = (value: SupplierInvoicePaymentMethod): string =>
		value === "wire"
			? t("orders.paymentMethodWire")
			: value === "card"
				? t("orders.paymentMethodCard")
				: value === "cash"
					? t("orders.paymentMethodCash")
					: value === "check"
						? t("orders.paymentMethodCheck")
						: t("orders.paymentMethodOther");

	return (
		<Dialog modal open={open} onOpenChange={onOpenChange}>
			<DialogContent>
				<FormProvider {...form}>
					<form
						className="contents"
						onSubmit={submit(async (values): Promise<void> => {
							const { root: _root, ...payload } = values;
							void _root;
							await onSubmit(payload);
						})}
					>
						<DialogHeader>
							<DialogTitle>
								{editingPayment ? t("orders.paymentEditTitle") : t("orders.paymentAddTitle")}
							</DialogTitle>
						</DialogHeader>
						{rootError ? (
							<p className="text-destructive text-sm" role="alert">
								{rootError}
							</p>
						) : null}
						<FieldGroup className="gap-3">
							<Field data-invalid={Boolean(amountError) || undefined}>
								<FieldLabel htmlFor="payment-amount">
									{t("orders.paymentAmount", { currency: amountCurrency })}
								</FieldLabel>
								<Input
									aria-invalid={Boolean(amountError)}
									disabled={mutating}
									id="payment-amount"
									inputMode="decimal"
									type="text"
									{...register("amount")}
								/>
								{amountError ? <FieldError>{amountError}</FieldError> : null}
							</Field>

							<Field data-invalid={Boolean(paymentDateError) || undefined}>
								<FieldLabel htmlFor="payment-date">{t("orders.paymentDate")}</FieldLabel>
								<DateInput
									calendarDisabled={undefined}
									defaultValue={watch("paymentDate")}
									disabled={mutating}
									id="payment-date"
									invalid={Boolean(paymentDateError)}
									name="paymentDate"
									placeholder={t("quotes.selectDate")}
									showPresets={false}
									valueYmd={watch("paymentDate")}
									onYmdChange={(ymd) => {
										setValue("paymentDate", ymd, { shouldDirty: true });
									}}
								/>
								{paymentDateError ? <FieldError>{paymentDateError}</FieldError> : null}
							</Field>

							<Field data-invalid={Boolean(methodError) || undefined}>
								<FieldLabel htmlFor="payment-method">{t("orders.paymentMethod")}</FieldLabel>
								<Select
									disabled={mutating}
									value={method}
									onValueChange={(value: SupplierInvoicePaymentMethod) => {
										setValue("method", value, { shouldDirty: true });
									}}
								>
									<SelectTrigger className="w-full" id="payment-method">
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										{SUPPLIER_INVOICE_PAYMENT_METHODS.map((value) => (
											<SelectItem key={value} value={value}>
												{paymentMethodText(value)}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
								{methodError ? <FieldError>{methodError}</FieldError> : null}
							</Field>

							<Field data-invalid={Boolean(notesError) || undefined}>
								<FieldLabel htmlFor="payment-notes">{t("orders.paymentNotes")}</FieldLabel>
								<Textarea
									aria-invalid={Boolean(notesError)}
									disabled={mutating}
									id="payment-notes"
									rows={3}
									{...register("notes")}
								/>
								{notesError ? <FieldError>{notesError}</FieldError> : null}
							</Field>
						</FieldGroup>
						<DialogFooter>
							<Button type="button" variant="outline" onClick={() => { onOpenChange(false); }}>
								{t("common.cancel")}
							</Button>
							<Button disabled={mutating} type="submit">
								{editingPayment ? t("orders.save") : t("orders.paymentAddAction")}
							</Button>
						</DialogFooter>
					</form>
				</FormProvider>
			</DialogContent>
		</Dialog>
	);
};
