import { AsyncLocalStorage } from 'node:async_hooks';
import { IncomingMessage } from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type * as vite from 'vite';
import { isRunnableDevEnvironment, normalizePath, type RunnableDevEnvironment } from 'vite';
import type { SSRManifest } from '../core/app/types.js';
import { ASTRO_VITE_ENVIRONMENT_NAMES, devPrerenderMiddlewareSymbol } from '../core/constants.js';
import { getViteErrorPayload } from '../core/errors/dev/index.js';
import { AstroError, AstroErrorData } from '../core/errors/index.js';
import type { AstroLogger } from '../core/logger/core.js';
import { createViteLoader } from '../core/module-loader/index.js';
import { matchAllRoutes } from '../core/routing/match.js';
import { SERIALIZED_MANIFEST_ID } from '../manifest/serialized.js';
import type { AstroSettings } from '../types/astro.js';
import { ASTRO_DEV_SERVER_APP_ID } from '../vite-plugin-app/index.js';
import { baseMiddleware } from './base.js';
import { createController } from './controller.js';
import { recordServerError } from './error.js';
import { setRouteError } from './server-state.js';
import { routeGuardMiddleware } from './route-guard.js';
import { secFetchMiddleware } from './sec-fetch.js';
import { trailingSlashMiddleware } from './trailing-slash.js';

interface AstroPluginOptions {
	settings: AstroSettings;
	logger: AstroLogger;
}

export default function createVitePluginAstroServer({
	settings,
	logger,
}: AstroPluginOptions): vite.Plugin {
	return {
		name: 'astro:server',
		applyToEnvironment(environment) {
			return environment.name === ASTRO_VITE_ENVIRONMENT_NAMES.ssr;
		},
		async configureServer(viteServer) {
			const userAppFile = path.resolve(fileURLToPath(new URL('./app.ts', settings.config.srcDir)));

			const ssrEnvironment = viteServer.environments[ASTRO_VITE_ENVIRONMENT_NAMES.ssr];
			const prerenderEnvironment = viteServer.environments[ASTRO_VITE_ENVIRONMENT_NAMES.prerender];

			const runnableSsrEnvironment = isRunnableDevEnvironment(ssrEnvironment)
				? (ssrEnvironment as RunnableDevEnvironment)
				: undefined;
			const runnablePrerenderEnvironment = isRunnableDevEnvironment(prerenderEnvironment)
				? (prerenderEnvironment as RunnableDevEnvironment)
				: undefined;

			async function createHandler(environment: RunnableDevEnvironment) {
				const loader = createViteLoader(viteServer, environment);
				const { default: createAstroServerApp } =
					await environment.runner.import<
						typeof import('../vite-plugin-app/createAstroServerApp.js')
					>(ASTRO_DEV_SERVER_APP_ID);
				const controller = createController({ loader });
				const { handler, invalidate } = await createAstroServerApp(controller, settings, loader, logger);
				const { manifest } = await environment.runner.import<{
					manifest: SSRManifest;
				}>(SERIALIZED_MANIFEST_ID);
				return { controller, handler, invalidate, loader, manifest, environment };
			}

			let ssrHandler = runnableSsrEnvironment
				? await createHandler(runnableSsrEnvironment)
				: undefined;
			let prerenderHandler = runnablePrerenderEnvironment
				? await createHandler(runnablePrerenderEnvironment)
				: undefined;
			const localStorage = new AsyncLocalStorage();

			const reloadUserAppHandler = async (changedPath: string) => {
				if (path.resolve(changedPath) !== userAppFile) {
					return;
				}

				if (runnableSsrEnvironment) {
					ssrHandler = await createHandler(runnableSsrEnvironment);
				}
				if (runnablePrerenderEnvironment) {
					prerenderHandler = await createHandler(runnablePrerenderEnvironment);
				}
				logger.info('router', 'Reloaded app handler from src/app.ts');
			};

			// Invalidate the cached user app when files in srcDir change so that
			// the next request re-imports it, picking up new/removed routes and
			// updated component metadata.
			const normalizedSrcDir = normalizePath(fileURLToPath(settings.config.srcDir));
			const invalidateUserAppCache = (changedPath: string) => {
				if (!normalizePath(changedPath).startsWith(normalizedSrcDir)) return;
				ssrHandler?.invalidate();
				prerenderHandler?.invalidate();
			};

			viteServer.watcher.on('add', reloadUserAppHandler);
			viteServer.watcher.on('change', reloadUserAppHandler);
			viteServer.watcher.on('unlink', reloadUserAppHandler);
			viteServer.watcher.on('add', invalidateUserAppCache);
			viteServer.watcher.on('change', invalidateUserAppCache);
			viteServer.watcher.on('unlink', invalidateUserAppCache);

			viteServer.httpServer?.on('close', () => {
				viteServer.watcher.off('add', reloadUserAppHandler);
				viteServer.watcher.off('change', reloadUserAppHandler);
				viteServer.watcher.off('unlink', reloadUserAppHandler);
				viteServer.watcher.off('add', invalidateUserAppCache);
				viteServer.watcher.off('change', invalidateUserAppCache);
				viteServer.watcher.off('unlink', invalidateUserAppCache);
			});

			function handleUnhandledRejection(rejection: any) {
				const error = AstroError.is(rejection)
					? rejection
					: new AstroError({
							...AstroErrorData.UnhandledRejection,
							message: AstroErrorData.UnhandledRejection.message(rejection?.stack || rejection),
						});
				const store = localStorage.getStore();
				const handlers = [];
				if (ssrHandler) handlers.push(ssrHandler);
				if (prerenderHandler) handlers.push(prerenderHandler);
				for (const currentHandler of handlers) {
					if (store instanceof IncomingMessage) {
						setRouteError(currentHandler.controller.state, store.url!, error);
					}
					const { errorWithMetadata } = recordServerError(
						currentHandler.loader,
						currentHandler.manifest,
						logger,
						error,
					);
					setTimeout(
						async () =>
							currentHandler.loader.webSocketSend(await getViteErrorPayload(errorWithMetadata)),
						200,
					);
				}
			}

			if (ssrHandler || prerenderHandler) {
				process.on('unhandledRejection', handleUnhandledRejection);
				viteServer.httpServer?.on('close', () => {
					process.off('unhandledRejection', handleUnhandledRejection);
				});
			}

			return () => {
				const shouldHandlePrerenderInCore = Boolean(
					(viteServer as any)[devPrerenderMiddlewareSymbol],
				);

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
				// Prevent serving files outside srcDir/publicDir (e.g., /README.md at project root)
				viteServer.middlewares.stack.unshift({
					route: '',
					handle: routeGuardMiddleware(settings),
				});
				// Validate Sec-Fetch metadata headers to restrict cross-origin subresource requests
				viteServer.middlewares.stack.unshift({
					route: '',
					handle: secFetchMiddleware(logger, settings.config.security?.allowedDomains),
				});

				if (prerenderHandler && shouldHandlePrerenderInCore) {
					viteServer.middlewares.use(
						async function astroDevPrerenderHandler(request, response, next) {
							if (!prerenderHandler) return next();
							if (request.url === undefined || !request.method) {
								response.writeHead(500, 'Incomplete request');
								response.end();
								return;
							}

							if (request.url.startsWith('/@') || request.url.startsWith('/__')) {
								return next();
							}

							if (request.url.includes('/node_modules/')) {
								return next();
							}

							try {
								const pathname = decodeURI(new URL(request.url, 'http://localhost').pathname);
								const { routes } =
									await prerenderHandler.environment.runner.import('virtual:astro:routes');
								const routesList = { routes: routes.map((r: any) => r.routeData) };
								const matches = matchAllRoutes(pathname, routesList);

								if (!matches.some((route) => route.prerender)) {
									return next();
								}

								localStorage.run(request, () => {
									prerenderHandler!.handler(request, response);
								});
							} catch (err) {
								next(err);
							}
						},
					);
				}

				if (ssrHandler) {
					// Note that this function has a name so other middleware can find it.
					viteServer.middlewares.use(async function astroDevHandler(request, response) {
						if (!ssrHandler) return;
						if (request.url === undefined || !request.method) {
							response.writeHead(500, 'Incomplete request');
							response.end();
							return;
						}

						localStorage.run(request, () => {
							ssrHandler!.handler(request, response);
						});
					});
				}
			};
		},
	};
}
