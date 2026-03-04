import type http from 'node:http';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import type * as vite from 'vite';
import { isRunnableDevEnvironment, type RunnableDevEnvironment } from 'vite';

const require = createRequire(import.meta.url);
const astroRoot = dirname(require.resolve('astro/package.json'));

/**
 * Vite plugin that intercepts prerendered page requests during dev and renders
 * them through Node.js (the `astro` environment) instead of Cloudflare's workerd.
 *
 * This lets prerendered pages use Node.js APIs (e.g. `node:fs`) during development
 * when `prerenderEnvironment: 'node'` is set.
 */
export function createNodePrerenderPlugin(): vite.Plugin {
	return {
		name: '@astrojs/cloudflare:dev-server-prerender-middleware',

		// Disable dep optimization for the `astro` environment so that
		// dependencies are loaded via native import() with correct import.meta.url.
		configEnvironment(environmentName) {
			if (environmentName === 'astro') {
				return { optimizeDeps: { noDiscovery: true, include: [] } };
			}
		},

		configureServer(server) {
			const settings = (server as any)[Symbol.for('astro.settings')];
			if (!settings) {
				throw new Error(
					'@astrojs/cloudflare: Could not find AstroSettings on ViteDevServer. ' +
						'The astro:server plugin must run before this plugin.',
				);
			}

			const astroEnv = server.environments['astro'];
			if (!astroEnv || !isRunnableDevEnvironment(astroEnv)) {
				return;
			}
			const runnableAstroEnv = astroEnv as RunnableDevEnvironment;

			// Load astro internals as regular Node modules (bypasses Vite transform pipeline)
			const { matchAllRoutes } = require(join(astroRoot, 'dist/core/routing/match.js'));
			const { createViteLoader } = require(
				join(astroRoot, 'dist/core/module-loader/index.js'),
			);
			const { createController } = require(
				join(astroRoot, 'dist/vite-plugin-astro-server/controller.js'),
			);

			let handlerReady: Promise<{
				handler: (req: http.IncomingMessage, res: http.ServerResponse) => void;
			}>;

			async function ensureHandler() {
				if (!handlerReady) {
					handlerReady = (async () => {
						const loader = createViteLoader(server, runnableAstroEnv);
						const controller = createController({ loader });

						const { default: createServerApp } =
							await runnableAstroEnv.runner.import('astro:server-app');
						return await createServerApp(controller, settings, loader);
					})();
				}
				return handlerReady;
			}

			// Use a post-hook (returned function) so this middleware is registered after
			// Vite's built-in middleware, including the host validation middleware that
			// prevents DNS rebinding attacks. We splice into the stack before
			// viteCachedTransformMiddleware — the same insertion point used by
			// @cloudflare/vite-plugin — so we run after the security checks but before
			// the CF plugin dispatches requests to miniflare.
			// TODO: when we drop support for Vite 6 we can register this middleware
			// as normal pre-middleware. Vite 7 places pre-middleware after security
			// checks by default.
			return () => {
				const middlewareStack = server.middlewares.stack;
				const cachedTransformIndex = middlewareStack.findIndex(
					(m) => 'name' in m.handle && m.handle.name === 'viteCachedTransformMiddleware',
				);

				const prerenderMiddleware = async (
					req: http.IncomingMessage,
					res: http.ServerResponse,
					next: (err?: unknown) => void,
				) => {
					// Skip Vite internal and special requests immediately
					if (req.url?.startsWith('/@') || req.url?.startsWith('/__')) {
						return next();
					}

					// Skip non-page requests (assets, deps, etc.) — only page routes
					// need to be checked against the prerender list
					if (req.url?.includes('/node_modules/') || req.url?.includes('.')) {
						return next();
					}

					try {
						const { handler } = await ensureHandler();

						// Routes are re-imported on each request so HMR changes are
						// reflected immediately (the runner caches and auto-invalidates)
						const { routes } =
							await runnableAstroEnv.runner.import('virtual:astro:routes');
						const routesList = { routes: routes.map((r: any) => r.routeData) };
						const pathname = decodeURI(
							new URL(req.url || '/', 'http://localhost').pathname,
						);

						const matches = matchAllRoutes(pathname, routesList);
						if (!matches.some((r: any) => r.prerender)) {
							// Not a prerendered route — let it through to the CF plugin
							// which will dispatch it to workerd via miniflare
							return next();
						}

						// Prerendered route — handle it in the Node.js environment
						// instead of dispatching to workerd
						handler(req, res);
					} catch (err) {
						next(err);
					}
				};

				if (cachedTransformIndex !== -1) {
					// This plugin is listed before @cloudflare/vite-plugin in the Vite
					// plugins array, so our post-hook runs first. When the CF plugin's
					// post-hook runs next, it splices its own preMiddleware at the same
					// insertion point, placing it after ours in the stack.
					middlewareStack.splice(cachedTransformIndex, 0, {
						route: '',
						handle: prerenderMiddleware,
					});
				} else {
					server.middlewares.use(prerenderMiddleware);
				}
			};
		},
	};
}
