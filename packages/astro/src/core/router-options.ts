import type nodeFs from 'node:fs';
import { fileURLToPath } from 'node:url';
import type { RouterPluginOptions } from '@astrojs/vite-plugin-router';
import type { SSRManifestCSP } from '@astrojs/vite-plugin-router/_internal/core/app/types.js';
import { partitionByKind } from '@astrojs/vite-plugin-router/_internal/core/csp/runtime.js';
import type { ServerIslandsState } from '@astrojs/vite-plugin-router/_internal/core/server-islands/shared-state.js';
import type { RouterPluginCli } from '@astrojs/vite-plugin-router/_internal/cli.js';
import type { ManifestHostFields } from '@astrojs/vite-plugin-router/_internal/manifest/serialized.js';
import { MissingMiddlewareForInternationalization } from '@astrojs/runtime/_internal/core/errors/errors-data.js';
import { AstroError } from '@astrojs/runtime/_internal/core/errors/index.js';
import { isRunnableDevEnvironment } from 'vite';
import { kickOffContentConfigLoad } from '../content/config-prewarm.js';
import { runHookRouteSetup } from '../integrations/hooks.js';
import { resolveMiddlewareMode } from '../integrations/adapter-utils.js';
import { createDevHeadElements } from '../toolbar/dev-head-elements.js';
import type { AstroSettings, RoutesList } from '../types/astro.js';
import { ASTRO_VITE_ENVIRONMENT_NAMES } from './constants.js';
import {
	getAlgorithm,
	getDirectives,
	getScriptHashes,
	getScriptResources,
	getStrictDynamic,
	getStyleHashes,
	getStyleResources,
	shouldTrackCspHashes,
} from './csp/common.js';
import { warnMissingAdapter } from './dev/adapter-validation.js';
import type { AstroLogger } from './logger/core.js';
import { VIRTUAL_LOGGER_ID } from './logger/vite-plugin.js';
import { toServerOutputOptions } from './router-config.js';
import { createRoutesList } from './routing/create-manifest.js';
import { isEndpoint, isPage } from './util.js';

/** The `router()` options of an Astro project. */
export function toRouterOptions(settings: AstroSettings): RouterPluginOptions {
	const { config } = settings;
	return {
		srcDir: fileURLToPath(config.srcDir),
		output: config.output,
		build: {
			format: config.build.format,
			assets: config.build.assets,
			serverEntry: config.build.serverEntry,
			redirects: config.build.redirects,
			inlineStylesheets: config.build.inlineStylesheets,
			concurrency: config.build.concurrency,
		},
		redirects: config.redirects,
		security: {
			checkOrigin: config.security.checkOrigin,
			allowedDomains: config.security.allowedDomains,
			serverIslandBodySizeLimit: config.security.serverIslandBodySizeLimit,
		},
		serverOutput: settings.adapter ? toServerOutputOptions(settings) : undefined,
	};
}

/** What the `astro` CLI passes to `router()` besides its options. */
export function toRouterCli(
	settings: AstroSettings,
	{
		logger,
		command,
		sync,
		fs,
		routesList,
		serverIslandsState,
		cssContentCache,
	}: {
		logger: AstroLogger;
		command: 'dev' | 'build';
		sync: boolean;
		fs: typeof nodeFs;
		routesList: RoutesList;
		serverIslandsState: ServerIslandsState;
		cssContentCache: Map<string, string>;
	},
): RouterPluginCli {
	const { config } = settings;
	return {
		logger,
		command,
		sync,
		routesList,
		config: {
			base: config.base,
			outDir: config.outDir,
			cacheDir: config.cacheDir,
			serverHeaders: config.server.headers,
			build: {
				client: config.build.client,
				server: config.build.server,
				assetsPrefix: config.build.assetsPrefix,
			},
			pageExtensions: settings.pageExtensions,
		},
		// Projects that depend only on `astro` cannot resolve the router package from their root.
		transitionsModuleIds: {
			transitions: 'astro/virtual-modules/transitions.js',
			clientRouter: 'astro/components/ClientRouter.astro',
			router: 'astro/virtual-modules/transitions-router.js',
			types: 'astro/virtual-modules/transitions-types.js',
			events: 'astro/virtual-modules/transitions-events.js',
			swapFunctions: 'astro/virtual-modules/transitions-swap-functions.js',
		},
		createRoutes: ({ pageExtensions, ...registrations }) => {
			// Every reader of `settings.pageExtensions` sees the registered extensions, like
			// integration `addPageExtension()` calls.
			for (const extension of pageExtensions) {
				if (!settings.pageExtensions.includes(extension)) settings.pageExtensions.push(extension);
			}
			return createRoutesList({ settings, fsMod: fs, ...registrations }, logger, {
				dev: command === 'dev',
			});
		},
		isRouteFile: (file) => isPage(file, settings) || isEndpoint(file, settings),
		isPage: (file) => isPage(file, settings),
		onRouteSetup: async (route) => {
			await runHookRouteSetup({ route, settings, logger });
			if (!route.prerender) settings.buildOutput = 'server';
			warnMissingAdapter(logger, settings);
		},
		headInlineScripts: () =>
			settings.scripts.flatMap((script) =>
				script.stage === 'head-inline' ? [script.content] : [],
			),
		manifestHostFields: () => getManifestHostFields(settings),
		loggerModuleId: () => (config.logger ? VIRTUAL_LOGGER_ID : undefined),
		validateMiddleware({ userMiddlewareIsPresent }) {
			if (!userMiddlewareIsPresent && config.i18n?.routing === 'manual') {
				throw new AstroError(MissingMiddlewareForInternationalization);
			}
		},
		serverIslandsState,
		canRenderOnDemand: () => Boolean(settings.adapter),
		fetchFile: config.fetchFile,
		renderers: settings.renderers,
		headElements: createDevHeadElements(settings),
		prepareDevServer: (server) => {
			const environment = server.environments[ASTRO_VITE_ENVIRONMENT_NAMES.astro];
			return isRunnableDevEnvironment(environment)
				? kickOffContentConfigLoad({ settings, fs, logger, environment })
				: Promise.resolve();
		},
		cssContentCache,
	};
}

function createCspManifest(settings: AstroSettings): SSRManifestCSP | undefined {
	const cspConfig = settings.config.security.csp;
	if (!shouldTrackCspHashes(cspConfig)) return undefined;
	const scriptDirective = {
		resources: getScriptResources(cspConfig),
		hashes: getScriptHashes(cspConfig),
		strictDynamic: getStrictDynamic(cspConfig),
	};
	const styleDirective = {
		resources: getStyleResources(cspConfig),
		hashes: getStyleHashes(cspConfig),
	};
	// Derive the deprecated flat fields from the `default`-kind entries for back-compat.
	const scriptDefault = partitionByKind(scriptDirective).default;
	const styleDefault = partitionByKind(styleDirective).default;
	return {
		cspDestination: settings.adapter?.adapterFeatures?.staticHeaders ? 'adapter' : undefined,
		algorithm: getAlgorithm(cspConfig),
		directives: getDirectives(settings),
		scriptHashes: scriptDefault.hashes,
		scriptResources: scriptDefault.resources,
		isStrictDynamic: scriptDirective.strictDynamic,
		styleHashes: styleDefault.hashes,
		styleResources: styleDefault.resources,
		scriptDirective,
		styleDirective,
	};
}

/** The serialized manifest fields that come from an Astro project's adapter and features. */
export async function getManifestHostFields(settings: AstroSettings): Promise<ManifestHostFields> {
	return {
		serverLike: settings.buildOutput === 'server',
		middlewareMode: resolveMiddlewareMode(settings.adapter?.adapterFeatures),
		adapterName: settings?.adapter?.name ?? '',
		clientDirectives: Array.from(settings.clientDirectives.entries()),
		userAssetsBase: settings.config?.vite?.base,
		csp: createCspManifest(settings),
		devToolbar: {
			enabled:
				settings.config.devToolbar.enabled &&
				(await settings.preferences.get('devToolbar.enabled')),
			latestAstroVersion: settings.latestAstroVersion,
			debugInfoOutput: '',
			placement: settings.config.devToolbar.placement,
		},
		logLevel: settings.logLevel,
	};
}
