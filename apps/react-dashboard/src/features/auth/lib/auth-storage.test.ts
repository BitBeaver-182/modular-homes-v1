import { beforeEach, describe, expect, it } from "vitest";
import { ACCESS_TOKEN_STORAGE_KEY, authStorage } from "./auth-storage";

describe("authStorage", () => {
	beforeEach(() => {
		window.localStorage.clear();
	});

	it("saves and reads the access token", () => {
		authStorage.setToken("token-value");

		expect(authStorage.getToken()).toBe("token-value");
		expect(window.localStorage.getItem(ACCESS_TOKEN_STORAGE_KEY)).toBe(
			"token-value"
		);
	});

	it("clears the access token", () => {
		authStorage.setToken("token-value");
		authStorage.clearToken();

		expect(authStorage.getToken()).toBeNull();
	});
});
