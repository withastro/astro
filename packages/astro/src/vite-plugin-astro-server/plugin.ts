import { AsyncLocalStorage } from 'node:async_hooks';
import type fs from 'node:fs';
import { IncomingMessage } from 'node:http';
import type * as vite from 'vite';
import type { AstroSettings, ManifestData, SSRManifest } from '../@types/astro.js';
import type { SSRManifestI18n } from '../core/app/types.js';
import { createKey } from '../core/encryption.js';
import { getViteErrorPayload } from '../core/errors/dev/index.js';
import { AstroError, AstroErrorData } from '../core/errors/index.js';
import { patchOverlay } from '../core/errors/overlay.js';
import type { Logger } from '../core/logger/core.js';
import { NOOP_MIDDLEWARE_FN } from '../core/middleware/noop-middleware.js';
import { createViteLoader } from '../core/module-loader/index.js';
import { injectDefaultRoutes } from '../core/routing/default.js';
import { createRouteManifest } from '../core/routing/index.js';
import { toFallbackType, toRoutingStrategy } from '../i18n/utils.js';
import { baseMiddleware } from './base.js';
import { createController } from './controller.js';
import { recordServerError } from './error.js';
import { DevPipeline } from './pipeline.js';
import { handleRequest } from './request.js';
import { setRouteError } from './server-state.js';

export interface AstroPluginOptions {
	settings: AstroSettings;
	logger: Logger;
	fs: typeof fs;
}

export default function createVitePluginAstroServer({
	settings,
	logger,
	fs: fsMod,
}: AstroPluginOptions): vite.Plugin {
	return {
		name: 'astro:server',
		configureServer(viteServer) {
			const loader = createViteLoader(viteServer);
			const manifest = createDevelopmentManifest(settings);
			let manifestData: ManifestData = injectDefaultRoutes(
				manifest,
				createRouteManifest({ settings, fsMod }, logger),
			);
			const pipeline = DevPipeline.create(manifestData, { loader, logger, manifest, settings });
			const controller = createController({ loader });
			const localStorage = new AsyncLocalStorage();

			/** rebuild the route cache + manifest, as needed. */
			function rebuildManifest(needsManifestRebuild: boolean) {
				pipeline.clearRouteCache();
				if (needsManifestRebuild) {
					manifestData = injectDefaultRoutes(manifest, createRouteManifest({ settings }, logger));
					pipeline.setManifestData(manifestData);
				}
			}

			// Rebuild route manifest on file change, if needed.
			viteServer.watcher.on('add', rebuildManifest.bind(null, true));
			viteServer.watcher.on('unlink', rebuildManifest.bind(null, true));
			viteServer.watcher.on('change', rebuildManifest.bind(null, false));

			function handleUnhandledRejection(rejection: any) {
				const error = new AstroError({
					...AstroErrorData.UnhandledRejection,
					message: AstroErrorData.UnhandledRejection.message(rejection?.stack || rejection),
				});
				const store = localStorage.getStore();
				if (store instanceof IncomingMessage) {
					const request = store;
					setRouteError(controller.state, request.url!, error);
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
							manifestData,
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
	let i18nManifest: SSRManifestI18n | undefined = undefined;
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

	return {
		hrefRoot: settings.config.root.toString(),
		trailingSlash: settings.config.trailingSlash,
		buildFormat: settings.config.build.format,
		compressHTML: settings.config.compressHTML,
		assets: new Set(),
		entryModules: {},
		routes: [],
		adapterName: settings?.adapter?.name || '',
		clientDirectives: settings.clientDirectives,
		renderers: [],
		base: settings.config.base,
		assetsPrefix: settings.config.build.assetsPrefix,
		site: settings.config.site,
		componentMetadata: new Map(),
		inlinedScripts: new Map(),
		i18n: i18nManifest,
		checkOrigin: settings.config.security?.checkOrigin ?? false,
		experimentalEnvGetSecretEnabled: false,
		key: createKey(),
		middleware() {
			return {
				onRequest: NOOP_MIDDLEWARE_FN,
			};
		},
	};
}
