import type { AstroAdapter, AstroConfig, AstroIntegration } from 'astro';
import esbuild from 'esbuild';
import * as fs from 'fs';
import * as os from 'os';
import glob from 'tiny-glob';
import { fileURLToPath, pathToFileURL } from 'url';

type Options = {
	mode: 'directory' | 'advanced';
};

interface BuildConfig {
	server: URL;
	client: URL;
	serverEntry: string;
}

export function getAdapter(isModeDirectory: boolean): AstroAdapter {
	return isModeDirectory
		? {
				name: '@astrojs/cloudflare',
				serverEntrypoint: '@astrojs/cloudflare/server.directory.js',
				exports: ['onRequest'],
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

	return {
		name: '@astrojs/cloudflare',
		hooks: {
			'astro:config:setup': ({ config, updateConfig }) => {
				updateConfig({
					build: {
						client: new URL(`.${config.base}`, config.outDir),
						server: new URL(`.${SERVER_BUILD_FOLDER}`, config.outDir),
						serverEntry: '_worker.mjs',
					},
				});
			},
			'astro:config:done': ({ setAdapter, config }) => {
				setAdapter(getAdapter(isModeDirectory));
				_config = config;
				_buildConfig = config.build;

				if (config.output === 'static') {
					throw new Error(`
  [@astrojs/cloudflare] \`output: "server"\` is required to use this adapter. Otherwise, this adapter is not necessary to deploy a static site to Cloudflare.

`);
				}

				if (config.base === SERVER_BUILD_FOLDER) {
					throw new Error(`
  [@astrojs/cloudflare] \`base: "${SERVER_BUILD_FOLDER}"\` is not allowed. Please change your \`base\` config to something else.`);
				}
			},
			'astro:build:setup': ({ vite, target }) => {
				if (target === 'server') {
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
					vite.ssr = vite.ssr || {};
					vite.ssr.target = vite.ssr.target || 'webworker';
				}
			},
			'astro:build:done': async ({ pages }) => {
				const entryPath = fileURLToPath(new URL(_buildConfig.serverEntry, _buildConfig.server));
				const entryUrl = new URL(_buildConfig.serverEntry, _config.outDir);
				const buildPath = fileURLToPath(entryUrl);
				// A URL for the final build path after renaming
				const finalBuildUrl = pathToFileURL(buildPath.replace(/\.mjs$/, '.js'));

				await esbuild.build({
					target: 'es2020',
					platform: 'browser',
					entryPoints: [entryPath],
					outfile: buildPath,
					allowOverwrite: true,
					format: 'esm',
					bundle: true,
					minify: true,
					banner: {
						js: SHIM,
					},
					logOverride: {
						'ignored-bare-import': 'silent',
					},
				});

				// Rename to worker.js
				await fs.promises.rename(buildPath, finalBuildUrl);

				// throw the server folder in the bin
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
							const base = _config.base.endsWith('/')
								? _config.base.substring(0, -1)
								: _config.base;
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

				if (isModeDirectory) {
					const functionsUrl = new URL('functions/', _config.root);
					await fs.promises.mkdir(functionsUrl, { recursive: true });

					const directoryUrl = new URL('[[path]].js', functionsUrl);
					await fs.promises.rename(finalBuildUrl, directoryUrl);
				}
			},
		},
	};
}

function prependForwardSlash(path: string) {
	return path[0] === '/' ? path : '/' + path;
}
