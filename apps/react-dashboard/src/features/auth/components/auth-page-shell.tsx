import type { JSX, ReactNode } from "react";

type AuthPageShellProps = {
	children: ReactNode;
};

export const AuthPageShell = ({
	children,
}: AuthPageShellProps): JSX.Element => (
	<main className="min-h-svh bg-muted/45 px-4 py-8">
		<div className="mx-auto flex min-h-[calc(100svh-4rem)] w-full max-w-md items-center">
			{children}
		</div>
	</main>
);
