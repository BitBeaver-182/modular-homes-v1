const ACCESS_TOKEN_STORAGE_KEY = "moduflow.accessToken";

const canUseStorage = (): boolean => typeof window !== "undefined";

export const authStorage = {
	getToken: (): string | null => {
		if (!canUseStorage()) {
			return null;
		}

		return window.localStorage.getItem(ACCESS_TOKEN_STORAGE_KEY);
	},
	setToken: (token: string): void => {
		if (!canUseStorage()) {
			return;
		}

		window.localStorage.setItem(ACCESS_TOKEN_STORAGE_KEY, token);
	},
	clearToken: (): void => {
		if (!canUseStorage()) {
			return;
		}

		window.localStorage.removeItem(ACCESS_TOKEN_STORAGE_KEY);
	},
};

export { ACCESS_TOKEN_STORAGE_KEY };
