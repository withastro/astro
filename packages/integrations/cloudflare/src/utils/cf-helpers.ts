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

/** The page a URL points to once `html_handling` adds or removes a trailing slash, `index` or `.html`. */
function assetPath(url: URL): string {
	return url.pathname.replace(/\/(?:index(?:\.html)?)?$|\.html$/, '');
}

/**
 * Fetches from the ASSETS binding without following `_redirects` rules, which the binding matches by path alone, so a
 * rule like `/login https://app.example.com/login` would loop. Redirects between URLs of the same page are followed.
 */
async function fetchAsset(url: string, env: Env): Promise<Response> {
	const response = (await env.ASSETS.fetch(url, { redirect: 'manual' })) as unknown as Response;
	const location = response.headers.get('location');
	if (!location || response.status < 300 || response.status >= 400) {
		return response;
	}
	const from = new URL(url);
	const to = new URL(location, from);
	if (to.origin === from.origin && to.search === from.search && assetPath(to) === assetPath(from)) {
		return (await env.ASSETS.fetch(to.href, { redirect: 'manual' })) as unknown as Response;
	}
	return response;
}

/**
 * Tries the ASSETS binding as a fallback for an unmatched route.
 * Returns the asset `Response` if found (non-404), `undefined` otherwise.
 */
export async function fallbackToAssets(
	requestUrl: string,
	env: Env,
): Promise<Response | undefined> {
	const asset = await fetchAsset(requestUrl.replace(/index.html$/, '').replace(/\.html$/, ''), env);
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
