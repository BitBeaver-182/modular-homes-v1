import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, type FormEvent, type JSX } from "react";
import type { SupportedLocale } from "@/common/locales";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
import { getSession, registerUser, sessionQueryKey } from "@/lib/moduflow/api";
import { authStorage } from "./lib/auth-storage";
import {
	getErrorMessage,
	validateEmail,
	validatePassword,
} from "./lib/auth-form";
import { resolvePostAuthPath } from "./lib/auth-routing";
import { AuthPageShell } from "./components/auth-page-shell";

type RegisterPageProps = {
	locale: SupportedLocale;
};

type RegisterFormErrors = {
	email?: string;
	password?: string;
	root?: string;
};

export const RegisterPage = ({ locale }: RegisterPageProps): JSX.Element => {
	const queryClient = useQueryClient();
	const [name, setName] = useState("");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [errors, setErrors] = useState<RegisterFormErrors>({});

	const registerMutation = useMutation({
		mutationFn: registerUser,
	});

	const handleSubmit = async (
		event: FormEvent<HTMLFormElement>
	): Promise<void> => {
		event.preventDefault();

		const nextErrors: RegisterFormErrors = {
			email: validateEmail(email) ?? undefined,
			password: validatePassword(password) ?? undefined,
		};

		if (nextErrors.email || nextErrors.password) {
			setErrors(nextErrors);
			return;
		}

		setErrors({});

		try {
			const authResponse = await registerMutation.mutateAsync({
				email: email.trim(),
				name: name.trim() || undefined,
				password,
			});
			authStorage.setToken(authResponse.access_token);
			const session = await getSession();
			queryClient.setQueryData(sessionQueryKey, session);
			window.location.assign(resolvePostAuthPath(session, locale));
		} catch (error) {
			authStorage.clearToken();
			setErrors({ root: getErrorMessage(error) });
		}
	};

	return (
		<AuthPageShell>
			<Card className="w-full">
				<CardHeader>
					<CardTitle>Create account</CardTitle>
					<CardDescription>Start with your user account.</CardDescription>
				</CardHeader>
				<CardContent>
					<form className="space-y-4" onSubmit={handleSubmit}>
						{errors.root ? (
							<Alert variant="destructive">
								<AlertDescription>{errors.root}</AlertDescription>
							</Alert>
						) : null}

						<Field>
							<FieldLabel htmlFor="register-name">Name</FieldLabel>
							<Input
								autoComplete="name"
								id="register-name"
								value={name}
								onChange={(event) => {
									setName(event.target.value);
								}}
							/>
						</Field>

						<Field data-invalid={Boolean(errors.email) || undefined}>
							<FieldLabel htmlFor="register-email">Email</FieldLabel>
							<Input
								aria-invalid={Boolean(errors.email)}
								autoComplete="email"
								id="register-email"
								type="email"
								value={email}
								onChange={(event) => {
									setEmail(event.target.value);
								}}
							/>
							{errors.email ? <FieldError>{errors.email}</FieldError> : null}
						</Field>

						<Field data-invalid={Boolean(errors.password) || undefined}>
							<FieldLabel htmlFor="register-password">Password</FieldLabel>
							<Input
								aria-invalid={Boolean(errors.password)}
								autoComplete="new-password"
								id="register-password"
								type="password"
								value={password}
								onChange={(event) => {
									setPassword(event.target.value);
								}}
							/>
							{errors.password ? (
								<FieldError>{errors.password}</FieldError>
							) : null}
						</Field>

						<Button
							className="w-full"
							disabled={registerMutation.isPending}
							type="submit"
						>
							{registerMutation.isPending
								? "Creating account..."
								: "Create account"}
						</Button>

						<p className="text-center text-sm text-muted-foreground">
							Already have an account?{" "}
							<a
								className="font-medium text-foreground underline-offset-4 hover:underline"
								href={`/${locale}/login`}
							>
								Sign in
							</a>
						</p>
					</form>
				</CardContent>
			</Card>
		</AuthPageShell>
	);
};
