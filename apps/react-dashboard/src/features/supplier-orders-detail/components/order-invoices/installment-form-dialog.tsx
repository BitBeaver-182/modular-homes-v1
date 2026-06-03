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
import { Textarea } from "@/components/ui/textarea";
import { useModuflowForm } from "@/lib/moduflow/use-moduflow-form";

import type {
	CreateSupplierOrderInvoiceInstallmentRequest,
	SupplierOrderDetailInvoiceResponse,
	SupplierOrderInvoiceInstallmentResponse,
	UpdateSupplierOrderInvoiceInstallmentRequest,
} from "@moduflow/types";

export interface InstallmentFormValues {
	dueDate: string;
	amountDue: string;
	notes: string;
	root?: string;
}

interface InstallmentFormDialogProps {
	currency: string;
	initialInstallment: SupplierOrderInvoiceInstallmentResponse | null;
	invoice: SupplierOrderDetailInvoiceResponse | null;
	loading: boolean;
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onSubmit: (values: InstallmentFormValues) => Promise<void>;
}

const EMPTY_VALUES: InstallmentFormValues = {
	dueDate: "",
	amountDue: "",
	notes: "",
};

const toDateInputValue = (value: string | null): string =>
	value ? value.slice(0, 10) : "";

const toFormValues = (
	installment: SupplierOrderInvoiceInstallmentResponse | null,
): InstallmentFormValues =>
	installment
		? {
				dueDate: toDateInputValue(installment.dueDate),
				amountDue: String(installment.amountDue.amount),
				notes: installment.notes ?? "",
			}
		: EMPTY_VALUES;

const mapInstallmentField = (key: string) => {
	const fieldMap: Record<string, keyof InstallmentFormValues> = {
		dueDate: "dueDate",
		amountDue: "amountDue",
		notes: "notes",
		root: "root",
		"": "root",
	};

	return fieldMap[key];
};

export const normalizeInstallmentInput = (
	form: InstallmentFormValues,
): CreateSupplierOrderInvoiceInstallmentRequest | UpdateSupplierOrderInvoiceInstallmentRequest => ({
	dueDate: form.dueDate,
	amountDue: Number(form.amountDue),
	notes: form.notes.trim() || null,
});

export const InstallmentFormDialog = ({
	currency,
	initialInstallment,
	invoice,
	loading,
	open,
	onOpenChange,
	onSubmit,
}: InstallmentFormDialogProps): JSX.Element => {
	const { t } = useTranslation();
	const form = useModuflowForm<InstallmentFormValues>({
		defaultValues: EMPTY_VALUES,
		mapField: mapInstallmentField,
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

		reset(toFormValues(initialInstallment));
	}, [initialInstallment, open, reset]);

	const rootError = formState.errors.root?.message;
	const dueDateError = formState.errors.dueDate?.message;
	const amountDueError = formState.errors.amountDue?.message;
	const notesError = formState.errors.notes?.message;

	return (
		<Dialog onOpenChange={onOpenChange} open={open}>
			<DialogContent className="max-h-[min(90dvh,900px)] gap-4 overflow-y-auto sm:max-w-xl">
				<FormProvider {...form}>
					<form className="contents" onSubmit={submit(onSubmit)}>
						<DialogHeader>
							<DialogTitle>
								{initialInstallment
									? t("orders.installmentEditTitle", {
											defaultValue: "Edit installment",
										})
									: t("orders.installmentCreateTitle", {
											defaultValue: "Add installment",
										})}
							</DialogTitle>
							<DialogDescription>
								{t("orders.installmentDialogDescription", {
									defaultValue:
										"Define due dates and amounts for this invoice payment schedule.",
								})}
							</DialogDescription>
							{invoice ? (
								<p className="text-sm text-muted-foreground">
									{t("orders.installmentDialogInvoice", {
										defaultValue: "Invoice {{invoiceNumber}}",
										invoiceNumber: invoice.invoiceNumber,
									})}
								</p>
							) : null}
						</DialogHeader>

						{rootError ? (
							<p className="text-destructive text-sm" role="alert">
								{rootError}
							</p>
						) : null}

						<FieldGroup className="gap-3">
							<Field data-invalid={Boolean(dueDateError) || undefined}>
								<FieldLabel htmlFor="installment-due-date">
									{t("orders.invoiceDueDate")}
								</FieldLabel>
								<DateInput
									calendarDisabled={undefined}
									defaultValue={watch("dueDate")}
									disabled={loading}
									id="installment-due-date"
									invalid={Boolean(dueDateError)}
									name="dueDate"
									placeholder={t("quotes.selectDate")}
									showPresets={false}
									valueYmd={watch("dueDate")}
									onYmdChange={(ymd) => {
										setValue("dueDate", ymd, { shouldDirty: true });
									}}
								/>
								{dueDateError ? <FieldError>{dueDateError}</FieldError> : null}
							</Field>

							<Field data-invalid={Boolean(amountDueError) || undefined}>
								<FieldLabel htmlFor="installment-amount-due">
									{t("orders.installmentAmountDue", {
										currency,
										defaultValue: "Amount due ({{currency}})",
									})}
								</FieldLabel>
								<Input
									aria-invalid={Boolean(amountDueError)}
									disabled={loading}
									id="installment-amount-due"
									inputMode="decimal"
									type="text"
									{...register("amountDue")}
								/>
								{amountDueError ? <FieldError>{amountDueError}</FieldError> : null}
							</Field>

							<Field data-invalid={Boolean(notesError) || undefined}>
								<FieldLabel htmlFor="installment-notes">
									{t("orders.invoiceNotes")}
								</FieldLabel>
								<Textarea
									aria-invalid={Boolean(notesError)}
									disabled={loading}
									id="installment-notes"
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
								{initialInstallment ? t("orders.save") : t("orders.create")}
							</Button>
						</DialogFooter>
					</form>
				</FormProvider>
			</DialogContent>
		</Dialog>
	);
};
