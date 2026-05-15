import { ASTRO_VITE_ENVIRONMENT_NAMES } from '../core/constants.js';
const SCRIPT_ID_PREFIX = `astro:scripts/`;
const BEFORE_HYDRATION_SCRIPT_ID = `${SCRIPT_ID_PREFIX}${'before-hydration'}.js`;
const PAGE_SCRIPT_ID = `${SCRIPT_ID_PREFIX}${'page'}.js`;
const PAGE_SSR_SCRIPT_ID = `${SCRIPT_ID_PREFIX}${'page-ssr'}.js`;
function astroScriptsPlugin({ settings }) {
	let command;
	return {
		name: 'astro:scripts',
		config(_, env) {
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
			if (command === 'serve') return;
			const hasHydrationScripts = settings.scripts.some((s) => s.stage === 'before-hydration');
			if (
				hasHydrationScripts &&
				(this.environment.name === ASTRO_VITE_ENVIRONMENT_NAMES.client ||
					this.environment.name === ASTRO_VITE_ENVIRONMENT_NAMES.prerender ||
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
export {
	BEFORE_HYDRATION_SCRIPT_ID,
	PAGE_SCRIPT_ID,
	PAGE_SSR_SCRIPT_ID,
	astroScriptsPlugin as default,
};
