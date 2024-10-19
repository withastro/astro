import type { AstroIntegration, AstroSettings } from '../@types/astro.js';
import { ActionsWithoutServerOutputError } from '../core/errors/errors-data.js';
import { AstroError } from '../core/errors/errors.js';
import { isServerLikeOutput, viteID } from '../core/util.js';
import { ACTIONS_TYPES_FILE, VIRTUAL_MODULE_ID } from './consts.js';

/**
 * This integration is applied when the user is using Actions in their project.
 * It will inject the necessary routes and middlewares to handle actions.
 */
export default function astroIntegrationActionsRouteHandler({
	settings,
}: {
	settings: AstroSettings;
}): AstroIntegration {
	return {
		name: VIRTUAL_MODULE_ID,
		hooks: {
			async 'astro:config:setup'(params) {
				params.injectRoute({
					pattern: '/_actions/[...path]',
					entrypoint: 'astro/actions/runtime/route.js',
					prerender: false,
				});

				params.addMiddleware({
					entrypoint: 'astro/actions/runtime/middleware.js',
					order: 'post',
				});
			},
			'astro:config:done': async (params) => {
				if (!isServerLikeOutput(params.config)) {
					const error = new AstroError(ActionsWithoutServerOutputError);
					error.stack = undefined;
					throw error;
				}

				const stringifiedActionsImport = JSON.stringify(
					viteID(new URL('./actions', params.config.srcDir)),
				);
				settings.injectedTypes.push({
					filename: ACTIONS_TYPES_FILE,
					content: `declare module "astro:actions" {
	type Actions = typeof import(${stringifiedActionsImport})["server"];

	export const actions: Actions;
}`,
				});
			},
		},
	};
}
