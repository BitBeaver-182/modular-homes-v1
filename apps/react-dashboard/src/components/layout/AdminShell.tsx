import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import {
	Calendar,
	FileText,
	LayoutDashboard,
	Package,
	ShoppingCart,
	Target,
	UserCircle,
	Users,
	Warehouse,
} from "lucide-react";
import type { ComponentType, JSX, ReactNode } from "react";
import { useTranslation } from "react-i18next";
import type { SupportedLocale } from "../../common/locales";
import { authStorage } from "@/features/auth/lib/auth-storage";
import type { AuthUser, OrganizationMembership } from "@/lib/moduflow/types";
import { NavUser } from "./NavUser";
import { TeamSwitcher } from "./TeamSwitcher";
import { ThemeToggle } from "../theme-toggle";
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarGroup,
	SidebarGroupContent,
	SidebarGroupLabel,
	SidebarHeader,
	SidebarInset,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarProvider,
	SidebarTrigger,
} from "../ui/sidebar";
import { LocaleSwitcher } from "./LocaleSwitcher";

type AdminShellProps = {
	activeMembership: OrganizationMembership;
	children: ReactNode;
	locale: SupportedLocale;
	memberships: Array<OrganizationMembership>;
	user: AuthUser;
};

type NavItem = {
	labelKey:
		| "dashboard"
		| "suppliers"
		| "products"
		| "quotes"
		| "supplierOrders"
		| "inventory"
		| "leads"
		| "customerOrders"
		| "calendar"
		| "account";
	to:
		| "/$locale/o/$organizationSlug"
		| "/$locale/o/$organizationSlug/suppliers"
		| "/$locale/o/$organizationSlug/products"
		| "/$locale/o/$organizationSlug/quotes"
		| "/$locale/o/$organizationSlug/supplier-orders"
		| "/$locale/o/$organizationSlug/inventory"
		| "/$locale/o/$organizationSlug/leads"
		| "/$locale/o/$organizationSlug/customer-orders"
		| "/$locale/o/$organizationSlug/marketing/calendar"
		| "/$locale/o/$organizationSlug/account";
	icon: ComponentType<{ className?: string }>;
};

type NavGroup = {
	groupKey: "general" | "operations" | "sales" | "marketing" | "settings";
	items: Array<NavItem>;
};

const NAV_GROUPS: Array<NavGroup> = [
	{
		groupKey: "general",
		items: [
			{
				labelKey: "dashboard",
				to: "/$locale/o/$organizationSlug",
				icon: LayoutDashboard,
			},
		],
	},
	{
		groupKey: "operations",
		items: [
			{
				labelKey: "suppliers",
				to: "/$locale/o/$organizationSlug/suppliers",
				icon: Users,
			},
			{
				labelKey: "products",
				to: "/$locale/o/$organizationSlug/products",
				icon: Package,
			},
			{
				labelKey: "quotes",
				to: "/$locale/o/$organizationSlug/quotes",
				icon: FileText,
			},
			{
				labelKey: "supplierOrders",
				to: "/$locale/o/$organizationSlug/supplier-orders",
				icon: ShoppingCart,
			},
			{
				labelKey: "inventory",
				to: "/$locale/o/$organizationSlug/inventory",
				icon: Warehouse,
			},
		],
	},
	{
		groupKey: "sales",
		items: [
			{
				labelKey: "leads",
				to: "/$locale/o/$organizationSlug/leads",
				icon: Target,
			},
			{
				labelKey: "customerOrders",
				to: "/$locale/o/$organizationSlug/customer-orders",
				icon: UserCircle,
			},
		],
	},
	{
		groupKey: "marketing",
		items: [
			{
				labelKey: "calendar",
				to: "/$locale/o/$organizationSlug/marketing/calendar",
				icon: Calendar,
			},
		],
	},
];

export const AdminShell = ({
	activeMembership,
	children,
	locale,
	memberships,
	user,
}: AdminShellProps): JSX.Element => {
	const { t } = useTranslation();
	const location = useLocation();
	const navigate = useNavigate();
	const queryClient = useQueryClient();
	const organizationSlug = activeMembership.organization.slug;

	const isActive = (to: NavItem["to"]): boolean => {
		const resolvedPath = to
			.replace("$locale", locale)
			.replace("$organizationSlug", organizationSlug);
		if (resolvedPath === `/${locale}/o/${organizationSlug}`) {
			return location.pathname === resolvedPath;
		}

		return (
			location.pathname === resolvedPath ||
			location.pathname.startsWith(`${resolvedPath}/`)
		);
	};

	const handleLogout = (): void => {
		authStorage.clearToken();
		queryClient.clear();
		void navigate({
			params: { locale },
			to: "/$locale/login",
		});
	};

	return (
		<SidebarProvider defaultOpen>
			<Sidebar collapsible="icon">
				<SidebarHeader className="border-b">
					<TeamSwitcher
						activeMembership={activeMembership}
						locale={locale}
						memberships={memberships}
					/>
				</SidebarHeader>
				<SidebarContent>
					{NAV_GROUPS.map((group) => (
						<SidebarGroup key={group.groupKey}>
							<SidebarGroupLabel>
								{t(`nav.${group.groupKey}`)}
							</SidebarGroupLabel>
							<SidebarGroupContent>
								<SidebarMenu>
									{group.items.map((item) => (
										<SidebarMenuItem key={item.to}>
											<SidebarMenuButton asChild isActive={isActive(item.to)}>
												<Link
													params={{ locale, organizationSlug }}
													to={item.to}
												>
													<item.icon />
													<span>{t(`nav.${item.labelKey}`)}</span>
												</Link>
											</SidebarMenuButton>
										</SidebarMenuItem>
									))}
								</SidebarMenu>
							</SidebarGroupContent>
						</SidebarGroup>
					))}
				</SidebarContent>
				<SidebarFooter className="border-t p-2">
					<NavUser user={user} onLogout={handleLogout} />
				</SidebarFooter>
			</Sidebar>
			<SidebarInset className="min-w-0">
				<header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
					<SidebarTrigger className="-ml-1" />
					<div className="ml-auto">
						<div className="flex items-center gap-2">
							<ThemeToggle />
							<LocaleSwitcher currentLocale={locale} />
						</div>
					</div>
				</header>
				<main className="px-5 py-4 bg-muted/45">{children}</main>
				{/* <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto overflow-x-hidden p-6"> */}
				{/* </div> */}
			</SidebarInset>
		</SidebarProvider>
	);
};
