import type { Plugin as VitePlugin } from 'vite';
import type { AstroSettings } from '../types/astro.js';
import type { InjectedScriptStage } from '../types/public/integrations.js';
import { ASTRO_VITE_ENVIRONMENT_NAMES } from '../core/constants.js';

// NOTE: We can't use the virtual "\0" ID convention because we need to
// inject these as ESM imports into actual code, where they would not
// resolve correctly.
const SCRIPT_ID_PREFIX = `astro:scripts/`;
export const BEFORE_HYDRATION_SCRIPT_ID = `${SCRIPT_ID_PREFIX}${
	'before-hydration' as InjectedScriptStage
}.js`;
export const PAGE_SCRIPT_ID = `${SCRIPT_ID_PREFIX}${'page' as InjectedScriptStage}.js`;
export const PAGE_SSR_SCRIPT_ID = `${SCRIPT_ID_PREFIX}${'page-ssr' as InjectedScriptStage}.js`;

export default function astroScriptsPlugin({ settings }: { settings: AstroSettings }): VitePlugin {
	return {
		name: 'astro:scripts',

		// TODO: check if actually useful
		// async resolveId(id) {
		// 	if (id.startsWith(SCRIPT_ID_PREFIX)) {
		// 		return id;
		// 	}
		// 	return undefined;
		// },

		load: {
			filter: {
				id: new RegExp(`^(${BEFORE_HYDRATION_SCRIPT_ID}|${PAGE_SCRIPT_ID}|${PAGE_SSR_SCRIPT_ID})$`),
			},
			handler(id) {
				if (id === BEFORE_HYDRATION_SCRIPT_ID) {
					return {
						code: settings.scripts
							.filter((s) => s.stage === 'before-hydration')
							.map((s) => s.content)
							.join('\n'),
					};
				}
				if (id === PAGE_SCRIPT_ID) {
					return {
						code: settings.scripts
							.filter((s) => s.stage === 'page')
							.map((s) => s.content)
							.join('\n'),
					};
				}
				if (id === PAGE_SSR_SCRIPT_ID) {
					return {
						code: settings.scripts
							.filter((s) => s.stage === 'page-ssr')
							.map((s) => s.content)
							.join('\n'),
					};
				}
			},
		},
		buildStart() {
			const hasHydrationScripts = settings.scripts.some((s) => s.stage === 'before-hydration');
			if (
				hasHydrationScripts &&
				(this.environment.name === ASTRO_VITE_ENVIRONMENT_NAMES.prerender ||
					this.environment.name === ASTRO_VITE_ENVIRONMENT_NAMES.ssr)
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
