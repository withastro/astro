// Provided by the integration's Vite plugin (see configEnvironmentPlugin in
// index.ts). Only resolvable when server.js is processed by Vite; the runtime
// import in server.ts degrades gracefully when it isn't.
declare module 'virtual:astro-solid-manifest' {
	export function loadManifest(): unknown;
}
