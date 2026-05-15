import { ASTRO_VITE_ENVIRONMENT_NAMES } from '../core/constants.js';
import { hasNonPrerenderedRoute } from '../core/routing/helpers.js';
const ASTRO_RENDERERS_MODULE_ID = 'virtual:astro:renderers';
const RESOLVED_ASTRO_RENDERERS_MODULE_ID = `\0${ASTRO_RENDERERS_MODULE_ID}`;
function vitePluginRenderers(options) {
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
				if (
					options.command === 'build' &&
					this.environment.name === ASTRO_VITE_ENVIRONMENT_NAMES.ssr &&
					renderers.length > 0 &&
					!options.serverIslandsState.hasIslands() &&
					!hasNonPrerenderedRoute(options.routesList.routes, {
						includeEndpoints: false,
						includeExternal: true,
					})
				) {
					return { code: `export const renderers = [];` };
				}
				if (renderers.length > 0) {
					const imports = [];
					const exports = [];
					let i = 0;
					let rendererItems = '';
					for (const renderer of renderers) {
						const variable = `_renderer${i}`;
						imports.push(`import ${variable} from ${JSON.stringify(renderer.serverEntrypoint)};`);
						rendererItems += `Object.assign(${JSON.stringify(renderer)}, { ssr: ${variable} }),`;
						i++;
					}
					exports.push(`export const renderers = [${rendererItems}];`);
					return {
						code: `${imports.join('\n')}
${exports.join('\n')}`,
					};
				}
				return { code: `export const renderers = [];` };
			},
		},
	};
}
export { ASTRO_RENDERERS_MODULE_ID, vitePluginRenderers as default };
