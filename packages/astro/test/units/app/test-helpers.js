// @ts-check

/**
 * @param {object} [options]
 * @param {any[]} [options.routes]
 * @param {Map<string, Function>} [options.pageMap]
 * @param {string} [options.base]
 * @param {string} [options.trailingSlash]
 * @param {Function} [options.middleware]
 * @param {Function} [options.actions]
 * @param {number} [options.actionBodySizeLimit]
 * @param {object} [options.i18n]
 */
export function createManifest({
	routes,
	pageMap,
	base = '/',
	trailingSlash = 'ignore',
	middleware = undefined,
	actions = undefined,
	actionBodySizeLimit = 0,
	i18n = undefined,
	csp = undefined,
	serverLike = true,
} = {}) {
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
		serverLike,
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
		i18n,
		middleware,
		actions,
		sessionDriver: undefined,
		checkOrigin: false,
		allowedDomains: undefined,
		actionBodySizeLimit,
		serverIslandBodySizeLimit: 1024 * 1024,
		sessionConfig: undefined,
		cacheDir: rootDir,
		srcDir: rootDir,
		outDir: buildDir,
		rootDir,
		publicDir: rootDir,
		assetsDir: 'assets',
		buildClientDir: buildDir,
		buildServerDir: buildDir,
		csp,
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

export function createRouteInfo(routeData) {
	return {
		routeData,
		file: routeData.component,
		links: [],
		scripts: [],
		styles: [],
	};
}
