import cloudflare from '@astrojs/cloudflare';
import { defineConfig } from 'astro/config';

const RESOLVED_VIRTUAL_COMPONENT_METADATA = '\0virtual:astro:component-metadata';

/**
 * Counts how often `astro:head-metadata` invalidates its virtual module from
 * its own `transform` hook, and serves the running total from
 * `/__transform-invalidations`. `DevServer` exposes no route to the module
 * graph, so the count has to be collected inside the Vite config the dev
 * server runs with. Invalidations from the plugin's file watcher listeners are
 * deliberately excluded: unrelated writes under the project root fire those at
 * arbitrary times.
 */
function countTransformInvalidations() {
	let count = 0;
	let transforming = false;
	return {
		name: 'test:count-transform-invalidations',
		enforce: 'post' as const,
		apply: 'serve' as const,
		configureServer(server: any) {
			for (const environment of Object.values<any>(server.environments)) {
				const moduleGraph = environment.moduleGraph;
				if (typeof moduleGraph?.invalidateModule !== 'function') continue;
				const invalidateModule = moduleGraph.invalidateModule.bind(moduleGraph);
				moduleGraph.invalidateModule = (mod: any, ...rest: unknown[]) => {
					if (transforming && mod?.id === RESOLVED_VIRTUAL_COMPONENT_METADATA) count++;
					return invalidateModule(mod, ...rest);
				};
			}

			const headPlugin = server.config.plugins.find(
				(plugin: any) => plugin.name === 'astro:head-metadata',
			);
			const transform = headPlugin?.transform;
			if (typeof transform === 'function') {
				headPlugin.transform = function (this: unknown, ...args: unknown[]) {
					transforming = true;
					try {
						return transform.apply(this, args);
					} finally {
						transforming = false;
					}
				};
			}

			server.middlewares.use((req: any, res: any, next: () => void) => {
				if (req.url !== '/__transform-invalidations') return next();
				res.end(String(count));
			});
		},
	};
}

export default defineConfig({
	output: 'server',
	adapter: cloudflare(),
	vite: {
		plugins: [countTransformInvalidations()],
	},
});
