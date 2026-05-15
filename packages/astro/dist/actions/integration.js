import { AstroError } from '../core/errors/errors.js';
import { ActionsWithoutServerOutputError } from '../core/errors/errors-data.js';
import { hasNonPrerenderedRoute } from '../core/routing/helpers.js';
import { viteID } from '../core/util.js';
import { ACTION_RPC_ROUTE_PATTERN, ACTIONS_TYPES_FILE, VIRTUAL_MODULE_ID } from './consts.js';
function astroIntegrationActionsRouteHandler({ settings, filename }) {
	return {
		name: VIRTUAL_MODULE_ID,
		hooks: {
			async 'astro:config:setup'() {
				settings.injectedRoutes.push({
					pattern: ACTION_RPC_ROUTE_PATTERN,
					entrypoint: 'astro/actions/runtime/entrypoints/route.js',
					prerender: false,
					origin: 'internal',
				});
			},
			'astro:config:done': async (params) => {
				const stringifiedActionsImport = JSON.stringify(
					viteID(new URL(`./${filename}`, params.config.srcDir)),
				);
				settings.injectedTypes.push({
					filename: ACTIONS_TYPES_FILE,
					content: `declare module "astro:actions" {
		export const actions: typeof import(${stringifiedActionsImport})["server"];
}`,
				});
			},
			'astro:routes:resolved': ({ routes }) => {
				if (!settings.config.adapter && !hasNonPrerenderedRoute(routes)) {
					const error = new AstroError(ActionsWithoutServerOutputError);
					error.stack = void 0;
					throw error;
				}
			},
		},
	};
}
export { astroIntegrationActionsRouteHandler as default };
