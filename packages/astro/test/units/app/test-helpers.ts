import type {
	SSRManifest,
	SSRManifestI18n,
	SSRManifestCSP,
	RouteInfo,
} from '../../../dist/core/app/types.js';
import type { RouteData } from '../../../dist/types/public/internal.js';

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
}: {
	routes?: RouteInfo[];
	pageMap?: SSRManifest['pageMap'];
	base?: string;
	trailingSlash?: 'always' | 'never' | 'ignore';
	middleware?: SSRManifest['middleware'];
	actions?: SSRManifest['actions'];
	actionBodySizeLimit?: number;
	i18n?: SSRManifestI18n;
	csp?: SSRManifestCSP;
	serverLike?: boolean;
} = {}): SSRManifest {
	const rootDir = new URL('file:///astro-test/');
	const buildDir = new URL('file:///astro-test/dist/');

	return {
		adapterName: 'test-adapter',
		routes,
		site: undefined,
		base,
		userAssetsBase: undefined,
		trailingSlash,
		buildFormat: 'directory',
		compressHTML: false,
		assetsPrefix: undefined,
		renderers: [],
		serverLike,
		middlewareMode: 'classic',
		clientDirectives: new Map(),
		entryModules: {},
		inlinedScripts: new Map(),
		assets: new Set(),
		componentMetadata: new Map(),
		pageModule: undefined,
		pageMap,
		serverIslandMappings: undefined,
		key: Promise.resolve({} as CryptoKey),
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
		logLevel: 'silent',
		experimentalQueuedRendering: {
			enabled: false,
		},
	} as SSRManifest;
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
