import type { AstroIntegration } from 'astro';
import { vitePluginDb } from './vite-plugin-db.js';
import { vitePluginInjectEnvTs } from './vite-plugin-inject-env-ts.js';
import { typegen } from './typegen.js';
import { collectionsSchema } from './types.js';
import { seed } from './seed.js';

export function integration(): AstroIntegration {
	return {
		name: 'astro:db',
		hooks: {
			async 'astro:config:setup'({ updateConfig, config, command }) {
				// TODO: refine where we load collections
				// @matthewp: may want to load collections by path at runtime
				const collections = collectionsSchema.parse(config.db?.collections ?? {});
				const isDev = command === 'dev';
				if (!isDev) {
					await seed({ collections, root: config.root });
				}
				updateConfig({
					vite: {
						plugins: [
							// TODO: figure out when vite.Plugin doesn't line up with these types
							// @ts-ignore
							vitePluginDb({
								collections,
								root: config.root,
								isDev,
							}),
							// @ts-ignore
							vitePluginInjectEnvTs(config),
						],
					},
				});
				await typegen({ collections, root: config.root });
			},
		},
	};
}
