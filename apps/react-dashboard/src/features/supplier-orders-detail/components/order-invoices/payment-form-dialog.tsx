import { type JSX, useEffect } from "react";
import { FormProvider } from "react-hook-form";
import { useTranslation } from "react-i18next";

import { DateInput } from "@/components/forms/inputs/date-input";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useModuflowForm } from "@/lib/moduflow/use-moduflow-form";

import type {
	CreateSupplierOrderInvoicePaymentRequest,
	SupplierOrderDetailInvoiceResponse,
	SupplierOrderInvoicePaymentMethod,
	SupplierOrderInvoicePaymentResponse,
	UpdateSupplierOrderInvoicePaymentRequest,
} from "@moduflow/types";
import { SUPPLIER_ORDER_INVOICE_PAYMENT_METHODS } from "@moduflow/types";

export interface PaymentFormValues {
	paymentReference: string;
	paymentMethod: SupplierOrderInvoicePaymentMethod;
	paymentDate: string;
	amount: string;
	bankAccount: string;
	transactionId: string;
	notes: string;
	invoiceInstallmentId: string;
	root?: string;
}

interface PaymentFormDialogProps {
	currency: string;
	initialPayment: SupplierOrderInvoicePaymentResponse | null;
	invoice: SupplierOrderDetailInvoiceResponse | null;
	loading: boolean;
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onSubmit: (values: PaymentFormValues) => Promise<void>;
}

const EMPTY_VALUES: PaymentFormValues = {
	paymentReference: "",
	paymentMethod: "bank_transfer",
	paymentDate: "",
	amount: "",
	bankAccount: "",
	transactionId: "",
	notes: "",
	invoiceInstallmentId: "",
};

const toDateInputValue = (value: string | null): string =>
	value ? value.slice(0, 10) : "";

const toFormValues = (
	payment: SupplierOrderInvoicePaymentResponse | null,
): PaymentFormValues =>
	payment
		? {
				paymentReference: payment.paymentReference ?? "",
				paymentMethod: payment.paymentMethod,
				paymentDate: toDateInputValue(payment.paymentDate),
				amount: String(payment.amount.amount),
				bankAccount: payment.bankAccount ?? "",
				transactionId: payment.transactionId ?? "",
				notes: payment.notes ?? "",
				invoiceInstallmentId: payment.invoiceInstallmentId ?? "",
			}
		: EMPTY_VALUES;

const mapPaymentField = (key: string) => {
	const fieldMap: Record<string, keyof PaymentFormValues> = {
		paymentReference: "paymentReference",
		paymentMethod: "paymentMethod",
		paymentDate: "paymentDate",
		amount: "amount",
		bankAccount: "bankAccount",
		transactionId: "transactionId",
		notes: "notes",
		invoiceInstallmentId: "invoiceInstallmentId",
		root: "root",
		"": "root",
	};

	return fieldMap[key];
};

export const normalizePaymentInput = (
	form: PaymentFormValues,
): CreateSupplierOrderInvoicePaymentRequest | UpdateSupplierOrderInvoicePaymentRequest => ({
	paymentReference: form.paymentReference.trim() || null,
	paymentMethod: form.paymentMethod,
	paymentDate: form.paymentDate,
	amount: Number(form.amount),
	bankAccount: form.bankAccount.trim() || null,
	transactionId: form.transactionId.trim() || null,
	notes: form.notes.trim() || null,
	invoiceInstallmentId: form.invoiceInstallmentId || null,
});

export const PaymentFormDialog = ({
	currency,
	initialPayment,
	invoice,
	loading,
	open,
	onOpenChange,
	onSubmit,
}: PaymentFormDialogProps): JSX.Element => {
	const { t } = useTranslation();
	const form = useModuflowForm<PaymentFormValues>({
		defaultValues: EMPTY_VALUES,
		mapField: mapPaymentField,
		mode: "onSubmit",
	});
	const {
		formState,
		register,
		reset,
		setValue,
		submit,
		watch,
	} = form;

	useEffect((): void => {
		if (!open) {
			return;
		}

		reset(toFormValues(initialPayment));
	}, [initialPayment, open, reset]);

	const rootError = formState.errors.root?.message;
	const paymentReferenceError = formState.errors.paymentReference?.message;
	const paymentDateError = formState.errors.paymentDate?.message;
	const amountError = formState.errors.amount?.message;
	const bankAccountError = formState.errors.bankAccount?.message;
	const transactionIdError = formState.errors.transactionId?.message;
	const notesError = formState.errors.notes?.message;
	const installmentError = formState.errors.invoiceInstallmentId?.message;
	const paymentMethod = watch("paymentMethod");
	const installmentId = watch("invoiceInstallmentId");
	const paymentMethodLabel = (value: SupplierOrderInvoicePaymentMethod): string =>
		value === "bank_transfer"
			? String(
					t("orders.paymentMethodBankTransfer", {
						defaultValue: "Bank transfer",
					}),
				)
			: value === "card"
				? String(t("orders.paymentMethodCard"))
				: value === "cash"
					? String(t("orders.paymentMethodCash"))
					: value === "online"
						? String(
								t("orders.paymentMethodOnline", {
									defaultValue: "Online",
								}),
							)
						: String(t("orders.paymentMethodOther"));

	return (
		<Dialog onOpenChange={onOpenChange} open={open}>
			<DialogContent className="max-h-[min(90dvh,900px)] gap-4 overflow-y-auto sm:max-w-2xl">
				<FormProvider {...form}>
					<form className="contents" onSubmit={submit(onSubmit)}>
						<DialogHeader>
							<DialogTitle>
								{initialPayment
									? t("orders.paymentEditTitle")
									: t("orders.paymentAddTitle")}
							</DialogTitle>
							<DialogDescription>
								{t("orders.paymentDialogDescription", {
									defaultValue:
										"Record a completed payment and optionally allocate it to a specific installment.",
								})}
							</DialogDescription>
						</DialogHeader>

						{rootError ? (
							<p className="text-destructive text-sm" role="alert">
								{rootError}
							</p>
						) : null}

						<FieldGroup className="gap-3">
							<Field data-invalid={Boolean(paymentReferenceError) || undefined}>
								<FieldLabel htmlFor="payment-reference">
									{t("orders.paymentReference", {
										defaultValue: "Payment reference",
									})}
								</FieldLabel>
								<Input
									aria-invalid={Boolean(paymentReferenceError)}
									disabled={loading}
									id="payment-reference"
									type="text"
									{...register("paymentReference")}
								/>
								{paymentReferenceError ? (
									<FieldError>{paymentReferenceError}</FieldError>
								) : null}
							</Field>

							<Field data-invalid={Boolean(amountError) || undefined}>
								<FieldLabel htmlFor="payment-amount">
									{t("orders.paymentAmount", { currency })}
								</FieldLabel>
								<Input
									aria-invalid={Boolean(amountError)}
									disabled={loading}
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
									disabled={loading}
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

							<Field>
								<FieldLabel htmlFor="payment-method">{t("orders.paymentMethod")}</FieldLabel>
								<Select
									disabled={loading}
									value={paymentMethod}
									onValueChange={(value: SupplierOrderInvoicePaymentMethod) => {
										setValue("paymentMethod", value, { shouldDirty: true });
									}}
								>
									<SelectTrigger className="w-full" id="payment-method">
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										{SUPPLIER_ORDER_INVOICE_PAYMENT_METHODS.map((value) => (
											<SelectItem key={value} value={value}>
												{paymentMethodLabel(value)}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</Field>

							{invoice && invoice.installments.length > 0 ? (
								<Field data-invalid={Boolean(installmentError) || undefined}>
									<FieldLabel htmlFor="payment-installment">
										{t("orders.paymentInstallment", {
											defaultValue: "Allocate to installment",
										})}
									</FieldLabel>
									<Select
										disabled={loading}
										value={installmentId || "__invoice__"}
										onValueChange={(value) => {
											setValue(
												"invoiceInstallmentId",
												value === "__invoice__" ? "" : value,
												{ shouldDirty: true },
											);
										}}
									>
										<SelectTrigger className="w-full" id="payment-installment">
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="__invoice__">
												{t("orders.paymentAllocateInvoiceOnly", {
													defaultValue: "Whole invoice",
												})}
											</SelectItem>
											{invoice.installments.map((installment) => (
												<SelectItem key={installment.id} value={installment.id}>
													{t("orders.paymentInstallmentOption", {
														defaultValue:
															"Installment {{number}} · due {{date}} · remaining {{amount}}",
														number: installment.installmentNumber,
														date: toDateInputValue(installment.dueDate),
														amount: `${installment.balanceDue.amount} ${installment.balanceDue.currencyCode}`,
													})}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
									{installmentError ? <FieldError>{installmentError}</FieldError> : null}
								</Field>
							) : null}

							<Field data-invalid={Boolean(bankAccountError) || undefined}>
								<FieldLabel htmlFor="payment-bank-account">
									{t("orders.paymentBankAccount", {
										defaultValue: "Bank account",
									})}
								</FieldLabel>
								<Input
									aria-invalid={Boolean(bankAccountError)}
									disabled={loading}
									id="payment-bank-account"
									type="text"
									{...register("bankAccount")}
								/>
								{bankAccountError ? <FieldError>{bankAccountError}</FieldError> : null}
							</Field>

							<Field data-invalid={Boolean(transactionIdError) || undefined}>
								<FieldLabel htmlFor="payment-transaction-id">
									{t("orders.paymentTransactionId", {
										defaultValue: "Transaction ID",
									})}
								</FieldLabel>
								<Input
									aria-invalid={Boolean(transactionIdError)}
									disabled={loading}
									id="payment-transaction-id"
									type="text"
									{...register("transactionId")}
								/>
								{transactionIdError ? <FieldError>{transactionIdError}</FieldError> : null}
							</Field>

							<Field data-invalid={Boolean(notesError) || undefined}>
								<FieldLabel htmlFor="payment-notes">{t("orders.paymentNotes")}</FieldLabel>
								<Textarea
									aria-invalid={Boolean(notesError)}
									disabled={loading}
									id="payment-notes"
									rows={3}
									{...register("notes")}
								/>
								{notesError ? <FieldError>{notesError}</FieldError> : null}
							</Field>
						</FieldGroup>

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
								{initialPayment ? t("orders.save") : t("orders.paymentAddAction")}
							</Button>
						</DialogFooter>
					</form>
				</FormProvider>
			</DialogContent>
		</Dialog>
	);
};
