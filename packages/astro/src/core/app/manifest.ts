import type { SerializedRouteData } from '../../types/astro.js';
import type { AstroConfig, RouteData } from '../../types/public/index.js';
import type { RoutesList } from '../../types/astro.js';
import { decodeKey } from '../encryption.js';
import { NOOP_MIDDLEWARE_FN } from '../middleware/noop-middleware.js';
import type {
	RouteInfo,
	SerializedSSRManifest,
	SSRManifest,
	SerializedRouteInfo,
} from './types.js';

export type { SerializedRouteData } from '../../types/astro.js';

/**
 * Deserializes a serialized SSR manifest back into the runtime SSRManifest type.
 *
 * Directory paths in the manifest are stored as relative paths from the server
 * entry directory for portability. The `serverEntryUrl` parameter (typically
 * `import.meta.url` of the server entry) is used as the base to resolve these
 * relative paths back into absolute `file://` URLs at runtime. This allows the
 * built output to be moved to any location and still work correctly.
 */
export function deserializeManifest(
	serializedManifest: SerializedSSRManifest,
	serverEntryUrl?: string | RoutesList,
	routesList?: RoutesList,
): SSRManifest {
	// Support both (manifest, url, routesList) and legacy (manifest, routesList) signatures
	if (serverEntryUrl && typeof serverEntryUrl !== 'string') {
		routesList = serverEntryUrl;
		serverEntryUrl = undefined;
	}

	// Resolve relative directory paths against the server entry's actual location.
	// In production, serverEntryUrl is import.meta.url of the SSR entry (e.g.,
	// file:///deployed/app/dist/server/entry.mjs). We use its parent directory
	// as the base for resolution, since all relative paths in the manifest are
	// expressed relative to buildServerDir.
	//
	// On runtimes where import.meta.url is not a parseable URL (e.g., Cloudflare
	// Workers/workerd), serverBaseUrl stays undefined and resolveDir falls back to
	// treating each path as an absolute URL or a dummy — those runtimes don't use
	// filesystem paths from the manifest.
	const serverBaseUrl =
		serverEntryUrl && URL.canParse(serverEntryUrl)
			? new URL('./', serverEntryUrl)
			: undefined;
	const resolveDir = (relativePath: string): URL => {
		if (serverBaseUrl) {
			return new URL(relativePath, serverBaseUrl);
		}
		// Dev mode: paths are already absolute file:// URLs.
		// Non-filesystem runtimes (Cloudflare Workers): paths are relative but
		// unused — return a dummy URL so deserialization doesn't throw.
		if (URL.canParse(relativePath)) {
			return new URL(relativePath);
		}
		return new URL('file:///');
	};

	const routes: RouteInfo[] = [];
	if (serializedManifest.routes) {
		for (const serializedRoute of serializedManifest.routes) {
			routes.push({
				...serializedRoute,
				routeData: deserializeRouteData(serializedRoute.routeData),
			});

			const route = serializedRoute as unknown as RouteInfo;
			route.routeData = deserializeRouteData(serializedRoute.routeData);
		}
	}
	if (routesList) {
		for (const route of routesList?.routes) {
			routes.push({
				file: '',
				links: [],
				scripts: [],
				styles: [],
				routeData: route,
			});
		}
	}
	const assets = new Set<string>(serializedManifest.assets);
	const componentMetadata = new Map(serializedManifest.componentMetadata);
	const inlinedScripts = new Map(serializedManifest.inlinedScripts);
	const clientDirectives = new Map(serializedManifest.clientDirectives);
	const key = decodeKey(serializedManifest.key);

	return {
		// in case user middleware exists, this no-op middleware will be reassigned (see plugin-ssr.ts)
		middleware() {
			return { onRequest: NOOP_MIDDLEWARE_FN };
		},

		...serializedManifest,
		rootDir: resolveDir(serializedManifest.rootDir),
		srcDir: resolveDir(serializedManifest.srcDir),
		publicDir: resolveDir(serializedManifest.publicDir),
		outDir: resolveDir(serializedManifest.outDir),
		cacheDir: resolveDir(serializedManifest.cacheDir),
		buildClientDir: resolveDir(serializedManifest.buildClientDir),
		buildServerDir: resolveDir(serializedManifest.buildServerDir),
		assets,
		componentMetadata,
		inlinedScripts,
		clientDirectives,
		routes,
		key,
	};
}

export function serializeRouteData(
	routeData: RouteData,
	trailingSlash: AstroConfig['trailingSlash'],
): SerializedRouteData {
	return {
		...routeData,
		pattern: routeData.pattern.source,
		redirectRoute: routeData.redirectRoute
			? serializeRouteData(routeData.redirectRoute, trailingSlash)
			: undefined,
		fallbackRoutes: routeData.fallbackRoutes.map((fallbackRoute) => {
			return serializeRouteData(fallbackRoute, trailingSlash);
		}),
		_meta: { trailingSlash },
	};
}

export function deserializeRouteData(rawRouteData: SerializedRouteData): RouteData {
	return {
		route: rawRouteData.route,
		type: rawRouteData.type,
		// nosemgrep: javascript.lang.security.audit.detect-non-literal-regexp.detect-non-literal-regexp
		// This pattern is serialized from Astro's own route manifest.
		pattern: new RegExp(rawRouteData.pattern),
		params: rawRouteData.params,
		component: rawRouteData.component,
		pathname: rawRouteData.pathname || undefined,
		segments: rawRouteData.segments,
		prerender: rawRouteData.prerender,
		redirect: rawRouteData.redirect,
		redirectRoute: rawRouteData.redirectRoute
			? deserializeRouteData(rawRouteData.redirectRoute)
			: undefined,
		fallbackRoutes: rawRouteData.fallbackRoutes.map((fallback) => {
			return deserializeRouteData(fallback);
		}),
		isIndex: rawRouteData.isIndex,
		origin: rawRouteData.origin,
		distURL: rawRouteData.distURL,
	};
}

export function serializeRouteInfo(
	routeInfo: RouteInfo,
	trailingSlash: AstroConfig['trailingSlash'],
): SerializedRouteInfo {
	return {
		styles: routeInfo.styles,
		file: routeInfo.file,
		links: routeInfo.links,
		scripts: routeInfo.scripts,
		routeData: serializeRouteData(routeInfo.routeData, trailingSlash),
	};
}

export function deserializeRouteInfo(rawRouteInfo: SerializedRouteInfo): RouteInfo {
	return {
		styles: rawRouteInfo.styles,
		file: rawRouteInfo.file,
		links: rawRouteInfo.links,
		scripts: rawRouteInfo.scripts,
		routeData: deserializeRouteData(rawRouteInfo.routeData),
	};
}

export function queuePoolSize(
	config: NonNullable<SSRManifest['experimentalQueuedRendering']>,
): number {
	return config?.poolSize ?? 1000;
}
export function queueRenderingEnabled(config: SSRManifest['experimentalQueuedRendering']): boolean {
	return config?.enabled ?? false;
}
