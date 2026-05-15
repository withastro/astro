import nodeFs from 'node:fs';
import { fileURLToPath } from 'node:url';
import * as vite from 'vite';
import { crawlFrameworkPkgs } from 'vitefu';
import { vitePluginActions } from '../actions/vite-plugin-actions.js';
import { getAssetsPrefix } from '../assets/utils/getAssetsPrefix.js';
import astroAssetsPlugin from '../assets/vite-plugin-assets.js';
import astroContainer from '../container/vite-plugin-container.js';
import {
	astroContentAssetPropagationPlugin,
	astroContentImportPlugin,
	astroContentVirtualModPlugin,
} from '../content/index.js';
import { createEnvLoader } from '../env/env-loader.js';
import { validateEnvPrefixAgainstSchema } from '../env/validators.js';
import { astroEnv } from '../env/vite-plugin-env.js';
import { importMetaEnv } from '../env/vite-plugin-import-meta-env.js';
import astroInternationalization from '../i18n/vite-plugin-i18n.js';
import { serializedManifestPlugin } from '../manifest/serialized.js';
import astroVirtualManifestPlugin from '../manifest/virtual-module.js';
import astroPrefetch from '../prefetch/vite-plugin-prefetch.js';
import astroDevToolbar from '../toolbar/vite-plugin-dev-toolbar.js';
import astroTransitions from '../transitions/vite-plugin-transitions.js';
import { vitePluginAdapterConfig } from '../vite-plugin-adapter-config/index.js';
import { vitePluginApp } from '../vite-plugin-app/index.js';
import { vitePluginFetchable } from './fetch/vite-plugin.js';
import astroVitePlugin from '../vite-plugin-astro/index.js';
import { vitePluginAstroServer } from '../vite-plugin-astro-server/index.js';
import configAliasVitePlugin from '../vite-plugin-config-alias/index.js';
import { astroDevCssPlugin } from '../vite-plugin-css/index.js';
import vitePluginFileURL from '../vite-plugin-fileurl/index.js';
import astroHeadPlugin from '../vite-plugin-head/index.js';
import astroHmrReloadPlugin from '../vite-plugin-hmr-reload/index.js';
import htmlVitePlugin from '../vite-plugin-html/index.js';
import astroIntegrationsContainerPlugin from '../vite-plugin-integrations-container/index.js';
import astroLoadFallbackPlugin from '../vite-plugin-load-fallback/index.js';
import markdownVitePlugin from '../vite-plugin-markdown/index.js';
import { pluginPage, pluginPages } from '../vite-plugin-pages/index.js';
import vitePluginRenderers from '../vite-plugin-renderers/index.js';
import astroPluginRoutes from '../vite-plugin-routes/index.js';
import vitePluginStaticPaths from '../vite-plugin-static-paths/index.js';
import astroScriptsPlugin from '../vite-plugin-scripts/index.js';
import astroScriptsPageSSRPlugin from '../vite-plugin-scripts/page-ssr.js';
import { createViteLogger } from './logger/vite.js';
import { vitePluginMiddleware } from './middleware/vite-plugin.js';
import { joinPaths } from './path.js';
import { ServerIslandsState } from './server-islands/shared-state.js';
import { vitePluginServerIslands } from './server-islands/vite-plugin-server-islands.js';
import { vitePluginCacheProvider } from './cache/vite-plugin.js';
import { vitePluginSessionDriver } from './session/vite-plugin.js';
import { isObject } from './util-runtime.js';
import { vitePluginEnvironment } from '../vite-plugin-environment/index.js';
import { ASTRO_VITE_ENVIRONMENT_NAMES } from './constants.js';
import { vitePluginChromedevtools } from '../vite-plugin-chromedevtools/index.js';
import { vitePluginAstroServerClient } from '../vite-plugin-overlay/index.js';
const _crawlCache = /* @__PURE__ */ new Map();
function cloneCrawlResult(result) {
	return {
		optimizeDeps: {
			include: [...result.optimizeDeps.include],
			exclude: [...result.optimizeDeps.exclude],
		},
		ssr: {
			noExternal: [...result.ssr.noExternal],
			external: [...result.ssr.external],
		},
	};
}
function clearCrawlCache() {
	_crawlCache.clear();
}
async function createVite(
	commandConfig,
	{ settings, logger, mode, command, fs = nodeFs, sync, routesList },
) {
	const root = fileURLToPath(settings.config.root);
	const isBuild = command === 'build';
	const crawlCacheKey = `${root}:${isBuild}`;
	let astroPkgsConfig = _crawlCache.get(crawlCacheKey);
	if (!astroPkgsConfig) {
		astroPkgsConfig = await crawlFrameworkPkgs({
			root,
			isBuild,
			viteUserConfig: settings.config.vite,
			isFrameworkPkgByJson(pkgJson) {
				if (pkgJson?.astro?.external === true) {
					return false;
				}
				return (
					// Attempt: package relies on `astro`. ✅ Definitely an Astro package
					pkgJson.peerDependencies?.astro ||
					pkgJson.dependencies?.astro || // Attempt: package is tagged with `astro` or `astro-component`. ✅ Likely a community package
					pkgJson.keywords?.includes('astro') ||
					pkgJson.keywords?.includes('astro-component') || // Attempt: package is named `astro-something` or `@scope/astro-something`. ✅ Likely a community package
					/^(?:@[^/]+\/)?astro-/.test(pkgJson.name)
				);
			},
			isFrameworkPkgByName(pkgName) {
				const isNotAstroPkg = isCommonNotAstro(pkgName);
				if (isNotAstroPkg) {
					return false;
				} else {
					return void 0;
				}
			},
		});
		_crawlCache.set(crawlCacheKey, astroPkgsConfig);
	}
	astroPkgsConfig = cloneCrawlResult(astroPkgsConfig);
	const envLoader = createEnvLoader({
		mode,
		config: settings.config,
	});
	const serverIslandsState = new ServerIslandsState();
	validateEnvPrefixAgainstSchema(settings.config);
	const commonConfig = {
		// Tell Vite not to combine config from vite.config.js with our provided inline config
		configFile: false,
		mode,
		cacheDir: fileURLToPath(new URL('./node_modules/.vite/', settings.config.root)),
		// using local caches allows Astro to be used in monorepos, etc.
		clearScreen: false,
		// we want to control the output, not Vite
		customLogger: createViteLogger(logger, settings.config.vite.logLevel),
		appType: 'custom',
		plugins: [
			// Raise the watcher's maxListeners limit before any other plugin's
			// configureServer hook can add listeners. Astro registers 12+ change
			// listeners across its built-in Vite plugins, easily exceeding
			// Node's default limit of 10.
			{
				name: 'astro:watcher-max-listeners',
				configureServer(server) {
					const current = server.watcher.getMaxListeners();
					if (current !== 0 && current < 50) {
						server.watcher.setMaxListeners(50);
					}
				},
			},
			serializedManifestPlugin({ settings, command, sync }),
			vitePluginRenderers({
				settings,
				routesList,
				serverIslandsState,
				command: command === 'dev' ? 'serve' : 'build',
			}),
			vitePluginStaticPaths(),
			await astroPluginRoutes({ routesList, settings, logger, fsMod: fs, command }),
			astroVirtualManifestPlugin({ settings }),
			vitePluginEnvironment({ settings, astroPkgsConfig, command }),
			pluginPage({ routesList }),
			pluginPages({ routesList }),
			configAliasVitePlugin({ settings }),
			astroLoadFallbackPlugin({ fs, root: settings.config.root }),
			astroVitePlugin({ settings, logger }),
			astroScriptsPlugin({ settings }),
			// The server plugin is for dev only and having it run during the build causes
			// the build to run very slow as the filewatcher is triggered often.
			vitePluginApp(),
			vitePluginFetchable({ settings }),
			command === 'dev' && vitePluginAstroServer({ settings, logger }),
			command === 'dev' && vitePluginAstroServerClient(),
			astroDevCssPlugin({ routesList, command }),
			importMetaEnv({ envLoader }),
			astroEnv({ settings, sync, envLoader }),
			vitePluginAdapterConfig(settings),
			markdownVitePlugin({ settings, logger }),
			htmlVitePlugin(),
			astroIntegrationsContainerPlugin({ settings, logger }),
			astroScriptsPageSSRPlugin({ settings }),
			astroHeadPlugin(),
			astroContentVirtualModPlugin({ fs, settings }),
			astroContentImportPlugin({ fs, settings, logger }),
			astroContentAssetPropagationPlugin({ settings }),
			vitePluginMiddleware({ settings }),
			astroAssetsPlugin({ fs, settings, sync, logger }),
			astroPrefetch({ settings }),
			astroTransitions({ settings }),
			astroDevToolbar({ settings, logger }),
			vitePluginFileURL(),
			astroInternationalization({ settings }),
			vitePluginActions({ fs, settings }),
			vitePluginServerIslands({ settings, logger, serverIslandsState }),
			vitePluginSessionDriver({ settings }),
			vitePluginCacheProvider({ settings }),
			astroContainer(),
			astroHmrReloadPlugin(),
			vitePluginChromedevtools({ settings }),
		],
		publicDir: fileURLToPath(settings.config.publicDir),
		root: fileURLToPath(settings.config.root),
		envPrefix: settings.config.vite?.envPrefix ?? 'PUBLIC_',
		define: {
			'import.meta.env.SITE': stringifyForDefine(settings.config.site),
			'import.meta.env.BASE_URL': stringifyForDefine(settings.config.base),
			'import.meta.env.ASSETS_PREFIX': stringifyForDefine(settings.config.build.assetsPrefix),
		},
		server: {
			hmr:
				process.env.NODE_ENV === 'test' || process.env.NODE_ENV === 'production' ? false : void 0,
			// disable HMR for test
			watch: {
				// Prevent watching during the build to speed it up
				ignored: command === 'build' ? ['**'] : void 0,
			},
		},
		resolve: {
			alias: [
				{
					// This is needed for Deno compatibility, as the non-browser version
					// of this module depends on Node `crypto`
					find: 'randombytes',
					replacement: 'randombytes/browser',
				},
				{
					// Typings are imported from 'astro' (e.g. import { Type } from 'astro')
					find: /^astro$/,
					replacement: fileURLToPath(new URL('../types/public/index.js', import.meta.url)),
				},
				{
					find: 'astro:middleware',
					replacement: 'astro/virtual-modules/middleware.js',
				},
				// TODO: remove in Astro 7
				{
					find: 'astro:schema',
					replacement: 'astro/zod',
				},
				{
					find: 'astro:components',
					replacement: 'astro/components',
				},
			],
		},
		build: { assetsDir: settings.config.build.assets },
		environments: {
			[ASTRO_VITE_ENVIRONMENT_NAMES.astro]: {
				// This is all that's needed to create a new RunnableDevEnvironment
				dev: {},
			},
		},
	};
	const assetsPrefix = settings.config.build.assetsPrefix;
	if (assetsPrefix) {
		commonConfig.experimental = {
			renderBuiltUrl(filename, { type, hostType }) {
				if (type === 'asset') {
					return joinPaths(getAssetsPrefix(`.${hostType}`, assetsPrefix), filename);
				}
			},
		};
	}
	let result = commonConfig;
	if (command && settings.config.vite?.plugins) {
		let { plugins, ...rest } = settings.config.vite;
		const applyToFilter = command === 'build' ? 'serve' : 'build';
		const applyArgs = [
			{ ...settings.config.vite, mode },
			{ command: command === 'dev' ? 'serve' : command, mode },
		];
		plugins = plugins.flat(Number.POSITIVE_INFINITY).filter((p) => {
			if (!p || p?.apply === applyToFilter) {
				return false;
			}
			if (typeof p.apply === 'function') {
				return p.apply(applyArgs[0], applyArgs[1]);
			}
			return true;
		});
		result = vite.mergeConfig(result, { ...rest, plugins });
	} else {
		result = vite.mergeConfig(result, settings.config.vite || {});
	}
	result = vite.mergeConfig(result, commandConfig);
	return result;
}
const COMMON_DEPENDENCIES_NOT_ASTRO = [
	'autoprefixer',
	'react',
	'react-dom',
	'preact',
	'preact-render-to-string',
	'vue',
	'svelte',
	'solid-js',
	'lit',
	'cookie',
	'dotenv',
	'esbuild',
	'eslint',
	'jest',
	'postcss',
	'prettier',
	'astro',
	'tslib',
	'typescript',
	'vite',
];
const COMMON_PREFIXES_NOT_ASTRO = [
	'@webcomponents/',
	'@fontsource/',
	'@postcss-plugins/',
	'@rollup/',
	'@astrojs/renderer-',
	'@types/',
	'@typescript-eslint/',
	'eslint-',
	'jest-',
	'postcss-plugin-',
	'prettier-plugin-',
	'remark-',
	'rehype-',
	'rollup-plugin-',
	'vite-plugin-',
];
function isCommonNotAstro(dep) {
	return (
		COMMON_DEPENDENCIES_NOT_ASTRO.includes(dep) ||
		COMMON_PREFIXES_NOT_ASTRO.some(
			(prefix) =>
				prefix.startsWith('@')
					? dep.startsWith(prefix)
					: dep.substring(dep.lastIndexOf('/') + 1).startsWith(prefix),
			// check prefix omitting @scope/
		)
	);
}
function stringifyForDefine(value) {
	return typeof value === 'string' || isObject(value) ? JSON.stringify(value) : 'undefined';
}
export { clearCrawlCache, createVite };
