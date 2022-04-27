import type { AstroAdapter, AstroConfig, AstroIntegration } from 'astro';

import { fileURLToPath } from 'url';
import esbuild from 'esbuild';

import { getPattern, writeJson } from './utils.js';

export interface Options {
	/**
	 * - `static`: generates a static website following Vercel's output formats, redirects, etc.
	 * - `serverless`: SSR inside a [Node.js 14 function](https://vercel.com/docs/concepts/functions/serverless-functions).
	 * - `edge`: SSR inside a [Edge function](https://vercel.com/docs/concepts/functions/edge-functions).
	 *
	 * @type {'static' | 'serverless' | 'edge'}
	 * @default {'serverless'}
	 */
	mode?: 'static' | 'serverless' | 'edge';
}

// https://vercel.com/docs/project-configuration#legacy/routes
interface VercelRoute {
	src: string;
	methods?: string[];
	dest?: string;
	headers?: Record<string, string>;
	status?: number;
	continue?: boolean;
}

function getAdapter({ mode }: { mode: NonNullable<Options['mode']> }): AstroAdapter {
	let adapter: AstroAdapter = {
		name: '@astrojs/vercel',
	};

	if (mode !== 'static') {
		adapter.serverEntrypoint = `@astrojs/vercel/${mode}`;
		adapter.exports = ['default'];
	}

	return adapter;
}

export default function vercel({ mode = 'serverless' }: Options = {}): AstroIntegration {
	let _config: AstroConfig;
	let _vercelOut: URL;
	let _functionsFolder: URL;
	let _serverEntry: string;

	return {
		name: '@astrojs/vercel',
		hooks: {
			'astro:config:setup': ({ config }) => {
				_vercelOut = new URL('./.vercel/output/', config.root);

				if (mode === 'static') {
					config.outDir = new URL('./static/', _vercelOut);
					config.build.format = 'directory';
				} else {
					config.outDir = _vercelOut;
				}
			},
			'astro:config:done': ({ setAdapter, config }) => {
				setAdapter(getAdapter({ mode }));
				_config = config;
			},
			'astro:build:setup': ({ vite, target }) => {
				if (mode === 'serverless' && target === 'server') {
					vite.build = {
						...(vite.build || {}),
						rollupOptions: {
							...(vite.build?.rollupOptions || {}),
							output: {
								...(vite.build?.rollupOptions?.output || {}),
								format: 'cjs',
							},
						},
					};
				}
			},
			'astro:build:start': async ({ buildConfig }) => {
				if (String(process.env.ENABLE_VC_BUILD) !== '1') {
					throw new Error(
						`The enviroment variable "ENABLE_VC_BUILD" was not found. Make sure you have it set to "1" in your Vercel project.\nLearn how to set enviroment variables here: https://vercel.com/docs/concepts/projects/environment-variables`
					);
				}

				if (mode === 'static') {
					buildConfig.serverEntry = _serverEntry = 'entry.mjs';
					buildConfig.staticMode = true;
				} else {
					buildConfig.serverEntry = _serverEntry = 'entry.js';
					buildConfig.client = new URL('./static/', _vercelOut);
					buildConfig.server = _functionsFolder = new URL('./functions/render.func/', _vercelOut);
				}
			},
			'astro:build:done': async ({ routes }) => {
				// Build function
				if (mode !== 'static') {
					const entryPath = fileURLToPath(new URL(_serverEntry, _functionsFolder));
					const edge = mode === 'edge';

					// Bundle dependencies
					await esbuild.build({
						entryPoints: [entryPath],
						outfile: entryPath,
						bundle: true,
						target: 'node14',
						allowOverwrite: true,
						...(edge
							? {
									format: 'esm',
									platform: 'browser',
									inject: [fileURLToPath(new URL('./edge/shim.js', import.meta.url))],
							  }
							: { format: 'cjs', platform: 'node' }),
					});

					if (edge) {
						// Edge function config
						// https://vercel.com/docs/build-output-api/v3#vercel-primitives/edge-functions/configuration
						await writeJson(new URL(`./.vc-config.json`, _functionsFolder), {
							runtime: 'edge',
							entrypoint: _serverEntry,
						});
					} else {
						// Serverless function config
						// https://vercel.com/docs/build-output-api/v3#vercel-primitives/serverless-functions/configuration
						await writeJson(new URL(`./.vc-config.json`, _functionsFolder), {
							runtime: 'nodejs14.x',
							handler: _serverEntry,
							launcherType: 'Nodejs',
						});
					}
				}

				let redirects: VercelRoute[] = [];

				if (_config.trailingSlash === 'always') {
					for (const route of routes) {
						if (route.type !== 'page' || route.segments.length === 0) continue;

						const path = _config.base + getPattern(route);
						redirects.push({
							src: path,
							headers: { Location: path + '/' },
							status: 308,
						});
					}
				} else if (_config.trailingSlash === 'never') {
					for (const route of routes) {
						if (route.type !== 'page' || route.segments.length === 0) continue;

						const path = _config.base + getPattern(route);
						redirects.push({
							src: path + '/',
							headers: { Location: path },
							status: 308,
						});
					}
				}

				// Output configuration
				// https://vercel.com/docs/build-output-api/v3#build-output-configuration
				await writeJson(new URL(`./config.json`, _vercelOut), {
					version: 3,
					routes: [
						...redirects,
						{ handle: 'filesystem' },
						...(mode === 'edge' ? [{ src: '/.*', middlewarePath: 'render' }] : []),
						...(mode === 'serverless' ? [{ src: '/.*', dest: 'render' }] : []),
					],
				});
			},
		},
	};
}
