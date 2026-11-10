import type {
	SSRManifest,
	SSRManifestI18n,
	SSRManifestCSP,
	RouteInfo,
} from '../../../dist/core/app/types.js';
import type { RouteData } from '../../../dist/types/public/internal.js';
import type { PipelineModule } from '@astrojs/vite-plugin-router';
import actionsHandler from '../../../dist/actions/fetch-handler.js';
import callActionExtension from '../../../dist/actions/context/call-action.js';
import getActionResultExtension from '../../../dist/actions/context/get-action-result.js';
import currentLocaleExtension from '../../../dist/core/i18n/context/current-locale.js';
import preferredLocaleExtension from '../../../dist/core/i18n/context/preferred-locale.js';
import preferredLocaleListExtension from '../../../dist/core/i18n/context/preferred-locale-list.js';
import cacheHandler from '../../../dist/core/cache/fetch-handler.js';
import cacheExtension from '../../../dist/core/cache/render-context.js';
import i18nHandler from '../../../dist/core/i18n/fetch-handler.js';
import i18nRouting from '../../../dist/core/i18n/routing-extension.js';
import sessionsHandler from '../../../dist/core/session/fetch-handler.js';
import sessionExtension from '../../../dist/core/session/render-context.js';

/**
 * The pipeline Astro registers through `api.astroRouter` (see `core/router-registrations.ts`),
 * with every handler included: each one passes through when its feature is not configured.
 */
const astroPipeline: PipelineModule = {
	fetchHandlers: [
		{ name: 'sessions', order: 'pre', handler: sessionsHandler },
		{ name: 'cache', order: 'pre', handler: cacheHandler },
		{ name: 'i18n', order: 'pre', handler: i18nHandler },
		{ name: 'actions', order: 'post', handler: actionsHandler },
	],
	renderContextExtensions: [
		{ key: 'session', extension: sessionExtension },
		{ key: 'cache', extension: cacheExtension },
		{ key: 'currentLocale', extension: currentLocaleExtension },
		{ key: 'preferredLocale', extension: preferredLocaleExtension },
		{ key: 'preferredLocaleList', extension: preferredLocaleListExtension },
		{ key: 'getActionResult', extension: getActionResultExtension },
		{ key: 'callAction', extension: callActionExtension },
	],
};

export function createManifest({
	routes,
	pageMap,
	base = '/',
	trailingSlash = 'ignore',
	middleware = undefined,
	logger = undefined,
	actions = undefined,
	actionBodySizeLimit = 1024 * 1024,
	i18n = undefined,
	csp = undefined,
	serverLike = true,
	...overrides
}: {
	routes?: RouteInfo[];
	pageMap?: SSRManifest['pageMap'];
	base?: string;
	trailingSlash?: 'always' | 'never' | 'ignore';
	middleware?: SSRManifest['middleware'];
	logger?: SSRManifest['logger'];
	actions?: SSRManifest['actions'];
	actionBodySizeLimit?: number;
	i18n?: SSRManifestI18n;
	csp?: SSRManifestCSP;
	serverLike?: boolean;
} & Partial<SSRManifest> = {}): SSRManifest {
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
		routing: i18n ? [i18nRouting] : undefined,
		middleware,
		logger,
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
		pipeline: () => astroPipeline,
		experimentalQueuedRendering: {
			enabled: false,
		},
		...overrides,
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
