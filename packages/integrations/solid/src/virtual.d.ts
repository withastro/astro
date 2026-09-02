// Provided by the integration's Vite plugin (see configEnvironmentPlugin in
// index.ts). Only resolvable when server.js is processed by Vite; the runtime
// import in server.ts degrades gracefully when it isn't.
declare module 'virtual:astro-solid-manifest' {
	export function loadManifest(): unknown;
}

// Provided by @solidjs/vite-plugin when the `serverFunctions` option is
// enabled. Server-only: dispatches transport requests to registered server
// functions (and installs endpoint/server-component config on import).
declare module 'virtual:solid-server-function-handler' {
	export const endpoint: string;
	export function handleServerFunctionRequest(
		request: Request,
		options?: { event?: Record<string, unknown> } & Record<string, unknown>,
	): Promise<Response>;
}

// Side-effect module: eagerly imports every module containing server
// functions so their registrations exist before dispatch (needed in dev,
// where the handler virtual doesn't inline it).
declare module 'virtual:solid-server-function-manifest';
