import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, type FormEvent, type JSX } from "react";
import { toast } from "sonner";
import type { SupportedLocale } from "@/common/locales";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
	acceptInvitation,
	createOrganization,
	getMyInvitations,
	getSession,
	invitationsQueryKey,
	rejectInvitation,
	sessionQueryKey,
} from "@/lib/moduflow/api";
import type {
	AuthSession,
	OrganizationInvitation,
	OrganizationSummary,
} from "@/lib/moduflow/types";
import { getErrorMessage } from "./lib/auth-form";
import { getOrganizationDashboardPath } from "./lib/auth-routing";
import {
	slugifyOrganizationName,
	validateOrganizationSlug,
} from "./lib/organization-slug";

type OnboardingPageProps = {
	locale: SupportedLocale;
	session: AuthSession;
};

type OrganizationFormErrors = {
	name?: string;
	slug?: string;
	root?: string;
};

export const OnboardingPage = ({
	locale,
	session,
}: OnboardingPageProps): JSX.Element => {
	const queryClient = useQueryClient();
	const [activeTab, setActiveTab] = useState("invitations");
	const [name, setName] = useState("");
	const [slug, setSlug] = useState("");
	const [slugEdited, setSlugEdited] = useState(false);
	const [errors, setErrors] = useState<OrganizationFormErrors>({});
	const [rejectTarget, setRejectTarget] =
		useState<OrganizationInvitation | null>(null);

	const invitationsQuery = useQuery({
		queryKey: invitationsQueryKey,
		queryFn: getMyInvitations,
	});

	const invitations = invitationsQuery.data ?? [];
	const tabValue =
		invitationsQuery.isSuccess &&
		invitations.length === 0 &&
		activeTab === "invitations"
			? "create"
			: activeTab;

	const acceptMutation = useMutation({
		mutationFn: acceptInvitation,
	});

	const rejectMutation = useMutation({
		mutationFn: rejectInvitation,
	});

	const createOrganizationMutation = useMutation({
		mutationFn: createOrganization,
	});

	const accountName = session.user.name ?? session.user.email;

	const navigateToOrganization = (organization: OrganizationSummary): void => {
		window.location.assign(
			getOrganizationDashboardPath(locale, organization.slug)
		);
	};

	const handleAcceptInvitation = async (
		invitation: OrganizationInvitation
	): Promise<void> => {
		try {
			await acceptMutation.mutateAsync(invitation.id);
			const nextSession = await getSession();
			queryClient.setQueryData(sessionQueryKey, nextSession);
			toast.success("Invitation accepted");

			if (invitation.organization) {
				navigateToOrganization(invitation.organization);
				return;
			}

			const firstMembership = nextSession.memberships[0];
			if (firstMembership) {
				navigateToOrganization(firstMembership.organization);
			}
		} catch (error) {
			toast.error(getErrorMessage(error));
		}
	};

	const handleRejectInvitation = async (): Promise<void> => {
		if (!rejectTarget) {
			return;
		}

		try {
			await rejectMutation.mutateAsync(rejectTarget.id);
			await queryClient.invalidateQueries({ queryKey: invitationsQueryKey });
			toast.success("Invitation rejected");
			setRejectTarget(null);
		} catch (error) {
			toast.error(getErrorMessage(error));
		}
	};

	const handleNameChange = (value: string): void => {
		setName(value);

		if (!slugEdited) {
			setSlug(slugifyOrganizationName(value));
		}
	};

	const handleSubmitOrganization = async (
		event: FormEvent<HTMLFormElement>
	): Promise<void> => {
		event.preventDefault();

		const nextErrors: OrganizationFormErrors = {
			name: name.trim() ? undefined : "Organization name is required",
			slug: validateOrganizationSlug(slug) ?? undefined,
		};

		if (nextErrors.name || nextErrors.slug) {
			setErrors(nextErrors);
			return;
		}

		setErrors({});

		try {
			const organization = await createOrganizationMutation.mutateAsync({
				name: name.trim(),
				slug,
			});
			const nextSession = await getSession();
			queryClient.setQueryData(sessionQueryKey, nextSession);
			toast.success("Organization created");
			navigateToOrganization(organization);
		} catch (error) {
			setErrors({ root: getErrorMessage(error) });
		}
	};

	return (
		<main className="min-h-svh bg-muted/45 px-4 py-8">
			<div className="mx-auto flex w-full max-w-3xl flex-col gap-5">
				<div>
					<h1 className="text-2xl font-semibold tracking-normal">
						Welcome, {accountName}
					</h1>
					<p className="mt-1 text-sm text-muted-foreground">
						Join an existing organization or create a new one.
					</p>
				</div>

				<Tabs value={tabValue} onValueChange={setActiveTab}>
					<TabsList>
						<TabsTrigger value="invitations">Invitations</TabsTrigger>
						<TabsTrigger value="create">Create organization</TabsTrigger>
					</TabsList>

					<TabsContent className="space-y-3" value="invitations">
						{invitationsQuery.isLoading ? (
							<div className="space-y-3">
								<Skeleton className="h-24 w-full" />
								<Skeleton className="h-24 w-full" />
							</div>
						) : invitations.length > 0 ? (
							invitations.map((invitation) => (
								<Card key={invitation.id}>
									<CardHeader>
										<CardTitle>
											{invitation.organization?.name ?? "Organization"}
										</CardTitle>
										<CardDescription>{invitation.email}</CardDescription>
									</CardHeader>
									<CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
										<Badge className="w-fit" variant="secondary">
											{invitation.governanceRole}
										</Badge>
										<div className="flex gap-2">
											<Button
												disabled={acceptMutation.isPending}
												type="button"
												onClick={() => {
													void handleAcceptInvitation(invitation);
												}}
											>
												Accept
											</Button>
											<Button
												disabled={rejectMutation.isPending}
												type="button"
												variant="outline"
												onClick={() => {
													setRejectTarget(invitation);
												}}
											>
												Reject
											</Button>
										</div>
									</CardContent>
								</Card>
							))
						) : (
							<Card>
								<CardHeader>
									<CardTitle>No pending invitations</CardTitle>
									<CardDescription>
										Create an organization to continue.
									</CardDescription>
								</CardHeader>
							</Card>
						)}
					</TabsContent>

					<TabsContent value="create">
						<Card>
							<CardHeader>
								<CardTitle>Create organization</CardTitle>
								<CardDescription>
									Choose the name and URL slug for the workspace.
								</CardDescription>
							</CardHeader>
							<CardContent>
								<form className="space-y-4" onSubmit={handleSubmitOrganization}>
									{errors.root ? (
										<Alert variant="destructive">
											<AlertDescription>{errors.root}</AlertDescription>
										</Alert>
									) : null}

									<Field data-invalid={Boolean(errors.name) || undefined}>
										<FieldLabel htmlFor="organization-name">
											Organization name
										</FieldLabel>
										<Input
											aria-invalid={Boolean(errors.name)}
											id="organization-name"
											value={name}
											onChange={(event) => {
												handleNameChange(event.target.value);
											}}
										/>
										{errors.name ? (
											<FieldError>{errors.name}</FieldError>
										) : null}
									</Field>

									<Field data-invalid={Boolean(errors.slug) || undefined}>
										<FieldLabel htmlFor="organization-slug">
											Organization slug
										</FieldLabel>
										<Input
											aria-invalid={Boolean(errors.slug)}
											id="organization-slug"
											value={slug}
											onChange={(event) => {
												setSlug(slugifyOrganizationName(event.target.value));
												setSlugEdited(true);
											}}
										/>
										{errors.slug ? (
											<FieldError>{errors.slug}</FieldError>
										) : null}
									</Field>

									<Button
										disabled={createOrganizationMutation.isPending}
										type="submit"
									>
										{createOrganizationMutation.isPending
											? "Creating organization..."
											: "Create organization"}
									</Button>
								</form>
							</CardContent>
						</Card>
					</TabsContent>
				</Tabs>
			</div>

			<AlertDialog
				open={rejectTarget != null}
				onOpenChange={(open) => {
					if (!open) {
						setRejectTarget(null);
					}
				}}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Reject invitation?</AlertDialogTitle>
						<AlertDialogDescription>
							This removes the invitation from your onboarding list.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Cancel</AlertDialogCancel>
						<AlertDialogAction
							disabled={rejectMutation.isPending}
							onClick={(event) => {
								event.preventDefault();
								void handleRejectInvitation();
							}}
						>
							Reject invitation
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</main>
	);
};
