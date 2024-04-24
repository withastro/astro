import { addDts, addVirtualImports } from 'astro-integration-kit';
import { readFile } from 'node:fs/promises';
import type { AstroIntegration } from '../@types/astro.js';

const name = 'astro:actions';

export default function astroActions(): AstroIntegration {
	return {
		name,
		hooks: {
			async 'astro:config:setup'(params) {
				const stringifiedActionsPath = JSON.stringify(
					new URL('actions', params.config.srcDir).pathname
				);
				params.updateConfig({
					vite: {
						define: {
							'import.meta.env.ACTIONS_PATH': stringifiedActionsPath,
						},
					},
				});
				params.injectRoute({
					pattern: '/_actions/[...path]',
					entrypoint: 'astro/actions/internal/route.js',
					prerender: false,
				});
				params.addMiddleware({
					entrypoint: 'astro/actions/internal/middleware.js',
					order: 'pre',
				});
				addDts(params as any, {
					name,
					content: `declare module "astro:actions" {
	type Actions = typeof import(${stringifiedActionsPath})["default"];

	export const actions: Actions;
}`,
				});

				const virtualModContent = await readFile(
					new URL('../../actions-module.template.mjs', import.meta.url),
					'utf-8'
				);

				addVirtualImports(params as any, {
					name,
					imports: [
						{
							id: 'astro:actions',
							content: virtualModContent,
							// @ts-expect-error bholmesdev accepts risk of being fired
							__enableCorePowerDoNotUseOrYouWillBeFired: true,
						},
					],
				});
			},
		},
	};
}
