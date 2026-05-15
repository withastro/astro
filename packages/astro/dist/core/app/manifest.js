import { decodeKey } from '../encryption.js';
import { NOOP_MIDDLEWARE_FN } from '../middleware/noop-middleware.js';
function deserializeManifest(serializedManifest, routesList) {
	const routes = [];
	if (serializedManifest.routes) {
		for (const serializedRoute of serializedManifest.routes) {
			routes.push({
				...serializedRoute,
				routeData: deserializeRouteData(serializedRoute.routeData),
			});
			const route = serializedRoute;
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
	const assets = new Set(serializedManifest.assets);
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
		rootDir: new URL(serializedManifest.rootDir),
		srcDir: new URL(serializedManifest.srcDir),
		publicDir: new URL(serializedManifest.publicDir),
		outDir: new URL(serializedManifest.outDir),
		cacheDir: new URL(serializedManifest.cacheDir),
		buildClientDir: new URL(serializedManifest.buildClientDir),
		buildServerDir: new URL(serializedManifest.buildServerDir),
		assets,
		componentMetadata,
		inlinedScripts,
		clientDirectives,
		routes,
		key,
	};
}
function serializeRouteData(routeData, trailingSlash) {
	return {
		...routeData,
		pattern: routeData.pattern.source,
		redirectRoute: routeData.redirectRoute
			? serializeRouteData(routeData.redirectRoute, trailingSlash)
			: void 0,
		fallbackRoutes: routeData.fallbackRoutes.map((fallbackRoute) => {
			return serializeRouteData(fallbackRoute, trailingSlash);
		}),
		_meta: { trailingSlash },
	};
}
function deserializeRouteData(rawRouteData) {
	return {
		route: rawRouteData.route,
		type: rawRouteData.type,
		// nosemgrep: javascript.lang.security.audit.detect-non-literal-regexp.detect-non-literal-regexp
		// This pattern is serialized from Astro's own route manifest.
		pattern: new RegExp(rawRouteData.pattern),
		params: rawRouteData.params,
		component: rawRouteData.component,
		pathname: rawRouteData.pathname || void 0,
		segments: rawRouteData.segments,
		prerender: rawRouteData.prerender,
		redirect: rawRouteData.redirect,
		redirectRoute: rawRouteData.redirectRoute
			? deserializeRouteData(rawRouteData.redirectRoute)
			: void 0,
		fallbackRoutes: rawRouteData.fallbackRoutes.map((fallback) => {
			return deserializeRouteData(fallback);
		}),
		isIndex: rawRouteData.isIndex,
		origin: rawRouteData.origin,
		distURL: rawRouteData.distURL,
	};
}
function serializeRouteInfo(routeInfo, trailingSlash) {
	return {
		styles: routeInfo.styles,
		file: routeInfo.file,
		links: routeInfo.links,
		scripts: routeInfo.scripts,
		routeData: serializeRouteData(routeInfo.routeData, trailingSlash),
	};
}
function deserializeRouteInfo(rawRouteInfo) {
	return {
		styles: rawRouteInfo.styles,
		file: rawRouteInfo.file,
		links: rawRouteInfo.links,
		scripts: rawRouteInfo.scripts,
		routeData: deserializeRouteData(rawRouteInfo.routeData),
	};
}
function queuePoolSize(config) {
	return config?.poolSize ?? 1e3;
}
function queueRenderingEnabled(config) {
	return config?.enabled ?? false;
}
export {
	deserializeManifest,
	deserializeRouteData,
	deserializeRouteInfo,
	queuePoolSize,
	queueRenderingEnabled,
	serializeRouteData,
	serializeRouteInfo,
};
