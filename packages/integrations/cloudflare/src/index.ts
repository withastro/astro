import { createRedirectsFromAstroRoutes } from '@astrojs/underscore-redirects';
import type { AstroAdapter, AstroConfig, AstroIntegration, RouteData } from 'astro';
import esbuild from 'esbuild';
import * as fs from 'fs';
import * as os from 'os';
import { dirname } from 'path';
import glob from 'tiny-glob';
import { fileURLToPath, pathToFileURL } from 'url';

type Options = {
	mode: 'directory' | 'advanced';
};

interface BuildConfig {
	server: URL;
	client: URL;
	serverEntry: string;
	split?: boolean;
}

export function getAdapter(isModeDirectory: boolean): AstroAdapter {
	return isModeDirectory
		? {
				name: '@astrojs/cloudflare',
				serverEntrypoint: '@astrojs/cloudflare/server.directory.js',
				exports: ['onRequest', 'manifest'],
		  }
		: {
				name: '@astrojs/cloudflare',
				serverEntrypoint: '@astrojs/cloudflare/server.advanced.js',
				exports: ['default'],
		  };
}

const SHIM = `globalThis.process = {
	argv: [],
	env: {},
};`;

const SERVER_BUILD_FOLDER = '/$server_build/';

export default function createIntegration(args?: Options): AstroIntegration {
	let _config: AstroConfig;
	let _buildConfig: BuildConfig;
	const isModeDirectory = args?.mode === 'directory';
	let _entryPoints = new Map<RouteData, URL>();

	return {
		name: '@astrojs/cloudflare',
		hooks: {
			'astro:config:setup': ({ config, updateConfig }) => {
				updateConfig({
					build: {
						client: new URL(`.${config.base}`, config.outDir),
						server: new URL(`.${SERVER_BUILD_FOLDER}`, config.outDir),
						serverEntry: '_worker.mjs',
						redirects: false,
					},
				});
			},
			'astro:config:done': ({ setAdapter, config }) => {
				setAdapter(getAdapter(isModeDirectory));
				_config = config;
				_buildConfig = config.build;

				if (config.output === 'static') {
					throw new Error(`
  [@astrojs/cloudflare] \`output: "server"\` or \`output: "hybrid"\` is required to use this adapter. Otherwise, this adapter is not necessary to deploy a static site to Cloudflare.

`);
				}

				if (config.base === SERVER_BUILD_FOLDER) {
					throw new Error(`
  [@astrojs/cloudflare] \`base: "${SERVER_BUILD_FOLDER}"\` is not allowed. Please change your \`base\` config to something else.`);
				}
			},
			'astro:build:setup': ({ vite, target }) => {
				if (target === 'server') {
					vite.resolve ||= {};
					vite.resolve.alias ||= {};

					const aliases = [{ find: 'react-dom/server', replacement: 'react-dom/server.browser' }];

					if (Array.isArray(vite.resolve.alias)) {
						vite.resolve.alias = [...vite.resolve.alias, ...aliases];
					} else {
						for (const alias of aliases) {
							(vite.resolve.alias as Record<string, string>)[alias.find] = alias.replacement;
						}
					}
					vite.ssr ||= {};
					vite.ssr.target = 'webworker';
				}
			},
			'astro:build:ssr': ({ entryPoints }) => {
				_entryPoints = entryPoints;
			},
			'astro:build:done': async ({ pages, routes, dir }) => {
				const functionsUrl = new URL('functions/', _config.root);

				if (isModeDirectory) {
					await fs.promises.mkdir(functionsUrl, { recursive: true });
				}

				if (isModeDirectory && _buildConfig.split) {
					const entryPointsRouteData = [..._entryPoints.keys()];
					const entryPointsURL = [..._entryPoints.values()];
					const entryPaths = entryPointsURL.map((entry) => fileURLToPath(entry));
					const outputDir = fileURLToPath(new URL('.astro', _buildConfig.server));

					// NOTE: AFAIK, esbuild keeps the order of the entryPoints array
					const { outputFiles } = await esbuild.build({
						target: 'es2020',
						platform: 'browser',
						conditions: ['workerd', 'worker', 'browser'],
						entryPoints: entryPaths,
						outdir: outputDir,
						allowOverwrite: true,
						format: 'esm',
						bundle: true,
						minify: _config.vite?.build?.minify !== false,
						banner: {
							js: SHIM,
						},
						logOverride: {
							'ignored-bare-import': 'silent',
						},
						write: false,
					});

					// loop through all bundled files and write them to the functions folder
					for (const [index, outputFile] of outputFiles.entries()) {
						// we need to make sure the filename in the functions folder
						// matches to cloudflares routing capabilities (see their docs)
						// IN: src/pages/[language]/files/[...path].astro
						// OUT: [language]/files/[[path]].js
						const fileName = entryPointsRouteData[index].component
							.replace('src/pages/', '')
							.replace('.astro', '.js')
							.replace(/(\[\.\.\.)(\w+)(\])/g, (_match, _p1, p2) => {
								return `[[${p2}]]`;
							});

						const fileUrl = new URL(fileName, functionsUrl);
						const newFileDir = dirname(fileURLToPath(fileUrl));
						if (!fs.existsSync(newFileDir)) {
							fs.mkdirSync(newFileDir, { recursive: true });
						}
						await fs.promises.writeFile(fileUrl, outputFile.contents);
					}
				} else {
					const entryPath = fileURLToPath(new URL(_buildConfig.serverEntry, _buildConfig.server));
					const entryUrl = new URL(_buildConfig.serverEntry, _config.outDir);
					const buildPath = fileURLToPath(entryUrl);
					// A URL for the final build path after renaming
					const finalBuildUrl = pathToFileURL(buildPath.replace(/\.mjs$/, '.js'));

					await esbuild.build({
						target: 'es2020',
						platform: 'browser',
						conditions: ['workerd', 'worker', 'browser'],
						entryPoints: [entryPath],
						outfile: buildPath,
						allowOverwrite: true,
						format: 'esm',
						bundle: true,
						minify: _config.vite?.build?.minify !== false,
						banner: {
							js: SHIM,
						},
						logOverride: {
							'ignored-bare-import': 'silent',
						},
					});

					// Rename to worker.js
					await fs.promises.rename(buildPath, finalBuildUrl);

					if (isModeDirectory) {
						const directoryUrl = new URL('[[path]].js', functionsUrl);
						await fs.promises.rename(finalBuildUrl, directoryUrl);
					}
				}

				// // // throw the server folder in the bin
				const serverUrl = new URL(_buildConfig.server);
				await fs.promises.rm(serverUrl, { recursive: true, force: true });

				// move cloudflare specific files to the root
				const cloudflareSpecialFiles = ['_headers', '_redirects', '_routes.json'];
				if (_config.base !== '/') {
					for (const file of cloudflareSpecialFiles) {
						try {
							await fs.promises.rename(
								new URL(file, _buildConfig.client),
								new URL(file, _config.outDir)
							);
						} catch (e) {
							// ignore
						}
					}
				}

				const routesExists = await fs.promises
					.stat(new URL('./_routes.json', _config.outDir))
					.then((stat) => stat.isFile())
					.catch(() => false);

				// this creates a _routes.json, in case there is none present to enable
				// cloudflare to handle static files and support _redirects configuration
				// (without calling the function)
				if (!routesExists) {
					const staticPathList: Array<string> = (
						await glob(`${fileURLToPath(_buildConfig.client)}/**/*`, {
							cwd: fileURLToPath(_config.outDir),
							filesOnly: true,
						})
					)
						.filter((file: string) => cloudflareSpecialFiles.indexOf(file) < 0)
						.map((file: string) => `/${file}`);

					for (let page of pages) {
						let pagePath = prependForwardSlash(page.pathname);
						if (_config.base !== '/') {
							const base = _config.base.endsWith('/') ? _config.base.slice(0, -1) : _config.base;
							pagePath = `${base}${pagePath}`;
						}
						staticPathList.push(pagePath);
					}

					const redirectsExists = await fs.promises
						.stat(new URL('./_redirects', _config.outDir))
						.then((stat) => stat.isFile())
						.catch(() => false);

					// convert all redirect source paths into a list of routes
					// and add them to the static path
					if (redirectsExists) {
						const redirects = (
							await fs.promises.readFile(new URL('./_redirects', _config.outDir), 'utf-8')
						)
							.split(os.EOL)
							.map((line) => {
								const parts = line.split(' ');
								if (parts.length < 2) {
									return null;
								} else {
									// convert /products/:id to /products/*
									return (
										parts[0]
											.replace(/\/:.*?(?=\/|$)/g, '/*')
											// remove query params as they are not supported by cloudflare
											.replace(/\?.*$/, '')
									);
								}
							})
							.filter(
								(line, index, arr) => line !== null && arr.indexOf(line) === index
							) as string[];

						if (redirects.length > 0) {
							staticPathList.push(...redirects);
						}
					}

					const redirectRoutes = routes.filter((r) => r.type === 'redirect');
					const trueRedirects = createRedirectsFromAstroRoutes({
						config: _config,
						routes: redirectRoutes,
						dir,
					});
					if (!trueRedirects.empty()) {
						await fs.promises.appendFile(
							new URL('./_redirects', _config.outDir),
							trueRedirects.print()
						);
					}

					await fs.promises.writeFile(
						new URL('./_routes.json', _config.outDir),
						JSON.stringify(
							{
								version: 1,
								include: ['/*'],
								exclude: staticPathList,
							},
							null,
							2
						)
					);
				}
			},
		},
	};
}

function prependForwardSlash(path: string) {
	return path[0] === '/' ? path : '/' + path;
}
