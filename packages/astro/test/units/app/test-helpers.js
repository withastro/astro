// @ts-check

export function createManifest({ routes, pageMap, base = '/', trailingSlash = 'ignore' } = {}) {
	const rootDir = new URL('file:///astro-test/');
	const buildDir = new URL('file:///astro-test/dist/');

	return {
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
		middleware: undefined,
		actions: undefined,
		sessionDriver: undefined,
		checkOrigin: false,
		allowedDomains: undefined,
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
	};
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
