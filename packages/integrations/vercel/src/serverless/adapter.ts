import type { AstroAdapter, AstroConfig, AstroIntegration, RouteData } from 'astro';

import glob from 'fast-glob';
import { basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import { pathToFileURL } from 'url';
import {
	defaultImageConfig,
	getImageConfig,
	throwIfAssetsNotEnabled,
	type VercelImageConfig,
} from '../image/shared.js';
import { exposeEnv } from '../lib/env.js';
import { getVercelOutput, removeDir, writeJson } from '../lib/fs.js';
import { copyDependenciesToFunction } from '../lib/nft.js';
import { getRedirects } from '../lib/redirects.js';
import { generateEdgeMiddleware } from './middleware.js';

const PACKAGE_NAME = '@astrojs/vercel/serverless';
export const ASTRO_LOCALS_HEADER = 'x-astro-locals';
export const VERCEL_EDGE_MIDDLEWARE_FILE = 'vercel-edge-middleware';

function getAdapter(): AstroAdapter {
	return {
		name: PACKAGE_NAME,
		serverEntrypoint: `${PACKAGE_NAME}/entrypoint`,
		exports: ['default'],
	};
}

export interface VercelServerlessConfig {
	includeFiles?: string[];
	excludeFiles?: string[];
	analytics?: boolean;
	imageService?: boolean;
	imagesConfig?: VercelImageConfig;
}

export default function vercelServerless({
	includeFiles,
	excludeFiles,
	analytics,
	imageService,
	imagesConfig,
}: VercelServerlessConfig = {}): AstroIntegration {
	let _config: AstroConfig;
	let buildTempFolder: URL;
	let serverEntry: string;
	let _entryPoints: Map<RouteData, URL>;

	async function createFunctionFolder(funcName: string, entry: URL, inc: URL[]) {
		const functionFolder = new URL(`./functions/${funcName}.func/`, _config.outDir);

		// Copy necessary files (e.g. node_modules/)
		const { handler } = await copyDependenciesToFunction({
			entry,
			outDir: functionFolder,
			includeFiles: inc,
			excludeFiles: excludeFiles?.map((file) => new URL(file, _config.root)) || [],
		});

		// Enable ESM
		// https://aws.amazon.com/blogs/compute/using-node-js-es-modules-and-top-level-await-in-aws-lambda/
		await writeJson(new URL(`./package.json`, functionFolder), {
			type: 'module',
		});

		// Serverless function config
		// https://vercel.com/docs/build-output-api/v3#vercel-primitives/serverless-functions/configuration
		await writeJson(new URL(`./.vc-config.json`, functionFolder), {
			runtime: getRuntime(),
			handler,
			launcherType: 'Nodejs',
		});
	}

	const filesToInclude = includeFiles?.map((file) => new URL(file, _config.root)) || [];

	return {
		name: PACKAGE_NAME,
		hooks: {
			'astro:config:setup': ({ command, config, updateConfig, injectScript }) => {
				if (command === 'build' && analytics) {
					injectScript('page', 'import "@astrojs/vercel/analytics"');
				}
				const outDir = getVercelOutput(config.root);
				const viteDefine = exposeEnv(['VERCEL_ANALYTICS_ID']);
				updateConfig({
					outDir,
					build: {
						serverEntry: 'entry.mjs',
						client: new URL('./static/', outDir),
						server: new URL('./dist/', config.root),
					},
					vite: {
						define: viteDefine,
					},
					...getImageConfig(imageService, imagesConfig, command),
				});
			},
			'astro:config:done': ({ setAdapter, config }) => {
				throwIfAssetsNotEnabled(config, imageService);
				setAdapter(getAdapter());
				_config = config;
				buildTempFolder = config.build.server;
				serverEntry = config.build.serverEntry;

				if (config.output === 'static') {
					throw new Error(`
		[@astrojs/vercel] \`output: "server"\` or \`output: "hybrid"\` is required to use the serverless adapter.

	`);
				}
			},

			'astro:build:ssr': async ({ entryPoints, middlewareEntryPoint }) => {
				_entryPoints = entryPoints;
				if (middlewareEntryPoint) {
					const outPath = fileURLToPath(buildTempFolder);
					const vercelEdgeMiddlewareHandlerPath = new URL(
						VERCEL_EDGE_MIDDLEWARE_FILE,
						_config.srcDir
					);
					const bundledMiddlewarePath = await generateEdgeMiddleware(
						middlewareEntryPoint,
						outPath,
						vercelEdgeMiddlewareHandlerPath
					);
					// let's tell the adapter that we need to save this file
					filesToInclude.push(bundledMiddlewarePath);
				}
			},

			'astro:build:done': async ({ routes }) => {
				// Merge any includes from `vite.assetsInclude
				if (_config.vite.assetsInclude) {
					const mergeGlobbedIncludes = (globPattern: unknown) => {
						if (typeof globPattern === 'string') {
							const entries = glob.sync(globPattern).map((p) => pathToFileURL(p));
							filesToInclude.push(...entries);
						} else if (Array.isArray(globPattern)) {
							for (const pattern of globPattern) {
								mergeGlobbedIncludes(pattern);
							}
						}
					};

					mergeGlobbedIncludes(_config.vite.assetsInclude);
				}

				const routeDefinitions: { src: string; dest: string }[] = [];

				// Multiple entrypoint support
				if (_entryPoints.size) {
					for (const [route, entryFile] of _entryPoints) {
						const func = basename(entryFile.toString()).replace(/\.mjs$/, '');
						await createFunctionFolder(func, entryFile, filesToInclude);
						routeDefinitions.push({
							src: route.pattern.source,
							dest: func,
						});
					}
				} else {
					await createFunctionFolder(
						'render',
						new URL(serverEntry, buildTempFolder),
						filesToInclude
					);
					routeDefinitions.push({ src: '/.*', dest: 'render' });
				}

				// Output configuration
				// https://vercel.com/docs/build-output-api/v3#build-output-configuration
				await writeJson(new URL(`./config.json`, _config.outDir), {
					version: 3,
					routes: [...getRedirects(routes, _config), { handle: 'filesystem' }, ...routeDefinitions],
					...(imageService || imagesConfig
						? { images: imagesConfig ? imagesConfig : defaultImageConfig }
						: {}),
				});

				// Remove temporary folder
				await removeDir(buildTempFolder);
			},
		},
	};
}

function getRuntime() {
	const version = process.version.slice(1); // 'v16.5.0' --> '16.5.0'
	const major = version.split('.')[0]; // '16.5.0' --> '16'
	return `nodejs${major}.x`;
}
