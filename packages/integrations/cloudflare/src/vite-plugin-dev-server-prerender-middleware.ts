import type * as vite from 'vite';

const devPrerenderMiddlewareSymbol = Symbol.for('astro.devPrerenderMiddleware');

/**
 * Enables Astro core prerender middleware in dev so prerendered routes can
 * run in Node while non-prerendered routes continue through workerd.
 */
export function createNodePrerenderPlugin(): vite.Plugin {
	return {
		name: '@astrojs/cloudflare:dev-server-prerender-middleware',

		config() {
			return {
				environments: {
					prerender: { dev: {} },
				},
			};
		},

		// Disable dep optimization for the `prerender` environment so dependencies
		// are loaded via native import() with correct import.meta.url semantics.
		configEnvironment(environmentName) {
			if (environmentName === 'prerender') {
				return { optimizeDeps: { noDiscovery: true, include: [] } };
			}
		},

		configureServer(server) {
			(server as any)[devPrerenderMiddlewareSymbol] = true;
		},
	};
}
