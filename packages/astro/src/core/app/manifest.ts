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
 * Resolves a specifier that carries a build-machine absolute path prefix to the manifest key it
 * refers to.
 *
 * Integration releases published before the portable manifest key format embed absolute
 * component paths, while the manifest stores keys relative to the project root, so an exact
 * lookup misses. This trims leading path segments from the specifier until a key matches.
 *
 * TODO(v8): remove this compatibility helper once integrations that emit `moduleId` and island
 * component paths all emit root-relative paths. See withastro/astro#18323.
 */
export function resolvePortableKey(
	has: (key: string) => boolean,
	specifier: string,
): string | undefined {
	const normalized = specifier.replaceAll('\\', '/');
	// Strip a Windows drive prefix such as `C:` so the walk starts at the path root.
	const start = /^[A-Za-z]:/.test(normalized) ? 2 : 0;
	if (normalized[start] !== '/') {
		return undefined;
	}
	let candidate = normalized.slice(start);
	while (candidate.length > 1) {
		const slash = candidate.indexOf('/', 1);
		if (slash === -1) {
			return undefined;
		}
		candidate = candidate.slice(slash);
		if (has(candidate)) {
			return candidate;
		}
	}
	return undefined;
}

/**
 * Wraps `entryModules` so a lookup by an absolute specifier from an older integration falls back
 * to the root-relative key. See {@link resolvePortableKey}.
 *
 * TODO(v8): remove this compatibility wrapper alongside `resolvePortableKey`.
 */
function createPortableEntryModules(entryModules: Record<string, string>): Record<string, string> {
	return new Proxy(entryModules, {
		get(target, property, receiver) {
			if (typeof property === 'string' && !Reflect.has(target, property)) {
				const found = resolvePortableKey((key) => Reflect.has(target, key), property);
				if (found !== undefined) {
					return Reflect.get(target, found, receiver);
				}
			}
			return Reflect.get(target, property, receiver);
		},
		has(target, property) {
			if (typeof property === 'string' && !Reflect.has(target, property)) {
				return resolvePortableKey((key) => Reflect.has(target, key), property) !== undefined;
			}
			return Reflect.has(target, property);
		},
	});
}

/**
 * A `Map` whose lookups fall back to the root-relative key when queried with an absolute
 * specifier from an older integration. See {@link resolvePortableKey}.
 *
 * TODO(v8): remove this compatibility class alongside `resolvePortableKey`.
 */
class PortableKeyedMap<Value> extends Map<string, Value> {
	override get(key: string): Value | undefined {
		const direct = super.get(key);
		if (direct !== undefined) {
			return direct;
		}
		const found = resolvePortableKey((candidate) => super.has(candidate), key);
		return found === undefined ? undefined : super.get(found);
	}

	override has(key: string): boolean {
		return (
			super.has(key) || resolvePortableKey((candidate) => super.has(candidate), key) !== undefined
		);
	}
}

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

/** Parses an absolute URL string, returning `undefined` when it is missing or not absolute. */
function parseAbsoluteDir(href?: string): URL | undefined {
	if (!href || !URL.canParse(href)) return undefined;
	return new URL(href);
}

/**
 * When `serverEntryUrl` is provided, relative directory paths in the manifest resolve
 * against it so the build output can run from any location. When the entry URL cannot act
 * as a base, the build-time absolute server directory recorded in the manifest serves as a
 * fallback so the resolved directories keep their configured values on runtimes such as
 * workerd.
 */
export function deserializeManifest(
	serializedManifest: SerializedSSRManifest,
	routesList?: RoutesList,
	serverEntryUrl?: string,
): SSRManifest {
	const serverBaseUrl =
		getServerBaseUrl(serverEntryUrl) ?? parseAbsoluteDir(serializedManifest.absoluteServerDir);
	const resolveDir = (relativePath: string): URL => {
		if (serverBaseUrl) {
			return new URL(relativePath, serverBaseUrl);
		}
		if (URL.canParse(relativePath)) {
			return new URL(relativePath);
		}
		// Older manifests don't record `absoluteServerDir`. Non-filesystem runtimes such as
		// Cloudflare Workers don't read these paths anyway.
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
	const entryModules = createPortableEntryModules(serializedManifest.entryModules);
	const componentMetadata = new PortableKeyedMap(serializedManifest.componentMetadata);
	const inlinedScripts = new PortableKeyedMap(serializedManifest.inlinedScripts);
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
		entryModules,
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
