import { Link } from "@tanstack/react-router";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	useSidebar,
} from "@/components/ui/sidebar";
import type { SupportedLocale } from "@/common/locales";
import type { OrganizationMembership } from "@/lib/moduflow/types";
import { Building2Icon, ChevronsUpDownIcon } from "lucide-react";
import type { JSX } from "react";

type TeamSwitcherProps = {
	activeMembership: OrganizationMembership;
	locale: SupportedLocale;
	memberships: Array<OrganizationMembership>;
};

export function TeamSwitcher({
	activeMembership,
	locale,
	memberships,
}: TeamSwitcherProps): JSX.Element {
	const { isMobile } = useSidebar();
	const activeOrganization = activeMembership.organization;

	return (
		<SidebarMenu>
			<SidebarMenuItem>
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<SidebarMenuButton
							className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
							size="lg"
						>
							<div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
								<Building2Icon className="size-4" />
							</div>
							<div className="grid flex-1 text-left text-sm leading-tight">
								<span className="truncate font-medium">
									{activeOrganization.name}
								</span>
								<span className="truncate text-xs">
									{activeMembership.governanceRole}
								</span>
							</div>
							<ChevronsUpDownIcon className="ml-auto" />
						</SidebarMenuButton>
					</DropdownMenuTrigger>
					<DropdownMenuContent
						align="start"
						className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
						side={isMobile ? "bottom" : "right"}
						sideOffset={4}
					>
						<DropdownMenuLabel className="text-xs text-muted-foreground">
							Organizations
						</DropdownMenuLabel>
						{memberships.map((membership) => (
							<DropdownMenuItem key={membership.id} asChild>
								<Link
									className="gap-2 p-2"
									to="/$locale/o/$organizationSlug"
									params={{
										locale,
										organizationSlug: membership.organization.slug,
									}}
								>
									<div className="flex size-6 items-center justify-center rounded-md border">
										<Building2Icon className="size-4" />
									</div>
									<span className="truncate">
										{membership.organization.name}
									</span>
								</Link>
							</DropdownMenuItem>
						))}
					</DropdownMenuContent>
				</DropdownMenu>
			</SidebarMenuItem>
		</SidebarMenu>
	);
}
