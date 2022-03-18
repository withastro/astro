import { Plugin as VitePlugin } from 'vite';
import { AstroConfig } from '../@types/astro.js';

// NOTE: We can't use the virtual "\0" ID convention because we need to
// inject these as ESM imports into actual code, where they would not
// resolve correctly.
const SCRIPT_ID_PREFIX = `astro:scripts/`;
const BEFORE_HYDRATION_SCRIPT_ID = `${SCRIPT_ID_PREFIX}before-hydration.js`;
const PAGE_SCRIPT_ID = `${SCRIPT_ID_PREFIX}page.js`;
const PAGE_SSR_SCRIPT_ID = `${SCRIPT_ID_PREFIX}page-ssr.js`;

export default function astroScriptsPlugin({ config }: { config: AstroConfig }): VitePlugin {
	return {
		name: 'astro:scripts',
		async resolveId(id) {
			if (id.startsWith(SCRIPT_ID_PREFIX)) {
				return id;
			}
			return undefined;
		},

		async load(id) {
			if (id === BEFORE_HYDRATION_SCRIPT_ID) {
				return config._ctx.scripts
					.filter((s) => s.stage === 'before-hydration')
					.map((s) => s.content)
					.join('\n');
			}
			if (id === PAGE_SCRIPT_ID) {
				return config._ctx.scripts
					.filter((s) => s.stage === 'page')
					.map((s) => s.content)
					.join('\n');
			}
			if (id === PAGE_SSR_SCRIPT_ID) {
				return config._ctx.scripts
					.filter((s) => s.stage === 'page-ssr')
					.map((s) => s.content)
					.join('\n');
			}
			return null;
		},
		buildStart(options) {
			// We only want to inject this script if we are building
			// for the frontend AND some hydrated components exist in
			// the final build. We can detect this by looking for a
			// `astro/client/*` input, which signifies both conditions are met.
			const hasHydratedComponents = Array.isArray(options.input) && options.input.some((input) => input.startsWith('astro/client'));
			const hasHydrationScripts = config._ctx.scripts.some((s) => s.stage === 'before-hydration');
			if (hasHydratedComponents && hasHydrationScripts) {
				this.emitFile({
					type: 'chunk',
					id: BEFORE_HYDRATION_SCRIPT_ID,
					name: BEFORE_HYDRATION_SCRIPT_ID,
				});
			}
		},
	};
}
