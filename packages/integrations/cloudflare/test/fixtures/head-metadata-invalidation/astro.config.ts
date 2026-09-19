import cloudflare from '@astrojs/cloudflare';
import { defineConfig } from 'astro/config';
import type { DevEnvironment, Plugin, ViteDevServer } from 'vite';

const RESOLVED_VIRTUAL_COMPONENT_METADATA = '\0virtual:astro:component-metadata';

type Listener = (...args: unknown[]) => unknown;

/**
 * Structurally satisfied by the dev server's `watcher`. Chokidar types `on`/`off`
 * as per-event overloads that a general listener does not satisfy.
 */
interface Watcher {
	listeners(event: string): Listener[];
	on(event: string, listener: Listener): unknown;
	off(event: string, listener: Listener): unknown;
}

/**
 * Counts how often `astro:head-metadata` invalidates its virtual module, and
 * serves the running totals from two endpoints. `/__transform-invalidations`
 * counts the invalidations issued while a `transform` hook runs;
 * `/__watcher-invalidations` counts the ones issued while the dev server's
 * watcher dispatches an event, which is where the plugin's own listeners run.
 * `DevServer` exposes no route to the module graph, so the counts have to be
 * collected inside the Vite config the dev server runs with.
 */
function countInvalidations() {
	let transformCount = 0;
	let watcherCount = 0;
	let transforming = false;
	let dispatchingWatcherEvent = false;
	return {
		name: 'test:count-invalidations',
		enforce: 'post' as const,
		apply: 'serve' as const,
		configureServer(server: ViteDevServer) {
			for (const environment of Object.values(server.environments) as DevEnvironment[]) {
				const moduleGraph = environment.moduleGraph;
				if (typeof moduleGraph?.invalidateModule !== 'function') continue;
				const invalidateModule = moduleGraph.invalidateModule.bind(moduleGraph);
				moduleGraph.invalidateModule = (mod, ...rest) => {
					if ((mod as { id?: string }).id === RESOLVED_VIRTUAL_COMPONENT_METADATA) {
						if (transforming) transformCount++;
						if (dispatchingWatcherEvent) watcherCount++;
					}
					return invalidateModule(mod, ...rest);
				};
			}

			// Re-register the watcher listeners (the plugin's own included) behind a
			// flag, so invalidations a listener issues are attributable to the event
			// it was handling rather than to unrelated background re-transforms.
			const watcher = server.watcher as unknown as Watcher;
			for (const event of ['add', 'change', 'unlink']) {
				for (const listener of watcher.listeners(event)) {
					watcher.off(event, listener);
					watcher.on(event, (...args) => {
						dispatchingWatcherEvent = true;
						try {
							return listener(...args);
						} finally {
							dispatchingWatcherEvent = false;
						}
					});
				}
			}

			const headPlugin = server.config.plugins.find(
				(plugin: Plugin) => plugin.name === 'astro:head-metadata',
			);
			// Vite types hook values as `ObjectHook`; this plugin's is a plain function.
			const transform = (headPlugin as { transform?: Listener } | undefined)?.transform;
			if (typeof transform === 'function') {
				(headPlugin as { transform: Listener }).transform = function (
					this: unknown,
					...args: unknown[]
				) {
					transforming = true;
					try {
						return transform.apply(this, args);
					} finally {
						transforming = false;
					}
				};
			}

			server.middlewares.use((req, res, next) => {
				if (req.url === '/__transform-invalidations') {
					res.end(String(transformCount));
					return;
				}
				if (req.url === '/__watcher-invalidations') {
					res.end(String(watcherCount));
					return;
				}
				next();
			});
		},
	};
}

export default defineConfig({
	output: 'server',
	adapter: cloudflare(),
	vite: {
		plugins: [countInvalidations()],
	},
});
