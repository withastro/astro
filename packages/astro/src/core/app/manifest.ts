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
 * Returns the directory that contains the server entry, or `undefined` when the entry URL
 * cannot act as a base. Opaque URLs such as `blob:` or `data:` parse successfully but throw
 * when a relative URL resolves against them, which happens on runtimes like workerd.
 */
function getServerBaseUrl(serverEntryUrl?: string): URL | undefined {
	if (!serverEntryUrl) return undefined;
	try {
		return new URL('./', serverEntryUrl);
	} catch {
		return undefined;
	}
}

/**
 * When `serverEntryUrl` is provided, relative directory paths in the manifest resolve
 * against it so the build output can run from any location.
 */
export function deserializeManifest(
	serializedManifest: SerializedSSRManifest,
	routesList?: RoutesList,
	serverEntryUrl?: string,
): SSRManifest {
	const serverBaseUrl = getServerBaseUrl(serverEntryUrl);
	const resolveDir = (relativePath: string): URL => {
		if (serverBaseUrl) {
			return new URL(relativePath, serverBaseUrl);
		}
		if (URL.canParse(relativePath)) {
			return new URL(relativePath);
		}
		// Non-filesystem runtimes such as Cloudflare Workers don't read these paths.
		return new URL('file:///');
	};

	const routes: RouteInfo[] = [];
	if (serializedManifest.routes) {
		for (const serializedRoute of serializedManifest.routes) {
			routes.push({
				...serializedRoute,
				routeData: deserializeRouteData(serializedRoute.routeData),
			});
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
