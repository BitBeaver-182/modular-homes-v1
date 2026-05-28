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
import { getSession, loginUser, sessionQueryKey } from "@/lib/moduflow/api";
import { authStorage } from "./lib/auth-storage";
import {
	getErrorMessage,
	isUnauthorizedError,
	validateEmail,
	validatePassword,
} from "./lib/auth-form";
import { resolvePostAuthPath } from "./lib/auth-routing";
import { AuthPageShell } from "./components/auth-page-shell";

type LoginPageProps = {
	locale: SupportedLocale;
	redirectPath?: string;
};

type LoginFormErrors = {
	email?: string;
	password?: string;
	root?: string;
};

export const LoginPage = ({
	locale,
	redirectPath,
}: LoginPageProps): JSX.Element => {
	const queryClient = useQueryClient();
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [errors, setErrors] = useState<LoginFormErrors>({});

	const loginMutation = useMutation({
		mutationFn: loginUser,
	});

	const handleSubmit = async (
		event: FormEvent<HTMLFormElement>
	): Promise<void> => {
		event.preventDefault();

		const nextErrors: LoginFormErrors = {
			email: validateEmail(email) ?? undefined,
			password: validatePassword(password) ?? undefined,
		};

		if (nextErrors.email || nextErrors.password) {
			setErrors(nextErrors);
			return;
		}

		setErrors({});

		try {
			const authResponse = await loginMutation.mutateAsync({
				email: email.trim(),
				password,
			});
			authStorage.setToken(authResponse.access_token);
			const session = await getSession();
			queryClient.setQueryData(sessionQueryKey, session);
			window.location.assign(
				resolvePostAuthPath(session, locale, redirectPath)
			);
		} catch (error) {
			authStorage.clearToken();
			setErrors({
				root: isUnauthorizedError(error)
					? "Email or password is incorrect"
					: getErrorMessage(error),
			});
		}
	};

	return (
		<AuthPageShell>
			<Card className="w-full">
				<CardHeader>
					<CardTitle>Sign in</CardTitle>
					<CardDescription>Use your Moduflow account.</CardDescription>
				</CardHeader>
				<CardContent>
					<form className="space-y-4" onSubmit={handleSubmit}>
						{errors.root ? (
							<Alert variant="destructive">
								<AlertDescription>{errors.root}</AlertDescription>
							</Alert>
						) : null}

						<Field data-invalid={Boolean(errors.email) || undefined}>
							<FieldLabel htmlFor="login-email">Email</FieldLabel>
							<Input
								aria-invalid={Boolean(errors.email)}
								autoComplete="email"
								id="login-email"
								type="email"
								value={email}
								onChange={(event) => {
									setEmail(event.target.value);
								}}
							/>
							{errors.email ? <FieldError>{errors.email}</FieldError> : null}
						</Field>

						<Field data-invalid={Boolean(errors.password) || undefined}>
							<FieldLabel htmlFor="login-password">Password</FieldLabel>
							<Input
								aria-invalid={Boolean(errors.password)}
								autoComplete="current-password"
								id="login-password"
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
							disabled={loginMutation.isPending}
							type="submit"
						>
							{loginMutation.isPending ? "Signing in..." : "Sign in"}
						</Button>

						<p className="text-center text-sm text-muted-foreground">
							No account?{" "}
							<a
								className="font-medium text-foreground underline-offset-4 hover:underline"
								href={`/${locale}/register`}
							>
								Create one
							</a>
						</p>
					</form>
				</CardContent>
			</Card>
		</AuthPageShell>
	);
};
