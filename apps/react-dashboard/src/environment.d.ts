// TypeScript IntelliSense for VITE_ .env variables.
// VITE_ prefixed variables are exposed to the client while non-VITE_ variables aren't
// https://vitejs.dev/guide/env-and-mode.html

/// <reference types="vite/client" />

interface ImportMetaEnv {
	readonly VITE_APP_TITLE: string;
	readonly VITE_STRAPI_URL?: string;
	readonly VITE_STRAPI_TOKEN?: string;
	readonly VITE_STRAPI_TIMEOUT_MS?: string;
	readonly VITE_MODUFLOW_API_URL?: string;
}

interface ImportMeta {
	readonly env: ImportMetaEnv;
}
