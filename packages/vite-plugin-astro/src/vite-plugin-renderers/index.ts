import type { Environment, Plugin as VitePlugin } from 'vite';
import type { AstroRenderer } from '@astrojs/runtime/types';
import { ASTRO_RENDERERS_MODULE_ID, RESOLVED_ASTRO_RENDERERS_MODULE_ID } from './const.js';

export { ASTRO_RENDERERS_MODULE_ID };

export interface RenderersPluginOptions {
	renderers: AstroRenderer[];
	/**
	 * Return `true` to emit an empty renderer list for an environment that never renders framework
	 * components, so their server code is left out of its bundle.
	 */
	skipRenderers?: (environment: Environment) => boolean;
}

/**
 * Serves `virtual:astro:renderers`, which exports the loaded renderers as `renderers`.
 */
export default function vitePluginRenderers({
	renderers,
	skipRenderers,
}: RenderersPluginOptions): VitePlugin {
	return {
		name: 'astro:plugin-renderers',
		enforce: 'pre',
		// Internal, undocumented: lets adapters (e.g. @astrojs/cloudflare) read the
		// registered renderers from the plugin chain to pre-bundle their server
		// entrypoints (see https://github.com/withastro/astro/issues/17921).
		renderers,

		resolveId: {
			filter: {
				id: new RegExp(`^${ASTRO_RENDERERS_MODULE_ID}$`),
			},
			handler() {
				return RESOLVED_ASTRO_RENDERERS_MODULE_ID;
			},
		},

		load: {
			filter: {
				id: new RegExp(`^${RESOLVED_ASTRO_RENDERERS_MODULE_ID}$`),
			},
			handler() {
				if (renderers.length > 0 && skipRenderers?.(this.environment)) {
					return { code: `export const renderers = [];` };
				}

				if (renderers.length > 0) {
					const imports: string[] = [];
					const exports: string[] = [];
					let i = 0;
					let rendererItems = '';

					for (const renderer of renderers) {
						const variable = `_renderer${i}`;
						imports.push(`import ${variable} from ${JSON.stringify(renderer.serverEntrypoint)};`);
						rendererItems += `Object.assign(${JSON.stringify(renderer)}, { ssr: ${variable} }),`;
						i++;
					}

					exports.push(`export const renderers = [${rendererItems}];`);

					return { code: `${imports.join('\n')}\n${exports.join('\n')}` };
				}
				return { code: `export const renderers = [];` };
			},
		},
	} as VitePlugin & { renderers: typeof renderers };
}
