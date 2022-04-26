import type { AstroAdapter, AstroConfig, AstroIntegration } from 'astro';
import type { PathLike } from 'fs';

import fs from 'fs/promises';
import { fileURLToPath } from 'url';
import esbuild from 'esbuild';
import { getTransformedRoutes, Redirect, Rewrite } from '@vercel/routing-utils';

const writeJson = (path: PathLike, data: any) =>
	fs.writeFile(path, JSON.stringify(data), { encoding: 'utf-8' });

export function getAdapter({ edge }: { edge: boolean }): AstroAdapter {
	return {
		name: '@astrojs/vercel',
		serverEntrypoint: `@astrojs/vercel/${edge ? 'edge' : 'serverless'}`,
		exports: ['default'],
	};
}

export interface Options {
	edge?: boolean;
}

export default function vercel({ edge = false }: Options = {}): AstroIntegration {
	let _config: AstroConfig;
	let _serverOut: URL;
	let _serverEntry: string;

	return {
		name: '@astrojs/vercel',
		hooks: {
			'astro:config:setup': ({ config }) => {
				config.outDir = new URL('./.vercel/output/', config.root);
			},
			'astro:config:done': ({ setAdapter, config }) => {
				if (edge) {
					throw new Error('The `edge` option is not yet supported.');
				}

				setAdapter(getAdapter({ edge }));
				_config = config;
			},
			'astro:build:setup': ({ vite, target }) => {
				if (!edge && target === 'server') {
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
				buildConfig.serverEntry = _serverEntry = 'entry.js';
				buildConfig.client = new URL('./static/', _config.outDir);
				buildConfig.server = _serverOut = new URL('./functions/render.func/', _config.outDir);

				if (String(process.env.ENABLE_VC_BUILD) !== '1') {
					console.warn(
						`The enviroment variable "ENABLE_VC_BUILD" was not found. Make sure you have it set to "1" in your Vercel project.\nLearn how to set enviroment variables here: https://vercel.com/docs/concepts/projects/environment-variables`
					);
				}
			},
			'astro:build:done': async ({ routes }) => {
				const entryPath = fileURLToPath(new URL(_serverEntry, _serverOut));

				// Bundle dependencies
				await esbuild.build({
					entryPoints: [entryPath],
					outfile: entryPath,
					bundle: true,
					target: 'node14',
					allowOverwrite: true,
					...(edge ? { format: 'esm', platform: 'browser' } : { format: 'cjs', platform: 'node' }),
				});

				if (edge) {
					// Edge function config
					// https://vercel.com/docs/build-output-api/v3#vercel-primitives/edge-functions/configuration
					await writeJson(new URL(`./.vc-config.json`, _serverOut), {
						runtime: 'edge',
						entrypoint: _serverEntry,
					});
				} else {
					// Serverless function config
					// https://vercel.com/docs/build-output-api/v3#vercel-primitives/serverless-functions/configuration
					await writeJson(new URL(`./.vc-config.json`, _serverOut), {
						runtime: 'nodejs14.x',
						handler: _serverEntry,
						launcherType: 'Nodejs',
					});
				}

				let rewrites: Rewrite[] = [];
				let redirects: Redirect[] = [];

				for (const route of routes) {
					const path =
						_config.base +
						route.segments
							.map((segments) =>
								segments
									.map((part) =>
										part.spread
											? `:${part.content}*`
											: part.dynamic
											? `:${part.content}`
											: part.content
									)
									.join('')
							)
							.join('/');

					rewrites.push({
						source: path,
						destination: '/render',
					});

					if (_config.trailingSlash === 'always') {
						redirects.push({
							source: path,
							destination: path + '/',
						});
					} else if (_config.trailingSlash === 'never') {
						redirects.push({
							source: path + '/',
							destination: path,
						});
					}
				}

				const transformedRoutes = getTransformedRoutes({
					nowConfig: {
						rewrites: [],
						redirects:
							_config.trailingSlash !== 'ignore'
								? routes
										.filter((route) => route.type === 'page' && !route.pathname?.endsWith('/'))
										.map((route) => {
											const path =
												'/' +
												route.segments
													.map((segments) =>
														segments
															.map((part) =>
																part.spread
																	? `:${part.content}*`
																	: part.dynamic
																	? `:${part.content}`
																	: part.content
															)
															.join('')
													)
													.join('/');

											let source, destination;

											if (_config.trailingSlash === 'always') {
												source = path;
												destination = path + '/';
											} else {
												source = path + '/';
												destination = path;
											}

											return { source, destination, statusCode: 308 };
										})
								: [],
					},
				});

				if (transformedRoutes.error) {
					throw new Error(JSON.stringify(transformedRoutes.error, null, 2));
				}

				// Output configuration
				// https://vercel.com/docs/build-output-api/v3#build-output-configuration
				await writeJson(new URL(`./config.json`, _config.outDir), {
					version: 3,
					routes: transformedRoutes.routes,
				});
			},
		},
	};
}
