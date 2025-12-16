import type { Plugin as VitePlugin } from 'vite';
import type { AstroSettings } from '../types/astro.js';

export const ASTRO_RENDERERS_MODULE_ID = 'virtual:astro:renderers';
export const RESOLVED_ASTRO_RENDERERS_MODULE_ID = `\0${ASTRO_RENDERERS_MODULE_ID}`;

interface PluginOptions {
	settings: AstroSettings;
}

export default function vitePluginRenderers(options: PluginOptions): VitePlugin {
	const renderers = options.settings.renderers;

	return {
		name: 'astro:plugin-renderers',
		enforce: 'pre',

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
	};
}
