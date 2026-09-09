/**
 * Pure Cloudflare helpers with no virtual module dependencies.
 * Shared by `handler.ts`, `@astrojs/cloudflare/fetch`, and `@astrojs/cloudflare/hono`.
 * Testable without a Vite build context.
 */
import { getValidatedIpFromHeader } from '@astrojs/internal-helpers/request';

export interface Runtime {
	cfContext: ExecutionContext;
}

/** Minimal manifest shape needed by the Cloudflare helpers. */
export interface ManifestLike {
	assets: Set<string>;
	sessionConfig?: { options?: Record<string, unknown> } | undefined;
}

/**
 * Returns a `Response` from the ASSETS binding if the request pathname
 * is a known static asset. Returns `undefined` otherwise.
 */
export function matchStaticAsset(
	manifest: ManifestLike,
	requestUrl: string,
	env: Env,
): Response | undefined {
	const { pathname } = new URL(requestUrl);
	if (manifest.assets.has(pathname)) {
		return env.ASSETS.fetch(requestUrl.replace(/\.html$/, '')) as unknown as Response;
	}
	return undefined;
}

/**
 * Tries the ASSETS binding as a fallback for an unmatched route.
 * Returns the asset `Response` if found (non-404), `undefined` otherwise.
 */
export async function fallbackToAssets(
	requestUrl: string,
	env: Env,
): Promise<Response | undefined> {
	const asset = await env.ASSETS.fetch(
		requestUrl.replace(/index.html$/, '').replace(/\.html$/, ''),
	);
	if (asset.status !== 404) {
		return asset as unknown as Response;
	}
	return undefined;
}

/**
 * Creates a fetch function for prerendered error pages via the ASSETS binding.
 */
export function createErrorPageFetch(env: Env): (url: string) => Promise<Response> {
	return async (url: string) => {
		return env.ASSETS.fetch(url.replace(/\.html$/, '')) as unknown as Response;
	};
}

/**
 * Creates the Cloudflare-specific locals object with `cfContext`
 * and deprecated `runtime` property getters.
 */
export function createLocals(ctx: ExecutionContext): Runtime {
	const locals: Runtime = {
		cfContext: ctx,
	};
	Object.defineProperty(locals, 'runtime', {
		enumerable: false,
		value: {
			get env(): never {
				throw new Error(
					`Astro.locals.runtime.env has been removed in Astro v6. Use 'import { env } from "cloudflare:workers"' instead.`,
				);
			},
			get cf(): never {
				throw new Error(
					`Astro.locals.runtime.cf has been removed in Astro v6. Use 'Astro.request.cf' instead.`,
				);
			},
			get caches(): never {
				throw new Error(
					`Astro.locals.runtime.caches has been removed in Astro v6. Use the global 'caches' object instead.`,
				);
			},
			get ctx(): never {
				throw new Error(
					`Astro.locals.runtime.ctx has been removed in Astro v6. Use 'Astro.locals.cfContext' instead.`,
				);
			},
		},
	});
	return locals;
}

/**
 * Extracts the client IP address from the `cf-connecting-ip` header.
 */
export function getClientAddress(request: Request): string | undefined {
	return getValidatedIpFromHeader(request.headers.get('cf-connecting-ip'));
}
