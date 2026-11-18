/**
 * Shared Cloudflare helpers used by `handler.ts` (the `handle()` entrypoint),
 * `@astrojs/cloudflare/fetch`, and `@astrojs/cloudflare/hono`.
 *
 * Re-exports all pure helpers from `cf-helpers.ts` and adds
 * `injectSessionBinding` which depends on the virtual module.
 */
import { sessionKVBindingName } from 'virtual:astro-cloudflare:config';
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
