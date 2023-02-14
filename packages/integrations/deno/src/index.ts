import type { AstroAdapter, AstroIntegration } from 'astro';
import esbuild from 'esbuild';
import * as fs from 'fs';
import * as npath from 'path';
import { fileURLToPath } from 'url';
import * as CONSTANT from './code-constant'

interface BuildConfig {
	server: URL;
	serverEntry: string;
}

interface Options {
	port?: number;
	hostname?: string;
}

const SHIM = `globalThis.process = {
	argv: [],
	env: Deno.env.toObject(),
};`;

export function getAdapter(args?: Options): AstroAdapter {
	return {
		name: '@astrojs/deno',
		serverEntrypoint: '@astrojs/deno/server.js',
		args: args ?? {},
		exports: ['stop', 'handle', 'start', 'running'],
	};
}

export default function createIntegration(args?: Options): AstroIntegration {
	let _buildConfig: BuildConfig;
	let _vite: any;
	let needsBuildConfig = false;
	return {
		name: '@astrojs/deno',
		hooks: {
			'astro:config:done': ({ setAdapter, config }) => {
				needsBuildConfig = !config.build.client;
				setAdapter(getAdapter(args));
				_buildConfig = config.build;

				if (config.output === 'static') {
					console.warn(`[@astrojs/deno] \`output: "server"\` is required to use this adapter.`);
					console.warn(
						`[@astrojs/deno] Otherwise, this adapter is not required to deploy a static site to Deno.`
					);
				}
			},
			'astro:build:start': ({ buildConfig }) => {
				// Backwards compat
				if (needsBuildConfig) {
					_buildConfig = buildConfig;
				}
			},
			'astro:build:setup': ({ vite, target }) => {
				if (target === 'server') {
					_vite = vite;
					vite.resolve = vite.resolve || {};
					vite.resolve.alias = vite.resolve.alias || {};

					const aliases = [{ find: 'react-dom/server', replacement: 'react-dom/server.browser' }];

					if (Array.isArray(vite.resolve.alias)) {
						vite.resolve.alias = [...vite.resolve.alias, ...aliases];
					} else {
						for (const alias of aliases) {
							(vite.resolve.alias as Record<string, string>)[alias.find] = alias.replacement;
						}
					}

					vite.ssr = {
						noExternal: true,
					};
				}
			},
			'astro:build:done': async () => {
				const entryUrl = new URL(_buildConfig.serverEntry, _buildConfig.server);
				const pth = fileURLToPath(entryUrl);
				const content = await fs.readFileSync(pth, 'utf8')
				await fs.writeFileSync(pth, `${CONSTANT.DEFAULTIMPORT}\n${content}\n${CONSTANT.DEFAULTSTART}`);
				await esbuild.build({
					target: 'es2020',
					platform: 'browser',
					entryPoints: [pth],
					outfile: pth,
					allowOverwrite: true,
					format: 'esm',
					bundle: true,
					external: ['@astrojs/markdown-remark'],
					banner: {
						js: SHIM,
					},
				});

				// Remove chunks, if they exist. Since we have bundled via esbuild these chunks are trash.
				try {
					const chunkFileNames =
						_vite?.build?.rollupOptions?.output?.chunkFileNames ?? 'chunks/chunk.[hash].mjs';
					const chunkPath = npath.dirname(chunkFileNames);
					const chunksDirUrl = new URL(chunkPath + '/', _buildConfig.server);
					await fs.promises.rm(chunksDirUrl, { recursive: true, force: true });
				} catch {}
			},
		},
	};
}
