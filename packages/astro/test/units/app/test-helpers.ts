// @ts-check

import type { AstroConfig, RouteData, RouteInfo } from '../../../dist/index.js';

export function createManifest({
	routes,
	pageMap,
	base = '/',
	trailingSlash = 'ignore',
	middleware = undefined,
}: {
	routes: Array<any>;
	// eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
	pageMap: Map<string, Function>;
	base?: string;
	trailingSlash?: AstroConfig['trailingSlash'];
	// eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
	middleware?: Function;
}) {
	const rootDir = new URL('file:///astro-test/');
	const buildDir = new URL('file:///astro-test/dist/');

	return /** @type {import('../../../dist/core/app/types.js').SSRManifest} */ ({
		adapterName: 'test-adapter',
		routes,
		site: undefined,
		base,
		userAssetsBase: undefined,
		trailingSlash: /** @type {'always' | 'never' | 'ignore'} */ (trailingSlash),
		buildFormat: /** @type {'directory'} */ ('directory'),
		compressHTML: false,
		assetsPrefix: undefined,
		renderers: [],
		serverLike: true,
		middlewareMode: /** @type {'classic'} */ ('classic'),
		clientDirectives: new Map(),
		entryModules: {},
		inlinedScripts: new Map(),
		assets: new Set(),
		componentMetadata: new Map(),
		pageModule: undefined,
		pageMap,
		serverIslandMappings: undefined,
		key: Promise.resolve(/** @type {CryptoKey} */ ({})),
		i18n: undefined,
		middleware,
		actions: undefined,
		sessionDriver: undefined,
		checkOrigin: false,
		allowedDomains: undefined,
		actionBodySizeLimit: 0,
		sessionConfig: undefined,
		cacheDir: rootDir,
		srcDir: rootDir,
		outDir: buildDir,
		rootDir,
		publicDir: rootDir,
		assetsDir: 'assets',
		buildClientDir: buildDir,
		buildServerDir: buildDir,
		csp: undefined,
		image: {},
		shouldInjectCspMetaTags: false,
		devToolbar: {
			enabled: false,
			latestAstroVersion: undefined,
			debugInfoOutput: undefined,
			placement: undefined,
		},
		internalFetchHeaders: undefined,
		logLevel: /** @type {'silent'} */ ('silent'),
		experimentalQueuedRendering: {
			enabled: false,
		},
	});
}

export function createRouteInfo(routeData: RouteData): RouteInfo {
	return {
		routeData,
		file: routeData.component,
		links: [],
		scripts: [],
		styles: [],
	};
}
