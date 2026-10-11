import {
	BEFORE_HYDRATION_SCRIPT_ID,
	PAGE_SCRIPT_ID,
	PAGE_SSR_SCRIPT_ID,
	SCRIPT_ID_PREFIX,
} from './const.js';
import type { ConfigEnv, Plugin as VitePlugin } from 'vite';

export { BEFORE_HYDRATION_SCRIPT_ID, PAGE_SCRIPT_ID, PAGE_SSR_SCRIPT_ID };

/** A script added to every page, such as by an integration's `injectScript()`. */
export interface InjectedScript {
	stage: 'head-inline' | 'before-hydration' | 'page' | 'page-ssr';
	content: string;
}

export interface ScriptsPluginOptions {
	/** Read on every load, so scripts added after the plugin is created are included. */
	scripts: readonly InjectedScript[];
}

export default function astroScriptsPlugin({ scripts }: ScriptsPluginOptions): VitePlugin {
	let command: 'build' | 'serve';
	return {
		name: 'astro:scripts',
		config(_: any, env: ConfigEnv) {
			command = env.command;
		},

		resolveId: {
			filter: {
				id: new RegExp(`^${SCRIPT_ID_PREFIX}`),
			},
			handler(id) {
				return id;
			},
		},

		load: {
			filter: {
				id: new RegExp(`^(${BEFORE_HYDRATION_SCRIPT_ID}|${PAGE_SCRIPT_ID}|${PAGE_SSR_SCRIPT_ID})$`),
			},
			handler(id) {
				if (id === BEFORE_HYDRATION_SCRIPT_ID) {
					return {
						code: scripts
							.filter((s) => s.stage === 'before-hydration')
							.map((s) => s.content)
							.join('\n'),
					};
				}
				if (id === PAGE_SCRIPT_ID) {
					return {
						code: scripts
							.filter((s) => s.stage === 'page')
							.map((s) => s.content)
							.join('\n'),
					};
				}
				if (id === PAGE_SSR_SCRIPT_ID) {
					return {
						code: scripts
							.filter((s) => s.stage === 'page-ssr')
							.map((s) => s.content)
							.join('\n'),
					};
				}
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
