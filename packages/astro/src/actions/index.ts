import fsMod from 'node:fs';
import type { Plugin as VitePlugin } from 'vite';
import type { AstroIntegration } from '../@types/astro.js';
import { ActionsWithoutServerOutputError } from '../core/errors/errors-data.js';
import { AstroError } from '../core/errors/errors.js';
import { isServerLikeOutput, viteID } from '../core/util.js';
import { ACTIONS_TYPES_FILE, RESOLVED_VIRTUAL_MODULE_ID, VIRTUAL_MODULE_ID } from './consts.js';

export default function astroActions({ fs = fsMod }: { fs?: typeof fsMod }): AstroIntegration {
	return {
		name: VIRTUAL_MODULE_ID,
		hooks: {
			async 'astro:config:setup'(params) {
				if (!isServerLikeOutput(params.config)) {
					const error = new AstroError(ActionsWithoutServerOutputError);
					error.stack = undefined;
					throw error;
				}

				const stringifiedActionsImport = JSON.stringify(
					viteID(new URL('./actions', params.config.srcDir))
				);
				params.updateConfig({
					vite: {
						define: {
							'import.meta.env.ACTIONS_PATH': stringifiedActionsImport,
						},
						plugins: [vitePluginActions(fs)],
					},
				});

				params.injectRoute({
					pattern: '/_actions/[...path]',
					entrypoint: 'astro/actions/runtime/route.js',
					prerender: false,
				});

				params.addMiddleware({
					entrypoint: 'astro/actions/runtime/middleware.js',
					order: 'post',
				});

				await typegen({
					stringifiedActionsImport,
					root: params.config.root,
					fs,
				});
			},
		},
	};
}

const vitePluginActions = (fs: typeof fsMod): VitePlugin => ({
	name: VIRTUAL_MODULE_ID,
	enforce: 'pre',
	resolveId(id) {
		if (id === VIRTUAL_MODULE_ID) {
			return RESOLVED_VIRTUAL_MODULE_ID;
		}
	},
	async load(id, opts) {
		if (id !== RESOLVED_VIRTUAL_MODULE_ID) return;

		let code = await fs.promises.readFile(
			new URL('../../templates/actions.mjs', import.meta.url),
			'utf-8'
		);
		if (opts?.ssr) {
			code += `\nexport * from 'astro/actions/runtime/virtual/server.js';`;
		} else {
			code += `\nexport * from 'astro/actions/runtime/virtual/client.js';`;
		}
		return code;
	},
});

async function typegen({
	stringifiedActionsImport,
	root,
	fs,
}: {
	stringifiedActionsImport: string;
	root: URL;
	fs: typeof fsMod;
}) {
	const content = `declare module "astro:actions" {
	type Actions = typeof import(${stringifiedActionsImport})["server"];

	export const actions: Actions;
}`;

	const dotAstroDir = new URL('.astro/', root);

	await fs.promises.mkdir(dotAstroDir, { recursive: true });
	await fs.promises.writeFile(new URL(ACTIONS_TYPES_FILE, dotAstroDir), content);
}
