import { createRedirectsFromAstroRoutes } from '@astrojs/underscore-redirects';
import type { AstroAdapter, AstroConfig, AstroIntegration, RouteData } from 'astro';
import esbuild from 'esbuild';
import * as fs from 'node:fs';
import * as os from 'node:os';
import { sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import glob from 'tiny-glob';

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
				supportedAstroFeatures: {
					hybridOutput: 'stable',
					staticOutput: 'unsupported',
					serverOutput: 'stable',
					assets: {
						supportKind: 'unsupported',
						isSharpCompatible: false,
						isSquooshCompatible: false,
					},
				},
		  }
		: {
				name: '@astrojs/cloudflare',
				serverEntrypoint: '@astrojs/cloudflare/server.advanced.js',
				exports: ['default'],
				supportedAstroFeatures: {
					hybridOutput: 'stable',
					staticOutput: 'unsupported',
					serverOutput: 'stable',
					assets: {
						supportKind: 'stable',
						isSharpCompatible: false,
						isSquooshCompatible: false,
					},
				},
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

					// Cloudflare env is only available per request. This isn't feasible for code that access env vars
					// in a global way, so we shim their access as `process.env.*`. We will populate `process.env` later
					// in its fetch handler.
					vite.define = {
						'process.env': 'process.env',
						...vite.define,
					};
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
					const entryPointsURL = [..._entryPoints.values()];
					const entryPaths = entryPointsURL.map((entry) => fileURLToPath(entry));
					const outputUrl = new URL('$astro', _buildConfig.server);
					const outputDir = fileURLToPath(outputUrl);

					await esbuild.build({
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
					});

					const outputFiles: Array<string> = await glob(`**/*`, {
						cwd: outputDir,
						filesOnly: true,
					});

					// move the files into the functions folder
					// & make sure the file names match Cloudflare syntax for routing
					for (const outputFile of outputFiles) {
						const path = outputFile.split(sep);

						const finalSegments = path.map((segment) =>
							segment
								.replace(/(\_)(\w+)(\_)/g, (_, __, prop) => {
									return `[${prop}]`;
								})
								.replace(/(\_\-\-\-)(\w+)(\_)/g, (_, __, prop) => {
									return `[[${prop}]]`;
								})
						);

						finalSegments[finalSegments.length - 1] = finalSegments[finalSegments.length - 1]
							.replace('entry.', '')
							.replace(/(.*)\.(\w+)\.(\w+)$/g, (_, fileName, __, newExt) => {
								return `${fileName}.${newExt}`;
							});

						const finalDirPath = finalSegments.slice(0, -1).join(sep);
						const finalPath = finalSegments.join(sep);

						const newDirUrl = new URL(finalDirPath, functionsUrl);
						await fs.promises.mkdir(newDirUrl, { recursive: true });

						const oldFileUrl = new URL(`$astro/${outputFile}`, outputUrl);
						const newFileUrl = new URL(finalPath, functionsUrl);
						await fs.promises.rename(oldFileUrl, newFileUrl);
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

					const redirectRoutes: [RouteData, string][] = routes
						.filter((r) => r.type === 'redirect')
						.map((r) => {
							return [r, ''];
						});
					const trueRedirects = createRedirectsFromAstroRoutes({
						config: _config,
						routeToDynamicTargetMap: new Map(Array.from(redirectRoutes)),
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
