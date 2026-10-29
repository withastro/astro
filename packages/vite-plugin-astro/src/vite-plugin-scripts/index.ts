import { BEFORE_HYDRATION_SCRIPT_ID } from './const.js';
import type { ConfigEnv, Plugin as VitePlugin } from 'vite';

export { BEFORE_HYDRATION_SCRIPT_ID };

/** A script added to every page, such as by an integration's `injectScript()`. */
export interface InjectedScript {
	stage: 'head-inline' | 'before-hydration' | 'page' | 'page-ssr';
	content: string;
}

export interface ScriptsPluginOptions {
	/** Read on every load, so scripts added after the plugin is created are included. */
	scripts: readonly InjectedScript[];
}

/**
 * Serves `astro:scripts/before-hydration.js`, the `before-hydration` scripts, which run in the
 * browser before the first island hydrates.
 */
export default function astroScriptsPlugin({ scripts }: ScriptsPluginOptions): VitePlugin {
	let command: 'build' | 'serve';
	return {
		name: 'astro:scripts:before-hydration',
		config(_: any, env: ConfigEnv) {
			command = env.command;
		},

		resolveId: {
			filter: {
				id: new RegExp(`^${BEFORE_HYDRATION_SCRIPT_ID}$`),
			},
			handler(id) {
				return id;
			},
		},

		load: {
			filter: {
				id: new RegExp(`^${BEFORE_HYDRATION_SCRIPT_ID}$`),
			},
			handler() {
				return {
					code: scripts
						.filter((s) => s.stage === 'before-hydration')
						.map((s) => s.content)
						.join('\n'),
				};
			},
		},
		buildStart() {
			if (command === 'serve') return;
			const hasHydrationScripts = scripts.some((s) => s.stage === 'before-hydration');
			if (
				hasHydrationScripts &&
				(this.environment.config.consumer === 'client' ||
					this.environment.config.consumer === 'server')
			) {
				this.emitFile({
					type: 'chunk',
					id: BEFORE_HYDRATION_SCRIPT_ID,
					name: BEFORE_HYDRATION_SCRIPT_ID,
				});
			}
		},
	};
}
