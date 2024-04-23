import type { AstroIntegration } from 'astro';
import { addDts, addVitePlugin } from 'astro-integration-kit';
import { readFile } from 'node:fs/promises';

const VIRTUAL_MODULE_ID = 'astro:actions';
const RESOLVED_VIRTUAL_MODULE_ID = `\0${VIRTUAL_MODULE_ID}`;

export default function astroActions(): AstroIntegration {
	return {
		name: 'astro-actions',
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
					entrypoint: '@astrojs/actions/route.js',
					prerender: false,
				});
				params.addMiddleware({
					entrypoint: '@astrojs/actions/middleware.js',
					order: 'pre',
				});
				addDts(params, {
					name: 'astro-actions',
					content: `declare module "astro:actions" {
	type Actions = typeof import(${stringifiedActionsPath})["default"];

	export const actions: Actions;
}`,
				});

				addVitePlugin(params, {
					plugin: {
						name: 'astro-actions',
						enforce: 'pre',
						resolveId(id) {
							if (id === VIRTUAL_MODULE_ID) {
								return RESOLVED_VIRTUAL_MODULE_ID;
							}
						},
						async load(id) {
							if (id === RESOLVED_VIRTUAL_MODULE_ID) {
								return await readFile(new URL('../virtual.js', import.meta.url), 'utf-8');
							}
						},
					},
				});
			},
		},
	};
}
