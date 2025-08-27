import { AsyncLocalStorage } from 'node:async_hooks';
import { randomUUID } from 'node:crypto';
import type fs from 'node:fs';
import { existsSync } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { IncomingMessage } from 'node:http';
import { fileURLToPath } from 'node:url';
import type * as vite from 'vite';
import { normalizePath } from 'vite';
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
import { warnMissingAdapter } from '../core/dev/adapter-validation.js';
import { createKey, getEnvironmentKey, hasEnvironmentKey } from '../core/encryption.js';
import { getViteErrorPayload } from '../core/errors/dev/index.js';
import { AstroError, AstroErrorData } from '../core/errors/index.js';
import { patchOverlay } from '../core/errors/overlay.js';
import type { Logger } from '../core/logger/core.js';
import { NOOP_MIDDLEWARE_FN } from '../core/middleware/noop-middleware.js';
import { createViteLoader } from '../core/module-loader/index.js';
import { createRoutesList } from '../core/routing/index.js';
import { getRoutePrerenderOption } from '../core/routing/manifest/prerender.js';
import { toFallbackType, toRoutingStrategy } from '../i18n/utils.js';
import { runHookRoutesResolved } from '../integrations/hooks.js';
import type { AstroSettings, RoutesList } from '../types/astro.js';
import { baseMiddleware } from './base.js';
import { createController } from './controller.js';
import { recordServerError } from './error.js';
import { DevPipeline } from './pipeline.js';
import { handleRequest } from './request.js';
import { setRouteError } from './server-state.js';
import { trailingSlashMiddleware } from './trailing-slash.js';

interface AstroPluginOptions {
	settings: AstroSettings;
	logger: Logger;
	fs: typeof fs;
	routesList: RoutesList;
	manifest: SSRManifest;
}

export default function createVitePluginAstroServer({
	settings,
	logger,
	fs: fsMod,
	routesList,
	manifest,
}: AstroPluginOptions): vite.Plugin {
	return {
		name: 'astro:server',
		async configureServer(viteServer) {
			const loader = createViteLoader(viteServer);
			const pipeline = DevPipeline.create(routesList, {
				loader,
				logger,
				manifest,
				settings,
			});
			const controller = createController({ loader });
			const localStorage = new AsyncLocalStorage();

			/** rebuild the route cache + manifest */
			async function rebuildManifest(path: string | null = null) {
				pipeline.clearRouteCache();

				// If a route changes, we check if it's part of the manifest and check for its prerender value
				if (path !== null) {
					const route = routesList.routes.find(
						(r) =>
							normalizePath(path) ===
							normalizePath(fileURLToPath(new URL(r.component, settings.config.root))),
					);
					if (!route) {
						return;
					}
					if (route.type !== 'page' && route.type !== 'endpoint') return;

					const routePath = fileURLToPath(new URL(route.component, settings.config.root));
					try {
						const content = await fsMod.promises.readFile(routePath, 'utf-8');
						await getRoutePrerenderOption(content, route, settings, logger);
						await runHookRoutesResolved({ routes: routesList.routes, settings, logger });
					} catch (_) {}
				} else {
					routesList = await createRoutesList({ settings, fsMod }, logger, { dev: true });
				}

				warnMissingAdapter(logger, settings);
				pipeline.manifest.checkOrigin =
					settings.config.security.checkOrigin && settings.buildOutput === 'server';
				pipeline.setManifestData(routesList);
			}

			// Rebuild route manifest on file change
			viteServer.watcher.on('add', rebuildManifest.bind(null, null));
			viteServer.watcher.on('unlink', rebuildManifest.bind(null, null));
			viteServer.watcher.on('change', rebuildManifest);

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
				const { errorWithMetadata } = recordServerError(loader, settings.config, pipeline, error);
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
						handleRequest({
							pipeline,
							routesList,
							controller,
							incomingRequest: request,
							incomingResponse: response,
						});
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

/**
 * It creates a `SSRManifest` from the `AstroSettings`.
 *
 * Renderers needs to be pulled out from the page module emitted during the build.
 * @param settings
 */
export function createDevelopmentManifest(settings: AstroSettings): SSRManifest {
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
		hrefRoot: settings.config.root.toString(),
		srcDir: settings.config.srcDir,
		cacheDir: settings.config.cacheDir,
		outDir: settings.config.outDir,
		buildServerDir: settings.config.build.server,
		buildClientDir: settings.config.build.client,
		publicDir: settings.config.publicDir,
		trailingSlash: settings.config.trailingSlash,
		buildFormat: settings.config.build.format,
		compressHTML: settings.config.compressHTML,
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
	};
}
