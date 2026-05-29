import { Building2, Clock, ClipboardList, Pencil } from "lucide-react";
import { useEffect, useMemo, useState, type JSX } from "react";
import { FormProvider, type FieldPath } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { OrderStatusBadge } from "@/features/supplier-orders/components/order-status-badge";
import { SUPPLIER_ORDER_STATUSES, type SupplierOrder } from "@/features/supplier-orders/types";
import { stripStrapiDataPrefix, useStrapiForm } from "@/lib/strapi";

interface OrderSidebarProps {
	order: SupplierOrder;
	mutating: boolean;
	onUpdateOrder: (input: {
		orderStatus: SupplierOrder["orderStatus"];
		trackingUrl: string | null;
	}) => Promise<void>;
}

interface OrderSidebarFormValues {
	orderStatus: SupplierOrder["orderStatus"];
	trackingUrl: string;
	root?: string;
}

const mapOrderSidebarField = (
	key: string,
): FieldPath<OrderSidebarFormValues> | undefined => {
	if (key === "root") {
		return "root";
	}
	if (key === "orderStatus") {
		return "orderStatus";
	}
	if (key === "trackingUrl") {
		return "trackingUrl";
	}
	return undefined;
};

const ensureWebsite = (value: string): string => {
	if (!value.trim()) {
		return "";
	}
	if (value.startsWith("http://") || value.startsWith("https://")) {
		return value;
	}
	return `https://${value}`;
};

const statusLabel = (status: SupplierOrder["orderStatus"]): string =>
	status.charAt(0).toUpperCase() + status.slice(1);

export const OrderSidebar = ({
	order,
	mutating,
	onUpdateOrder,
}: OrderSidebarProps): JSX.Element => {
	const { t } = useTranslation();
	const [editDialogOpen, setEditDialogOpen] = useState(false);
	const form = useStrapiForm<OrderSidebarFormValues>({
		defaultValues: {
			orderStatus: order.orderStatus,
			trackingUrl: order.trackingUrl ?? "",
		},
		mode: "onSubmit",
		normalize: stripStrapiDataPrefix,
		mapField: mapOrderSidebarField,
	});
	const {
		reset,
		submit,
		setValue,
		watch,
		formState: { errors },
	} = form;

	useEffect((): void => {
		if (!editDialogOpen) {
			return;
		}
		reset({
			orderStatus: order.orderStatus,
			trackingUrl: order.trackingUrl ?? "",
		});
	}, [editDialogOpen, order.orderStatus, order.trackingUrl, reset]);

	const historyEntries = useMemo(
		() =>
			[...(order.historyEntries ?? [])].sort(
				(a, b) => new Date(b.at).getTime() - new Date(a.at).getTime(),
			),
		[order.historyEntries],
	);
	const rootError = errors.root?.message;
	const trackingError = errors.trackingUrl?.message;
	const statusError = errors.orderStatus?.message;
	const status = watch("orderStatus");
	const trackingUrl = watch("trackingUrl");

	return (
		<div className="space-y-6">
			<Card>
				<CardHeader>
					<div className="flex items-center justify-between gap-3">
						<CardTitle className="flex items-center gap-2 text-base leading-tight">
							<ClipboardList className="size-4 shrink-0" />
							{t("orders.sidebarOrderInfoTitle")}
						</CardTitle>
						<Button
							size="icon-sm"
							type="button"
							variant="ghost"
							onClick={() => {
								setEditDialogOpen(true);
							}}
						>
							<Pencil className="size-4" />
						</Button>
					</div>
				</CardHeader>
				<CardContent className="space-y-4 text-sm">
					<div>
						<p className="text-xs text-muted-foreground">{t("orders.sidebarCreated")}</p>
						<p className="font-medium">{new Date(order.createdAt).toLocaleDateString()}</p>
					</div>
					<div>
						<p className="text-xs text-muted-foreground">{t("orders.sidebarStatus")}</p>
						<div className="mt-1">
							<OrderStatusBadge status={order.orderStatus} />
						</div>
					</div>
					<div>
						<p className="text-xs text-muted-foreground">{t("orders.sidebarTrackingUrl")}</p>
						{order.trackingUrl ? (
							<a
								className="break-all text-primary underline underline-offset-2"
								href={order.trackingUrl}
								rel="noreferrer"
								target="_blank"
							>
								{order.trackingUrl}
							</a>
						) : (
							<p className="text-muted-foreground">{t("orders.notApplicable")}</p>
						)}
					</div>
					<div>
						<p className="text-xs text-muted-foreground">{t("orders.sidebarRelatedQuote")}</p>
						{order.quote ? (
							<p className="font-medium">#{order.quote.documentId}</p>
						) : (
							<p className="text-muted-foreground">{t("orders.notApplicable")}</p>
						)}
					</div>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2 text-base">
						<Building2 className="size-4" />
						{t("orders.sidebarSupplierTitle")}
					</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4 text-sm">
					{order.supplier ? (
						<>
							<div>
								<p className="text-xs text-muted-foreground">{t("orders.sidebarSupplierName")}</p>
								<p className="font-medium">{order.supplier.name}</p>
							</div>
							<div>
								<p className="text-xs text-muted-foreground">{t("orders.sidebarSupplierPhone")}</p>
								<p className="font-medium">
									{order.supplier.phone_number ?? t("orders.notApplicable")}
								</p>
							</div>
							<div>
								<p className="text-xs text-muted-foreground">{t("orders.sidebarSupplierEmail")}</p>
								<p className="break-all font-medium">
									{order.supplier.email ?? t("orders.notApplicable")}
								</p>
							</div>
							<div>
								<p className="text-xs text-muted-foreground">{t("orders.sidebarSupplierWebsite")}</p>
								{order.supplier.website ? (
									<a
										className="break-all text-primary underline underline-offset-2"
										href={ensureWebsite(order.supplier.website)}
										rel="noreferrer"
										target="_blank"
									>
										{order.supplier.website}
									</a>
								) : (
									<p className="text-muted-foreground">{t("orders.notApplicable")}</p>
								)}
							</div>
						</>
					) : (
						<p className="text-muted-foreground">{t("orders.sidebarNoSupplier")}</p>
					)}
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2 text-base">
						<Clock className="size-4" />
						{t("orders.sidebarHistoryTitle")}
					</CardTitle>
				</CardHeader>
				<CardContent>
					{historyEntries.length === 0 ? (
						<p className="text-sm text-muted-foreground">{t("orders.sidebarNoHistory")}</p>
					) : (
						<div className="space-y-3">
							{historyEntries.map((entry) => (
								<div key={entry.documentId} className="border-l-2 border-muted pl-3">
									<p className="text-sm font-medium">{entry.message}</p>
									<p className="text-xs text-muted-foreground">
										{new Date(entry.at).toLocaleString()}
									</p>
								</div>
							))}
						</div>
					)}
				</CardContent>
			</Card>

			<Dialog
				open={editDialogOpen}
				onOpenChange={(open) => {
					setEditDialogOpen(open);
					if (!open) {
						reset({
							orderStatus: order.orderStatus,
							trackingUrl: order.trackingUrl ?? "",
						});
					}
				}}
			>
				<DialogContent>
					<FormProvider {...form}>
						<form
							className="contents"
							onSubmit={submit(async (values): Promise<void> => {
								const { root: _root, ...payload } = values;
								void _root;
								await onUpdateOrder({
									orderStatus: payload.orderStatus,
									trackingUrl: payload.trackingUrl.trim() || null,
								});
								toast.success(t("orders.sidebarToastSaved"));
								setEditDialogOpen(false);
							})}
						>
							<DialogHeader>
								<DialogTitle>{t("orders.sidebarEditTitle")}</DialogTitle>
							</DialogHeader>
							{rootError ? (
								<p className="text-destructive text-sm" role="alert">
									{rootError}
								</p>
							) : null}
							<div className="space-y-3">
								<Field data-invalid={Boolean(trackingError) || undefined}>
									<FieldLabel htmlFor="tracking-url">{t("orders.sidebarTrackingUrl")}</FieldLabel>
									<Input
										aria-invalid={Boolean(trackingError)}
										disabled={mutating}
										id="tracking-url"
										placeholder={t("orders.sidebarTrackingUrlPlaceholder")}
										value={trackingUrl}
										onChange={(event) => {
											setValue("trackingUrl", event.target.value, { shouldDirty: true });
										}}
									/>
									{trackingError ? <FieldError>{trackingError}</FieldError> : null}
								</Field>

								<Field data-invalid={Boolean(statusError) || undefined}>
									<FieldLabel htmlFor="order-status">{t("orders.sidebarOrderStatus")}</FieldLabel>
									<Select
										disabled={mutating}
										value={status}
										onValueChange={(value: SupplierOrder["orderStatus"]) => {
											setValue("orderStatus", value, { shouldDirty: true });
										}}
									>
										<SelectTrigger id="order-status">
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											{SUPPLIER_ORDER_STATUSES.map((option) => (
												<SelectItem key={option} value={option}>
													{statusLabel(option)}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
									{statusError ? <FieldError>{statusError}</FieldError> : null}
								</Field>
							</div>
							<DialogFooter>
								<Button type="button" variant="outline" onClick={() => { setEditDialogOpen(false); }}>
									{t("common.cancel")}
								</Button>
								<Button disabled={mutating} type="submit">
									{t("orders.save")}
								</Button>
							</DialogFooter>
						</form>
					</FormProvider>
				</DialogContent>
			</Dialog>
		</div>
	);
};
