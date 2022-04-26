import type { AstroAdapter, AstroConfig, AstroIntegration, RouteData } from 'astro';
import type { PathLike } from 'fs';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';
import esbuild from 'esbuild';

const writeJson = (path: PathLike, data: any) =>
	fs.writeFile(path, JSON.stringify(data), { encoding: 'utf-8' });

const ENTRYFILE = '__astro_entry';

export function getAdapter(): AstroAdapter {
	return {
		name: '@astrojs/vercel',
		serverEntrypoint: '@astrojs/vercel/server-entrypoint',
		exports: ['default'],
	};
}

export default function vercel(): AstroIntegration {
	let _config: AstroConfig;
	let _serverEntry: URL;

	return {
		name: '@astrojs/vercel',
		hooks: {
			'astro:config:setup': ({ config }) => {
				config.outDir = new URL('./.output/', config.root);
				config.build.format = 'directory';
			},
			'astro:config:done': ({ setAdapter, config }) => {
				setAdapter(getAdapter());
				_config = config;
				_serverEntry = new URL(`./server/pages/${ENTRYFILE}.js`, config.outDir);
			},
			'astro:build:setup': ({ vite, target }) => {
				if (target === 'server') {
					vite.build!.rollupOptions = {
						input: [],
						output: {
							format: 'cjs',
							file: fileURLToPath(_serverEntry),
							dir: undefined,
							entryFileNames: undefined,
							chunkFileNames: undefined,
							assetFileNames: undefined,
							inlineDynamicImports: true,
						},
					};
				}
			},
			'astro:build:start': async ({ buildConfig }) => {
				buildConfig.serverEntry = `${ENTRYFILE}.js`;
				buildConfig.client = new URL('./static/', _config.outDir);
				buildConfig.server = new URL('./server/pages/', _config.outDir);

				if (String(process.env.ENABLE_FILE_SYSTEM_API) !== '1') {
					console.warn(
						`The enviroment variable "ENABLE_FILE_SYSTEM_API" was not found. Make sure you have it set to "1" in your Vercel project.\nLearn how to set enviroment variables here: https://vercel.com/docs/concepts/projects/environment-variables`
					);
				}
			},
			'astro:build:done': async ({ routes }) => {
				// Bundle dependecies
				await esbuild.build({
					entryPoints: [fileURLToPath(_serverEntry)],
					outfile: fileURLToPath(_serverEntry),
					bundle: true,
					format: 'cjs',
					platform: 'node',
					target: 'node14',
					allowOverwrite: true,
					minifyWhitespace: true,
				});

				let staticRoutes: RouteData[] = [];
				let dynamicRoutes: RouteData[] = [];

				for (const route of routes) {
					if (route.params.length === 0) staticRoutes.push(route);
					else dynamicRoutes.push(route);
				}

				// Routes Manifest
				// https://vercel.com/docs/file-system-api#configuration/routes
				await writeJson(new URL(`./routes-manifest.json`, _config.outDir), {
					version: 3,
					basePath: '/',
					pages404: false,
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
							: undefined,
					rewrites: staticRoutes.map((route) => {
						let source = route.pathname as string;

						if (
							route.type === 'page' &&
							_config.trailingSlash === 'always' &&
							!source.endsWith('/')
						) {
							source += '/';
						}

						return {
							source,
							regex: route.pattern.toString(),
							destination: `/${ENTRYFILE}`,
						};
					}),
					dynamicRoutes: dynamicRoutes.map((route) => ({
						page: `/${ENTRYFILE}`,
						regex: route.pattern.toString(),
					})),
				});
			},
		},
	};
}
