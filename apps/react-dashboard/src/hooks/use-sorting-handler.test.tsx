import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { useSortingHandler } from "./use-sorting-handler";

import type * as TanstackRouter from "@tanstack/react-router";

const navigateMock = vi.fn();
const getLastNavigateArg = (): any =>
	navigateMock.mock.calls[navigateMock.mock.calls.length - 1]?.[0];

vi.mock("@tanstack/react-router", async () => {
	const actual = await vi.importActual<typeof TanstackRouter>(
		"@tanstack/react-router"
	);
	return {
		...actual,
		useNavigate: () => navigateMock,
	};
});

describe("useSortingHandler", () => {
	it("reflects URL params into TanStack sorting state", () => {
		const { result } = renderHook(() =>
			useSortingHandler({
				currentParams: { sortBy: "name", sortOrder: "asc" },
			})
		);

		expect(result.current.sorting).toEqual([{ id: "name", desc: false }]);
	});

	it("applies defaultSorting to URL once when sortBy is missing", () => {
		navigateMock.mockClear();

		renderHook(() =>
			useSortingHandler({
				currentParams: {},
				defaultSorting: [{ id: "createdAt", desc: true }],
			})
		);

		expect(navigateMock).toHaveBeenCalledTimes(1);
		const navArg = navigateMock.mock.calls[0]?.[0];
		const prev = { page: 2, foo: "bar" };
		expect(navArg.search(prev)).toEqual({
			page: 2,
			foo: "bar",
			sortBy: "createdAt",
			sortOrder: "desc",
		});
	});

	it("does not re-apply defaultSorting after first application (edge case)", () => {
		navigateMock.mockClear();

		const { rerender } = renderHook(
			(props: { sortBy?: string }) =>
				useSortingHandler({
					currentParams: { sortBy: props.sortBy } as any,
					defaultSorting: [{ id: "createdAt", desc: true }],
				}),
			{ initialProps: { sortBy: undefined } }
		);

		expect(navigateMock).toHaveBeenCalledTimes(1);
		rerender({ sortBy: undefined });
		expect(navigateMock).toHaveBeenCalledTimes(1);
	});

	it("does not apply defaultSorting when sortBy already exists", () => {
		navigateMock.mockClear();

		renderHook(() =>
			useSortingHandler({
				currentParams: { sortBy: "name", sortOrder: "desc" },
				defaultSorting: [{ id: "createdAt", desc: true }],
			})
		);

		expect(navigateMock).not.toHaveBeenCalled();
	});

	it("does not apply defaultSorting when it is empty or has no id", () => {
		navigateMock.mockClear();
		renderHook(() =>
			useSortingHandler({ currentParams: {}, defaultSorting: [] })
		);
		expect(navigateMock).not.toHaveBeenCalled();

		navigateMock.mockClear();
		renderHook(() =>
			useSortingHandler({
				currentParams: {},
				defaultSorting: [{ id: "" as any, desc: false }],
			})
		);
		expect(navigateMock).not.toHaveBeenCalled();
	});

	it("applies defaultSorting with asc when desc is false", () => {
		navigateMock.mockClear();

		renderHook(() =>
			useSortingHandler({
				currentParams: {},
				defaultSorting: [{ id: "name", desc: false }],
			})
		);

		const navArg = navigateMock.mock.calls[0]?.[0];
		expect(navArg.search({})).toEqual({ sortBy: "name", sortOrder: "asc" });
	});

	it("cycles sorting for same column: desc -> asc -> none", () => {
		navigateMock.mockClear();
		const { result, unmount } = renderHook(() =>
			useSortingHandler({
				currentParams: { sortBy: "name", sortOrder: "desc" },
			})
		);

		// desc -> asc
		result.current.onSortingChange([{ id: "name", desc: true }]);
		let navArg = getLastNavigateArg();
		expect(navArg.search({})).toEqual({ sortBy: "name", sortOrder: "asc" });

		// simulate URL updated
		unmount();
		const nextRender = renderHook(() =>
			useSortingHandler({
				currentParams: { sortBy: "name", sortOrder: "asc" },
			})
		);

		// asc -> none
		nextRender.result.current.onSortingChange([{ id: "name", desc: false }]);
		navArg = getLastNavigateArg();
		expect(navArg.search({ keep: 1 })).toEqual({
			keep: 1,
			sortBy: undefined,
			sortOrder: undefined,
		});
	});

	it("treats undefined sortOrder as starting at desc for same column (edge case)", () => {
		navigateMock.mockClear();

		const { result } = renderHook(() =>
			useSortingHandler({
				currentParams: { sortBy: "name" },
			})
		);

		result.current.onSortingChange([{ id: "name", desc: false }]);
		const navArg = getLastNavigateArg();
		expect(navArg.search({})).toEqual({ sortBy: "name", sortOrder: "desc" });
	});

	it("first click on a new column always sets desc", () => {
		navigateMock.mockClear();

		const { result } = renderHook(() =>
			useSortingHandler({
				currentParams: { sortBy: "name", sortOrder: "asc" },
			})
		);

		result.current.onSortingChange([{ id: "createdAt", desc: false }]);
		const navArg = getLastNavigateArg();
		expect(navArg.search({})).toEqual({
			sortBy: "createdAt",
			sortOrder: "desc",
		});
	});

	it("handles TanStack proposing an id when there is no current sort", () => {
		navigateMock.mockClear();

		const { result } = renderHook(() =>
			useSortingHandler({
				currentParams: {},
			})
		);

		result.current.onSortingChange([{ id: "name", desc: false }]);
		const navArg = getLastNavigateArg();
		expect(navArg.search({})).toEqual({ sortBy: "name", sortOrder: "desc" });
	});

	it("supports functional updater for onSortingChange", () => {
		navigateMock.mockClear();

		const { result } = renderHook(() =>
			useSortingHandler({
				currentParams: { sortBy: "name", sortOrder: "desc" },
			})
		);

		result.current.onSortingChange((prev) => prev);
		expect(navigateMock).toHaveBeenCalledTimes(1);
	});

	it("clears sorting when there is no current sort and TanStack proposes none", () => {
		navigateMock.mockClear();

		const { result } = renderHook(() =>
			useSortingHandler({
				currentParams: {},
			})
		);

		result.current.onSortingChange([]);
		const navArg = getLastNavigateArg();
		expect(navArg.search({ foo: "bar" })).toEqual({
			foo: "bar",
			sortBy: undefined,
			sortOrder: undefined,
		});
	});

	it("passes through navigateOptions", () => {
		navigateMock.mockClear();

		const { result } = renderHook(() =>
			useSortingHandler({
				currentParams: {},
				navigateOptions: { replace: true },
			})
		);

		result.current.onSortingChange([{ id: "name", desc: true }]);
		const navArg = getLastNavigateArg();
		expect(navArg.replace).toBe(true);
	});
});
