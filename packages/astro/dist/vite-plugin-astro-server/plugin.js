import { AsyncLocalStorage } from 'node:async_hooks';
import { IncomingMessage } from 'node:http';
import { isRunnableDevEnvironment } from 'vite';
import { ASTRO_VITE_ENVIRONMENT_NAMES, devPrerenderMiddlewareSymbol } from '../core/constants.js';
import { getViteErrorPayload } from '../core/errors/dev/index.js';
import { AstroError, AstroErrorData } from '../core/errors/index.js';
import { createViteLoader } from '../core/module-loader/index.js';
import { matchAllRoutes } from '../core/routing/match.js';
import { SERIALIZED_MANIFEST_ID } from '../manifest/serialized.js';
import { ASTRO_DEV_SERVER_APP_ID } from '../vite-plugin-app/index.js';
import { baseMiddleware } from './base.js';
import { createController } from './controller.js';
import { recordServerError } from './error.js';
import { setRouteError } from './server-state.js';
import { routeGuardMiddleware } from './route-guard.js';
import { secFetchMiddleware } from './sec-fetch.js';
import { trailingSlashMiddleware } from './trailing-slash.js';
function createVitePluginAstroServer({ settings, logger }) {
	return {
		name: 'astro:server',
		applyToEnvironment(environment) {
			return environment.name === ASTRO_VITE_ENVIRONMENT_NAMES.ssr;
		},
		async configureServer(viteServer) {
			const ssrEnvironment = viteServer.environments[ASTRO_VITE_ENVIRONMENT_NAMES.ssr];
			const prerenderEnvironment = viteServer.environments[ASTRO_VITE_ENVIRONMENT_NAMES.prerender];
			const runnableSsrEnvironment = isRunnableDevEnvironment(ssrEnvironment)
				? ssrEnvironment
				: void 0;
			const runnablePrerenderEnvironment = isRunnableDevEnvironment(prerenderEnvironment)
				? prerenderEnvironment
				: void 0;
			async function createHandler(environment) {
				const loader = createViteLoader(viteServer, environment);
				const { default: createAstroServerApp } =
					await environment.runner.import(ASTRO_DEV_SERVER_APP_ID);
				const controller = createController({ loader });
				const { handler } = await createAstroServerApp(controller, settings, loader, logger);
				const { manifest } = await environment.runner.import(SERIALIZED_MANIFEST_ID);
				return { controller, handler, loader, manifest, environment };
			}
			const ssrHandler = runnableSsrEnvironment
				? await createHandler(runnableSsrEnvironment)
				: void 0;
			const prerenderHandler = runnablePrerenderEnvironment
				? await createHandler(runnablePrerenderEnvironment)
				: void 0;
			const localStorage = new AsyncLocalStorage();
			function handleUnhandledRejection(rejection) {
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
						setRouteError(currentHandler.controller.state, store.url, error);
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
				const shouldHandlePrerenderInCore = Boolean(viteServer[devPrerenderMiddlewareSymbol]);
				viteServer.middlewares.stack.unshift({
					route: '',
					handle: baseMiddleware(settings, logger),
				});
				viteServer.middlewares.stack.unshift({
					route: '',
					handle: trailingSlashMiddleware(settings),
				});
				viteServer.middlewares.stack.unshift({
					route: '',
					handle: routeGuardMiddleware(settings),
				});
				viteServer.middlewares.stack.unshift({
					route: '',
					handle: secFetchMiddleware(logger, settings.config.security?.allowedDomains),
				});
				if (prerenderHandler && shouldHandlePrerenderInCore) {
					viteServer.middlewares.use(
						async function astroDevPrerenderHandler(request, response, next) {
							if (request.url === void 0 || !request.method) {
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
								const routesList = { routes: routes.map((r) => r.routeData) };
								const matches = matchAllRoutes(pathname, routesList);
								if (!matches.some((route) => route.prerender)) {
									return next();
								}
								const handled = await new Promise((resolve) => {
									localStorage.run(request, () => {
										prerenderHandler
											.handler(request, response, { prerenderOnly: true })
											.then((result) => resolve(result))
											.catch(() => resolve(true));
									});
								});
								if (!handled) {
									return next();
								}
							} catch (err) {
								next(err);
							}
						},
					);
				}
				if (ssrHandler) {
					viteServer.middlewares.use(async function astroDevHandler(request, response) {
						if (request.url === void 0 || !request.method) {
							response.writeHead(500, 'Incomplete request');
							response.end();
							return;
						}
						localStorage.run(request, () => {
							ssrHandler.handler(request, response);
						});
					});
				}
			};
		},
	};
}
export { createVitePluginAstroServer as default };
