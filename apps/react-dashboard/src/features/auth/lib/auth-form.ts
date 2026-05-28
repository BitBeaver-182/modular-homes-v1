import type { ModuflowRequestError } from "@/lib/moduflow/client";

export const getErrorMessage = (error: unknown): string => {
	if (error instanceof Error) {
		return error.message;
	}

	return "Something went wrong";
};

export const validateEmail = (email: string): string | null => {
	if (!email.trim()) {
		return "Email is required";
	}

	if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
		return "Enter a valid email";
	}

	return null;
};

export const validatePassword = (password: string): string | null => {
	if (!password) {
		return "Password is required";
	}

	if (password.length < 8) {
		return "Password must be at least 8 characters";
	}

	return null;
};

export const isUnauthorizedError = (
	error: unknown
): error is ModuflowRequestError =>
	error instanceof Error &&
	"status" in error &&
	(error as { status?: unknown }).status === 401;
