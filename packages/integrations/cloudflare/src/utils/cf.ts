/**
 * Shared Cloudflare helpers used by `handler.ts` (the `handle()` entrypoint),
 * `@astrojs/cloudflare/fetch`, and `@astrojs/cloudflare/hono`.
 *
 * Re-exports all pure helpers from `cf-helpers.ts` and adds
 * `injectSessionBinding` and `finalizeCloudflareResponse` which depend
 * on the virtual module.
 */
import { sessionKVBindingName, cacheProviderEnabled } from 'virtual:astro-cloudflare:config';
import type { ManifestLike } from './cf-helpers.js';

export type { Runtime, ManifestLike } from './cf-helpers.js';
export {
	matchStaticAsset,
	fallbackToAssets,
	createErrorPageFetch,
	createLocals,
	getClientAddress,
} from './cf-helpers.js';

/**
 * Injects the SESSION KV binding into the app manifest's session config.
 * Idempotent — safe to call on every request.
 */
export function injectSessionBinding(manifest: ManifestLike, env: Env): void {
	if (env[sessionKVBindingName]) {
		const sessionConfigOptions = manifest.sessionConfig?.options ?? {};
		Object.assign(sessionConfigOptions, {
			binding: env[sessionKVBindingName],
		});
	}
}

/**
 * Applies the `Cloudflare-CDN-Cache-Control: no-store` default when the
 * Cloudflare cache provider is configured and the response does not
 * already carry the header. Without this, Cloudflare's Worker cache
 * may cache GET responses for up to 2 hours even when a route sets no
 * cache intent.
 *
 * Returns the original response when no changes are needed, or a
 * rebuilt copy when the original has immutable headers (e.g. responses
 * served from the Workers Cache API).
 */
export function finalizeCloudflareResponse(response: Response): Response {
	if (!cacheProviderEnabled || response.headers.has('Cloudflare-CDN-Cache-Control')) {
		return response;
	}
	try {
		response.headers.set('Cloudflare-CDN-Cache-Control', 'no-store');
		return response;
	} catch {
		// Responses from the Workers Cache API have immutable headers.
		// Rebuild into a mutable Response before setting.
		const rebuilt = new Response(response.body, response);
		rebuilt.headers.set('Cloudflare-CDN-Cache-Control', 'no-store');
		return rebuilt;
	}
}
