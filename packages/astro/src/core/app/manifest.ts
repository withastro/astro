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

const WINDOWS_DRIVE_PATH_RE = /^[A-Za-z]:[\\/]/;
const WINDOWS_UNC_PATH_RE = /^\\\\[^\\]/;

const SERIALIZED_DIRECTORY_FIELDS = [
	'rootDir',
	'srcDir',
	'publicDir',
	'outDir',
	'cacheDir',
	'buildClientDir',
	'buildServerDir',
] as const;

type SerializedDirectoryField = (typeof SERIALIZED_DIRECTORY_FIELDS)[number];

function toFileDirectoryURL(serializedDirectory: string): URL {
	const normalizedDirectory = serializedDirectory.replace(/\\/g, '/');
	const directoryWithTrailingSlash = normalizedDirectory.endsWith('/')
		? normalizedDirectory
		: `${normalizedDirectory}/`;

	if (WINDOWS_DRIVE_PATH_RE.test(serializedDirectory)) {
		return new URL(`file:///${encodeURI(directoryWithTrailingSlash)}`);
	}

	if (WINDOWS_UNC_PATH_RE.test(serializedDirectory)) {
		return new URL(`file:${encodeURI(directoryWithTrailingSlash)}`);
	}

	return new URL(`file://${encodeURI(directoryWithTrailingSlash)}`);
}

function deserializeDirectoryPath(serializedDirectory: string): URL {
	if (serializedDirectory.startsWith('file:')) {
		return new URL(serializedDirectory);
	}

	if (
		serializedDirectory.startsWith('/') ||
		WINDOWS_DRIVE_PATH_RE.test(serializedDirectory) ||
		WINDOWS_UNC_PATH_RE.test(serializedDirectory)
	) {
		return toFileDirectoryURL(serializedDirectory);
	}

	return new URL(serializedDirectory);
}

function getSerializedDirectoryPath(
	serializedManifest: SerializedSSRManifest,
	fieldName: SerializedDirectoryField,
): string {
	const serializedDirectory = serializedManifest[fieldName];

	if (typeof serializedDirectory === 'string') {
		return serializedDirectory;
	}

	const manifestType =
		serializedManifest === null ? 'null' : Array.isArray(serializedManifest) ? 'array' : typeof serializedManifest;
	const manifestValue =
		manifestType === 'string'
			? ` Manifest value: ${JSON.stringify(serializedManifest)}.`
			: '';
	throw new TypeError(
		`Expected virtual:astro:manifest.${fieldName} to be a string, received ${typeof serializedDirectory}. Manifest type: ${manifestType}.${manifestValue}`,
	);
}

export function deserializeManifest(
	serializedManifest: SerializedSSRManifest,
	routesList?: RoutesList,
): SSRManifest {
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
		rootDir: deserializeDirectoryPath(getSerializedDirectoryPath(serializedManifest, 'rootDir')),
		srcDir: deserializeDirectoryPath(getSerializedDirectoryPath(serializedManifest, 'srcDir')),
		publicDir: deserializeDirectoryPath(getSerializedDirectoryPath(serializedManifest, 'publicDir')),
		outDir: deserializeDirectoryPath(getSerializedDirectoryPath(serializedManifest, 'outDir')),
		cacheDir: deserializeDirectoryPath(getSerializedDirectoryPath(serializedManifest, 'cacheDir')),
		buildClientDir: deserializeDirectoryPath(
			getSerializedDirectoryPath(serializedManifest, 'buildClientDir'),
		),
		buildServerDir: deserializeDirectoryPath(
			getSerializedDirectoryPath(serializedManifest, 'buildServerDir'),
		),
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
