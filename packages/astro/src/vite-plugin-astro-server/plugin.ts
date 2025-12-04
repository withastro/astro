import { AsyncLocalStorage } from 'node:async_hooks';
import { randomUUID } from 'node:crypto';
import { existsSync } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { IncomingMessage } from 'node:http';
import { fileURLToPath } from 'node:url';
import type * as vite from 'vite';
import { isRunnableDevEnvironment, type RunnableDevEnvironment } from 'vite';
import { toFallbackType } from '../core/app/common.js';
import { toRoutingStrategy } from '../core/app/index.js';
import type { SSRManifest, SSRManifestCSP, SSRManifestI18n } from '../core/app/types.js';
import {
	getAlgorithm,
	getDirectives,
	getScriptHashes,
	getScriptResources,
	getStrictDynamic,
	getStyleHashes,
	getStyleResources,
	shouldTrackCspHashes,
} from '../core/csp/common.js';
import { createKey, getEnvironmentKey, hasEnvironmentKey } from '../core/encryption.js';
import { getViteErrorPayload } from '../core/errors/dev/index.js';
import { AstroError, AstroErrorData } from '../core/errors/index.js';
import { patchOverlay } from '../core/errors/overlay.js';
import type { Logger } from '../core/logger/core.js';
import { NOOP_MIDDLEWARE_FN } from '../core/middleware/noop-middleware.js';
import { createViteLoader } from '../core/module-loader/index.js';
import { SERIALIZED_MANIFEST_ID } from '../manifest/serialized.js';
import type { AstroSettings } from '../types/astro.js';
import { ASTRO_DEV_APP_ID } from '../vite-plugin-app/index.js';
import { baseMiddleware } from './base.js';
import { createController } from './controller.js';
import { recordServerError } from './error.js';
import { setRouteError } from './server-state.js';
import { trailingSlashMiddleware } from './trailing-slash.js';
import { ASTRO_VITE_ENVIRONMENT_NAMES } from '../core/constants.js';

interface AstroPluginOptions {
	settings: AstroSettings;
	logger: Logger;
}

export default function createVitePluginAstroServer({
	settings,
	logger,
}: AstroPluginOptions): vite.Plugin {
	return {
		name: 'astro:server',
		applyToEnvironment(environment) {
			return environment.name === ASTRO_VITE_ENVIRONMENT_NAMES.server;
		},
		async configureServer(viteServer) {
			// Cloudflare handles its own requests
			// TODO: let this handle non-runnable environments that don't intercept requests
			if (!isRunnableDevEnvironment(viteServer.environments.ssr)) {
				return;
			}
			const environment = viteServer.environments.ssr as RunnableDevEnvironment;
			const loader = createViteLoader(viteServer, environment);
			const { default: createAstroServerApp } = await environment.runner.import(ASTRO_DEV_APP_ID);
			const controller = createController({ loader });
			const { handler } = await createAstroServerApp(controller, settings, loader, logger);
			const { manifest } = await environment.runner.import<{
				manifest: SSRManifest;
			}>(SERIALIZED_MANIFEST_ID);
			const localStorage = new AsyncLocalStorage();

			function handleUnhandledRejection(rejection: any) {
				const error = AstroError.is(rejection)
					? rejection
					: new AstroError({
							...AstroErrorData.UnhandledRejection,
							message: AstroErrorData.UnhandledRejection.message(rejection?.stack || rejection),
						});
				const store = localStorage.getStore();
				if (store instanceof IncomingMessage) {
					setRouteError(controller.state, store.url!, error);
				}
				const { errorWithMetadata } = recordServerError(loader, manifest, logger, error);
				setTimeout(
					async () => loader.webSocketSend(await getViteErrorPayload(errorWithMetadata)),
					200,
				);
			}

			process.on('unhandledRejection', handleUnhandledRejection);
			viteServer.httpServer?.on('close', () => {
				process.off('unhandledRejection', handleUnhandledRejection);
			});

			return () => {
				// Push this middleware to the front of the stack so that it can intercept responses.
				// fix(#6067): always inject this to ensure zombie base handling is killed after restarts
				viteServer.middlewares.stack.unshift({
					route: '',
					handle: baseMiddleware(settings, logger),
				});
				viteServer.middlewares.stack.unshift({
					route: '',
					handle: trailingSlashMiddleware(settings),
				});

				// Chrome DevTools workspace handler
				// See https://chromium.googlesource.com/devtools/devtools-frontend/+/main/docs/ecosystem/automatic_workspace_folders.md
				viteServer.middlewares.use(async function chromeDevToolsHandler(request, response, next) {
					if (request.url !== '/.well-known/appspecific/com.chrome.devtools.json') {
						return next();
					}
					if (!settings.config.experimental.chromeDevtoolsWorkspace) {
						// Return early to stop console spam
						response.writeHead(404);
						response.end();
						return;
					}

					const pluginVersion = '1.1';
					const cacheDir = settings.config.cacheDir;
					const configPath = new URL('./chrome-workspace.json', cacheDir);

					if (!existsSync(cacheDir)) {
						await mkdir(cacheDir, { recursive: true });
					}

					let config;
					try {
						config = JSON.parse(await readFile(configPath, 'utf-8'));
						// If the cached workspace config was created with a previous version of this plugin,
						// we throw an error so it gets recreated in the `catch` block below.
						if (config.version !== pluginVersion) throw new Error('Cached config is outdated.');
					} catch {
						config = {
							workspace: {
								version: pluginVersion,
								uuid: randomUUID(),
								root: fileURLToPath(settings.config.root),
							},
						};
						await writeFile(configPath, JSON.stringify(config));
					}

					response.setHeader('Content-Type', 'application/json');
					response.end(JSON.stringify(config));
					return;
				});

				// Note that this function has a name so other middleware can find it.
				viteServer.middlewares.use(async function astroDevHandler(request, response) {
					if (request.url === undefined || !request.method) {
						response.writeHead(500, 'Incomplete request');
						response.end();
						return;
					}

					localStorage.run(request, () => {
						handler(request, response);
					});
				});
			};
		},
		transform(code, id, opts = {}) {
			if (opts.ssr) return;
			if (!id.includes('vite/dist/client/client.mjs')) return;

			// Replace the Vite overlay with ours
			return patchOverlay(code);
		},
	};
}

export function createVitePluginAstroServerClient(): vite.Plugin {
	return {
		name: 'astro:server-client',
		applyToEnvironment(environment) {
			return environment.name === ASTRO_VITE_ENVIRONMENT_NAMES.client;
		},
		transform(code, id, opts = {}) {
			if (opts.ssr) return;
			if (!id.includes('vite/dist/client/client.mjs')) return;

			// Replace the Vite overlay with ours
			return patchOverlay(code);
		},
	};
}

/**
 * It creates a `SSRManifest` from the `AstroSettings`.
 *
 * Renderers needs to be pulled out from the page module emitted during the build.
 * @param settings
 */
export async function createDevelopmentManifest(settings: AstroSettings): Promise<SSRManifest> {
	let i18nManifest: SSRManifestI18n | undefined;
	let csp: SSRManifestCSP | undefined;
	if (settings.config.i18n) {
		i18nManifest = {
			fallback: settings.config.i18n.fallback,
			strategy: toRoutingStrategy(settings.config.i18n.routing, settings.config.i18n.domains),
			defaultLocale: settings.config.i18n.defaultLocale,
			locales: settings.config.i18n.locales,
			domainLookupTable: {},
			fallbackType: toFallbackType(settings.config.i18n.routing),
			domains: settings.config.i18n.domains,
		};
	}

	if (shouldTrackCspHashes(settings.config.experimental.csp)) {
		const styleHashes = [
			...getStyleHashes(settings.config.experimental.csp),
			...settings.injectedCsp.styleHashes,
		];

		csp = {
			cspDestination: settings.adapter?.adapterFeatures?.experimentalStaticHeaders
				? 'adapter'
				: undefined,
			scriptHashes: getScriptHashes(settings.config.experimental.csp),
			scriptResources: getScriptResources(settings.config.experimental.csp),
			styleHashes,
			styleResources: getStyleResources(settings.config.experimental.csp),
			algorithm: getAlgorithm(settings.config.experimental.csp),
			directives: getDirectives(settings),
			isStrictDynamic: getStrictDynamic(settings.config.experimental.csp),
		};
	}

	return {
		rootDir: settings.config.root,
		srcDir: settings.config.srcDir,
		cacheDir: settings.config.cacheDir,
		outDir: settings.config.outDir,
		buildServerDir: settings.config.build.server,
		buildClientDir: settings.config.build.client,
		publicDir: settings.config.publicDir,
		trailingSlash: settings.config.trailingSlash,
		buildFormat: settings.config.build.format,
		compressHTML: settings.config.compressHTML,
		assetsDir: settings.config.build.assets,
		serverLike: settings.buildOutput === 'server',
		assets: new Set(),
		entryModules: {},
		routes: [],
		adapterName: settings?.adapter?.name ?? '',
		clientDirectives: settings.clientDirectives,
		renderers: [],
		base: settings.config.base,
		userAssetsBase: settings.config?.vite?.base,
		assetsPrefix: settings.config.build.assetsPrefix,
		site: settings.config.site,
		componentMetadata: new Map(),
		inlinedScripts: new Map(),
		i18n: i18nManifest,
		checkOrigin:
			(settings.config.security?.checkOrigin && settings.buildOutput === 'server') ?? false,
		key: hasEnvironmentKey() ? getEnvironmentKey() : createKey(),
		middleware() {
			return {
				onRequest: NOOP_MIDDLEWARE_FN,
			};
		},
		sessionConfig: settings.config.session,
		csp,
		devToolbar: {
			enabled:
				settings.config.devToolbar.enabled &&
				(await settings.preferences.get('devToolbar.enabled')),
			latestAstroVersion: settings.latestAstroVersion,
			debugInfoOutput: '',
		},
		logLevel: settings.logLevel,
	};
}
