// Provided by the @astrojs/solid-js integration's Vite plugin (configEnvironmentPlugin in
// its index.ts). Only resolvable when server.js is processed by Vite; the runtime
// import in server.ts degrades gracefully when it isn't.
declare module 'virtual:astro-solid-manifest' {
	export function loadManifest(): unknown;
	/** Whether `serverFunctions.components` is enabled. */
	export const serverComponents: boolean;
}
