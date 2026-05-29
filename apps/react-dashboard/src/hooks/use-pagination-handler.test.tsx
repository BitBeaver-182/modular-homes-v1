import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { usePaginationHandler } from "./use-pagination-handler";

import type * as TanstackRouter from "@tanstack/react-router";

const navigateMock = vi.fn();

vi.mock("@tanstack/react-router", async () => {
	// preserve types/other exports if present
	const actual = await vi.importActual<typeof TanstackRouter>(
		"@tanstack/react-router"
	);
	return {
		...actual,
		useNavigate: () => navigateMock,
	};
});

describe("usePaginationHandler", () => {
	it("maps currentParams to TanStack Table pagination (page -> pageIndex)", () => {
		const { result } = renderHook(() =>
			usePaginationHandler({
				currentParams: { page: 3, pageSize: 25 },
			})
		);

		expect(result.current.pagination).toEqual({ pageIndex: 2, pageSize: 25 });
	});

	it("navigates with pageIndex + 1 and preserves other search params", () => {
		navigateMock.mockClear();

		const { result } = renderHook(() =>
			usePaginationHandler({
				currentParams: { page: 5, pageSize: 10 },
			})
		);

		result.current.onPaginationChange({ pageIndex: 1, pageSize: 10 });
		expect(navigateMock).toHaveBeenCalledTimes(1);

		const navArg = navigateMock.mock.calls[0]?.[0];
		expect(navArg).toBeTruthy();
		expect(typeof navArg.search).toBe("function");

		const prev = { page: 5, pageSize: 10, q: "abc" };
		expect(navArg.search(prev)).toEqual({ page: 2, pageSize: 10, q: "abc" });
	});

	it("supports functional updater and resets page to 1 when pageSize changes (edge case)", () => {
		navigateMock.mockClear();

		const { result } = renderHook(() =>
			usePaginationHandler({
				currentParams: { page: 2, pageSize: 10 },
			})
		);

		result.current.onPaginationChange((prev) => ({
			...prev,
			pageIndex: 7,
			pageSize: 50,
		}));

		expect(navigateMock).toHaveBeenCalledTimes(1);
		const navArg = navigateMock.mock.calls[0]?.[0];

		const prevSearch = { page: 2, pageSize: 10, foo: "bar" };
		expect(navArg.search(prevSearch)).toEqual({
			page: 1,
			pageSize: 50,
			foo: "bar",
		});
	});

	it("passes through navigateOptions", () => {
		navigateMock.mockClear();

		const { result } = renderHook(() =>
			usePaginationHandler({
				currentParams: { page: 1, pageSize: 10 },
				navigateOptions: { replace: true },
			})
		);

		result.current.onPaginationChange({ pageIndex: 0, pageSize: 10 });
		const navArg = navigateMock.mock.calls[0]?.[0];
		expect(navArg.replace).toBe(true);
	});
});
