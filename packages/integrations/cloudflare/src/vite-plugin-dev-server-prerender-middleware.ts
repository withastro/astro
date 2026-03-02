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
			const { createViteLoader } = require(join(astroRoot, 'dist/core/module-loader/index.js'));
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

						// createAstroServerApp handles logger, manifest, routes, and HMR internally
						const { default: createServerApp } =
							await runnableAstroEnv.runner.import('astro:server-app');
						return await createServerApp(controller, settings, loader);
					})();
				}
				return handlerReady;
			}

			server.middlewares.use(async (req, res, next) => {
				if (req.url?.startsWith('/@') || req.url?.startsWith('/__')) {
					return next();
				}

				try {
					const { handler } = await ensureHandler();

					// Re-import routes on each request (cached by runner, auto-invalidated on change)
					const { routes } = await runnableAstroEnv.runner.import('virtual:astro:routes');
					const routesList = { routes: routes.map((r: any) => r.routeData) };
					const pathname = decodeURI(new URL(req.url || '/', 'http://localhost').pathname);

					const matches = matchAllRoutes(pathname, routesList);
					if (!matches.some((r: any) => r.prerender)) {
						return next();
					}

					handler(req, res);
				} catch (err) {
					next(err);
				}
			});
		},
	};
}
