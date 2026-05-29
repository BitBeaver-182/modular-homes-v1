import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { useIsMobile } from "./use-mobile";

function setViewportWidth(width: number) {
	Object.defineProperty(window, "innerWidth", { value: width, writable: true, configurable: true });
}

describe("useIsMobile", () => {
	it("returns true when viewport < 768, false otherwise", () => {
		const addEventListener = vi.fn();
		const removeEventListener = vi.fn();

		const mql = { addEventListener, removeEventListener } as unknown as MediaQueryList;
		const originalMatchMedia = window.matchMedia;
		Object.defineProperty(window, "matchMedia", {
			value: vi.fn(() => mql),
			writable: true,
			configurable: true,
		});

		setViewportWidth(500);
		const { result, unmount } = renderHook(() => useIsMobile());
		expect(result.current).toBe(true);

		setViewportWidth(1024);
		const onChange = addEventListener.mock.calls[0]?.[1] as (() => void) | undefined;
		expect(addEventListener).toHaveBeenCalledWith("change", expect.any(Function));
		act(() => {
			onChange?.();
		});
		expect(result.current).toBe(false);

		unmount();
		expect(removeEventListener).toHaveBeenCalledWith("change", expect.any(Function));

		Object.defineProperty(window, "matchMedia", {
			value: originalMatchMedia,
			writable: true,
			configurable: true,
		});
	});

	it("uses the expected media query string", () => {
		const originalMatchMedia = window.matchMedia;
		const matchMediaMock = vi.fn(
			() => ({ addEventListener: vi.fn(), removeEventListener: vi.fn() }) as any,
		);
		Object.defineProperty(window, "matchMedia", {
			value: matchMediaMock,
			writable: true,
			configurable: true,
		});

		setViewportWidth(800);
		renderHook(() => useIsMobile());

		expect(matchMediaMock).toHaveBeenCalledWith("(max-width: 767px)");
		Object.defineProperty(window, "matchMedia", {
			value: originalMatchMedia,
			writable: true,
			configurable: true,
		});
	});
});

