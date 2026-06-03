import { describe, expect, it, vi } from "vitest";

import { applyStrapiErrorToForm } from "./react-hook-form";
import { ModuflowRequestError } from "../moduflow/client";

import type { TFunction } from "i18next";
import type { FieldPath, UseFormSetError } from "react-hook-form";

interface TestFormValues {
	name: string;
	address: {
		line1: string;
	};
	root?: string;
}

describe("applyStrapiErrorToForm", () => {
	it("maps Moduflow validation paths to field errors for migrated forms", () => {
		const setError = vi.fn() as unknown as UseFormSetError<TestFormValues>;
		const t = ((key: string, options?: { defaultValue?: string }) =>
			options?.defaultValue ?? key) as TFunction;
		const fieldMap: Record<string, FieldPath<TestFormValues>> = {
			name: "name",
			"address.line1": "address.line1",
		};

		applyStrapiErrorToForm(
			new ModuflowRequestError("Validation error", 400, [
				{
					path: ["name"],
					message: "name should not be empty",
					name: "ValidationError",
					key: "validation.required",
				},
				{
					path: ["address", "line1"],
					message: "line1 should not be empty",
					name: "ValidationError",
					key: "validation.required",
				},
			]),
			setError,
			t,
			{
				fallbackMessage: "Validation error",
				mapField: (key) => fieldMap[key],
			},
		);

		expect(setError).toHaveBeenCalledWith("name", {
			type: "server",
			message: "name should not be empty",
		});
		expect(setError).toHaveBeenCalledWith("address.line1", {
			type: "server",
			message: "line1 should not be empty",
		});
		expect(setError).not.toHaveBeenCalledWith(
			"root",
			expect.objectContaining({ type: "server" }),
		);
	});
});
