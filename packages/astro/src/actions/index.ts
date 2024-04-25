import { existsSync } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import type { AstroIntegration } from '../@types/astro.js';
import { ACTIONS_TYPES_FILE, RESOLVED_VIRTUAL_MODULE_ID, VIRTUAL_MODULE_ID } from './consts.js';
import type { Plugin as VitePlugin } from 'vite';

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
						plugins: [vitePluginActions],
					},
				});

				params.injectRoute({
					pattern: '/_actions/[...path]',
					entrypoint: 'astro/actions/runtime/route.js',
					prerender: false,
				});

				params.addMiddleware({
					entrypoint: 'astro/actions/runtime/middleware.js',
					order: 'pre',
				});

				await typegen({
					stringifiedActionsPath,
					root: params.config.root,
				});
			},
		},
	};
}

const vitePluginActions: VitePlugin = {
	name: 'astro:actions',
	enforce: 'pre',
	resolveId(id) {
		if (id === VIRTUAL_MODULE_ID) {
			return RESOLVED_VIRTUAL_MODULE_ID;
		}
	},
	async load(id, opts) {
		if (id !== RESOLVED_VIRTUAL_MODULE_ID) return;

		let code = await readFile(
			new URL('../../actions-module.template.mjs', import.meta.url),
			'utf-8'
		);
		if (opts?.ssr) {
			code += `\nexport * from 'astro/actions/runtime/virtual/server.js';`;
		} else {
			code += `\nexport * from 'astro/actions/runtime/virtual/client.js';`;
		}
		return code;
	},
};

async function typegen({
	stringifiedActionsPath,
	root,
}: { stringifiedActionsPath: string; root: URL }) {
	const content = `declare module "astro:actions" {
	type Actions = typeof import(${stringifiedActionsPath})["default"];

	export const actions: Actions;
}`;

	const dotAstroDir = new URL('.astro/', root);

	if (!existsSync(dotAstroDir)) {
		await mkdir(dotAstroDir);
	}

	await writeFile(new URL(ACTIONS_TYPES_FILE, dotAstroDir), content);
}
