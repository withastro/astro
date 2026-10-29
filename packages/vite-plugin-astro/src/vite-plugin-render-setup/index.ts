import MagicString from 'magic-string';
import type { Plugin } from 'vite';
import type { AstroRenderer } from '@astrojs/runtime/types';
import { CLIENT_DIRECTIVES_MODULE_ID } from '../vite-plugin-client-directives/index.js';
import { COMPONENT_ASSETS_MODULE_ID } from '../vite-plugin-component-assets/index.js';
import { ASTRO_RENDERERS_MODULE_ID } from '../vite-plugin-renderers/const.js';
import { specialQueriesRE } from '../vite-plugin-utils/index.js';

export const RENDER_SETUP_MODULE_ID = 'virtual:astro:render-setup';
const RESOLVED_RENDER_SETUP_MODULE_ID = `\0${RENDER_SETUP_MODULE_ID}`;

/**
 * Serves `virtual:astro:render-setup`, which registers the renderers, client directives and
 * component assets of `astro()` with the runtime, and imports it from every `.astro` module
 * compiled for a server environment. `renderToString()` and `renderToResponse()` from
 * `@astrojs/runtime` render with what it registers. In dev, the `devHeadScript` of every renderer is
 * added to the `<head>` of rendered documents.
 */
export default function vitePluginRenderSetup({
	renderers,
}: {
	renderers: readonly AstroRenderer[];
}): Plugin {
	let dev = false;
	return {
		name: 'astro:render-setup',
		configResolved(config) {
			dev = config.command === 'serve';
		},
		resolveId: {
			filter: { id: new RegExp(`^${RENDER_SETUP_MODULE_ID}$`) },
			handler() {
				return RESOLVED_RENDER_SETUP_MODULE_ID;
			},
		},
		load: {
			filter: { id: new RegExp(`^${RESOLVED_RENDER_SETUP_MODULE_ID}$`) },
			handler() {
				const headScripts = dev
					? renderers.flatMap((renderer) =>
							renderer.devHeadScript ? [renderer.devHeadScript] : [],
						)
					: [];
				return {
					code: `import { setRenderConfig } from '@astrojs/runtime/internal/render-setup.js';
import { clientDirectives } from ${JSON.stringify(CLIENT_DIRECTIVES_MODULE_ID)};
import { getComponentAssets, renderConfig } from ${JSON.stringify(COMPONENT_ASSETS_MODULE_ID)};
import { renderers } from ${JSON.stringify(ASTRO_RENDERERS_MODULE_ID)};
setRenderConfig({
	renderers,
	clientDirectives,
	site: renderConfig.site,
	compressHTML: renderConfig.compressHTML,
	base: import.meta.env.BASE_URL,
	componentAssets: getComponentAssets,
	headScripts: ${JSON.stringify(headScripts)}.map((script) => script.replaceAll('__BASE__', import.meta.env.BASE_URL)),
});`,
				};
			},
		},
		transform: {
			filter: {
				id: {
					// The modules the `.astro` compile plugin transforms, not their style and script sub-requests.
					include: [/\.astro$/, /\.astro\?/],
					exclude: [specialQueriesRE, /(?:\?|&)astro(?:&|=|$)/],
				},
			},
			handler(code) {
				if (this.environment.config.consumer !== 'server') return;
				// Appended, so that the source map of the compiled code stays valid; imports are hoisted.
				const s = new MagicString(code);
				s.append(`\nimport ${JSON.stringify(RENDER_SETUP_MODULE_ID)};`);
				return { code: s.toString(), map: s.generateMap({ hires: 'boundary' }) };
			},
		},
	};
}
