import type {
	AstroAdapter,
	AstroConfig,
	AstroIntegration,
	AstroIntegrationLogger,
	RouteData,
} from 'astro';
import { AstroError } from 'astro/errors';
import glob from 'fast-glob';
import { basename } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import {
	getAstroImageConfig,
	getDefaultImageConfig,
	type DevImageService,
	type VercelImageConfig,
} from '../image/shared.js';
import { getVercelOutput, removeDir, writeJson } from '../lib/fs.js';
import { copyDependenciesToFunction } from '../lib/nft.js';
import { getRedirects } from '../lib/redirects.js';
import {
	getSpeedInsightsViteConfig,
	type VercelSpeedInsightsConfig,
} from '../lib/speed-insights.js';
import {
	getInjectableWebAnalyticsContent,
	type VercelWebAnalyticsConfig,
} from '../lib/web-analytics.js';
import { generateEdgeMiddleware } from './middleware.js';

const PACKAGE_NAME = '@astrojs/vercel/serverless';
export const ASTRO_LOCALS_HEADER = 'x-astro-locals';
export const VERCEL_EDGE_MIDDLEWARE_FILE = 'vercel-edge-middleware';

// https://vercel.com/docs/concepts/functions/serverless-functions/runtimes/node-js#node.js-version
const SUPPORTED_NODE_VERSIONS: Record<
	string,
	{ status: 'current' } | { status: 'beta' } | { status: 'deprecated'; removal: Date }
> = {
	16: { status: 'deprecated', removal: new Date('February 6 2024') },
	18: { status: 'current' },
	20: { status: 'beta' },
};

function getAdapter({
	edgeMiddleware,
	functionPerRoute,
}: {
	edgeMiddleware: boolean;
	functionPerRoute: boolean;
}): AstroAdapter {
	return {
		name: PACKAGE_NAME,
		serverEntrypoint: `${PACKAGE_NAME}/entrypoint`,
		exports: ['default'],
		adapterFeatures: {
			edgeMiddleware,
			functionPerRoute,
		},
		supportedAstroFeatures: {
			hybridOutput: 'stable',
			staticOutput: 'stable',
			serverOutput: 'stable',
			assets: {
				supportKind: 'stable',
				isSharpCompatible: true,
				isSquooshCompatible: true,
			},
		},
	};
}

export interface VercelServerlessConfig {
	/** Configuration for [Vercel Web Analytics](https://vercel.com/docs/concepts/analytics). */
	webAnalytics?: VercelWebAnalyticsConfig;

	/**
	 * @deprecated This option lets you configure the legacy speed insights API which is now deprecated by Vercel.
	 *
	 * See [Vercel Speed Insights Quickstart](https://vercel.com/docs/speed-insights/quickstart) for instructions on how to use the library instead.
	 *
	 * https://vercel.com/docs/speed-insights/quickstart
	 */
	speedInsights?: VercelSpeedInsightsConfig;

	/** Force files to be bundled with your function. This is helpful when you notice missing files. */
	includeFiles?: string[];

	/** Exclude any files from the bundling process that would otherwise be included. */
	excludeFiles?: string[];

	/** When enabled, an Image Service powered by the Vercel Image Optimization API will be automatically configured and used in production. In development, the image service specified by devImageService will be used instead. */
	imageService?: boolean;

	/** Configuration options for [Vercel’s Image Optimization API](https://vercel.com/docs/concepts/image-optimization). See [Vercel’s image configuration documentation](https://vercel.com/docs/build-output-api/v3/configuration#images) for a complete list of supported parameters. */
	imagesConfig?: VercelImageConfig;

	/** Allows you to configure which image service to use in development when imageService is enabled. */
	devImageService?: DevImageService;

	/** Whether to create the Vercel Edge middleware from an Astro middleware in your code base. */
	edgeMiddleware?: boolean;

	/** Whether to split builds into a separate function for each route. */
	functionPerRoute?: boolean;

	/** The maximum duration (in seconds) that Serverless Functions can run before timing out. See the [Vercel documentation](https://vercel.com/docs/functions/serverless-functions/runtimes#maxduration) for the default and maximum limit for your account plan. */
	maxDuration?: number;
}

export default function vercelServerless({
	webAnalytics,
	speedInsights,
	includeFiles,
	excludeFiles = [],
	imageService,
	imagesConfig,
	devImageService = 'sharp',
	functionPerRoute = false,
	edgeMiddleware = false,
	maxDuration,
}: VercelServerlessConfig = {}): AstroIntegration {
	if (maxDuration) {
		if (typeof maxDuration !== 'number') {
			throw new TypeError(`maxDuration must be a number`, { cause: maxDuration });
		}
		if (maxDuration <= 0) {
			throw new TypeError(`maxDuration must be a positive number`, { cause: maxDuration });
		}
	}

	let _config: AstroConfig;
	let buildTempFolder: URL;
	let serverEntry: string;
	let _entryPoints: Map<RouteData, URL>;
	// Extra files to be merged with `includeFiles` during build
	const extraFilesToInclude: URL[] = [];

	const NTF_CACHE = Object.create(null);

	return {
		name: PACKAGE_NAME,
		hooks: {
			'astro:config:setup': async ({ command, config, updateConfig, injectScript, logger }) => {
				if (maxDuration && maxDuration > 900) {
					logger.warn(
						`maxDuration is set to ${maxDuration} seconds, which is longer than the maximum allowed duration of 900 seconds.`
					);
					logger.warn(
						`Please make sure that your plan allows for this duration. See https://vercel.com/docs/functions/serverless-functions/runtimes#maxduration for more information.`
					);
				}

				if (webAnalytics?.enabled) {
					injectScript(
						'head-inline',
						await getInjectableWebAnalyticsContent({
							mode: command === 'dev' ? 'development' : 'production',
						})
					);
				}
				if (command === 'build' && speedInsights?.enabled) {
					injectScript('page', 'import "@astrojs/vercel/speed-insights"');
				}
				const outDir = getVercelOutput(config.root);
				updateConfig({
					outDir,
					build: {
						serverEntry: 'entry.mjs',
						client: new URL('./static/', outDir),
						server: new URL('./dist/', config.root),
						redirects: false,
					},
					vite: {
						...getSpeedInsightsViteConfig(speedInsights?.enabled),
						ssr: {
							external: ['@vercel/nft'],
						},
					},
					...getAstroImageConfig(
						imageService,
						imagesConfig,
						command,
						devImageService,
						config.image
					),
				});
			},
			'astro:config:done': ({ setAdapter, config, logger }) => {
				if (functionPerRoute === true) {
					logger.warn(
						`\n` +
							`\tVercel's hosting plans might have limits to the number of functions you can create.\n` +
							`\tMake sure to check your plan carefully to avoid incurring additional costs.\n` +
							`\tYou can set functionPerRoute: false to prevent surpassing the limit.\n`
					);
				}
				setAdapter(getAdapter({ functionPerRoute, edgeMiddleware }));
				_config = config;
				buildTempFolder = config.build.server;
				serverEntry = config.build.serverEntry;

				if (config.output === 'static') {
					throw new AstroError(
						'`output: "server"` or `output: "hybrid"` is required to use the serverless adapter.'
					);
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
					extraFilesToInclude.push(bundledMiddlewarePath);
				}
			},
			'astro:build:done': async ({ routes, logger }) => {
				// Merge any includes from `vite.assetsInclude
				if (_config.vite.assetsInclude) {
					const mergeGlobbedIncludes = (globPattern: unknown) => {
						if (typeof globPattern === 'string') {
							const entries = glob.sync(globPattern).map((p) => pathToFileURL(p));
							extraFilesToInclude.push(...entries);
						} else if (Array.isArray(globPattern)) {
							for (const pattern of globPattern) {
								mergeGlobbedIncludes(pattern);
							}
						}
					};

					mergeGlobbedIncludes(_config.vite.assetsInclude);
				}

				const routeDefinitions: { src: string; dest: string }[] = [];
				const filesToInclude = includeFiles?.map((file) => new URL(file, _config.root)) || [];
				filesToInclude.push(...extraFilesToInclude);

				const runtime = getRuntime(process, logger);

				// Multiple entrypoint support
				if (_entryPoints.size) {
					const getRouteFuncName = (route: RouteData) => route.component.replace('src/pages/', '');

					const getFallbackFuncName = (entryFile: URL) =>
						basename(entryFile.toString())
							.replace('entry.', '')
							.replace(/\.mjs$/, '');

					for (const [route, entryFile] of _entryPoints) {
						const func = route.component.startsWith('src/pages/')
							? getRouteFuncName(route)
							: getFallbackFuncName(entryFile);

						await createFunctionFolder({
							functionName: func,
							runtime,
							entry: entryFile,
							config: _config,
							logger,
							NTF_CACHE,
							includeFiles: filesToInclude,
							excludeFiles,
							maxDuration,
						});
						routeDefinitions.push({
							src: route.pattern.source,
							dest: func,
						});
					}
				} else {
					await createFunctionFolder({
						functionName: 'render',
						runtime,
						entry: new URL(serverEntry, buildTempFolder),
						config: _config,
						logger,
						NTF_CACHE,
						includeFiles: filesToInclude,
						excludeFiles,
						maxDuration,
					});
					for (const route of routes) {
						if (route.prerender) continue;
						routeDefinitions.push({
							src: route.pattern.source,
							dest: 'render',
						});
					}
				}
				const fourOhFourRoute = routes.find((route) => route.pathname === '/404');
				// Output configuration
				// https://vercel.com/docs/build-output-api/v3#build-output-configuration
				await writeJson(new URL(`./config.json`, _config.outDir), {
					version: 3,
					routes: [
						...getRedirects(routes, _config),
						{
							src: `^/${_config.build.assets}/(.*)$`,
							headers: { 'cache-control': 'public, max-age=31536000, immutable' },
							continue: true,
						},
						{ handle: 'filesystem' },
						...routeDefinitions,
						...(fourOhFourRoute
							? [
									{
										src: '/.*',
										dest: fourOhFourRoute.prerender ? '/404.html' : 'render',
										status: 404,
									},
								]
							: []),
					],
					...(imageService || imagesConfig
						? {
								images: imagesConfig
									? {
											...imagesConfig,
											domains: [...imagesConfig.domains, ..._config.image.domains],
											remotePatterns: [
												...(imagesConfig.remotePatterns ?? []),
												..._config.image.remotePatterns,
											],
										}
									: getDefaultImageConfig(_config.image),
							}
						: {}),
				});

				// Remove temporary folder
				await removeDir(buildTempFolder);
			},
		},
	};
}

type Runtime = `nodejs${string}.x`;

interface CreateFunctionFolderArgs {
	functionName: string;
	runtime: Runtime;
	entry: URL;
	config: AstroConfig;
	logger: AstroIntegrationLogger;
	NTF_CACHE: any;
	includeFiles: URL[];
	excludeFiles: string[];
	maxDuration: number | undefined;
}

async function createFunctionFolder({
	functionName,
	runtime,
	entry,
	config,
	logger,
	NTF_CACHE,
	includeFiles,
	excludeFiles,
	maxDuration,
}: CreateFunctionFolderArgs) {
	// .vercel/output/functions/<name>.func/
	const functionFolder = new URL(`./functions/${functionName}.func/`, config.outDir);
	const packageJson = new URL(`./functions/${functionName}.func/package.json`, config.outDir);
	const vcConfig = new URL(`./functions/${functionName}.func/.vc-config.json`, config.outDir);

	// Copy necessary files (e.g. node_modules/)
	const { handler } = await copyDependenciesToFunction(
		{
			entry,
			outDir: functionFolder,
			includeFiles,
			excludeFiles: excludeFiles.map((file) => new URL(file, config.root)),
			logger,
		},
		NTF_CACHE
	);

	// Enable ESM
	// https://aws.amazon.com/blogs/compute/using-node-js-es-modules-and-top-level-await-in-aws-lambda/
	await writeJson(packageJson, { type: 'module' });

	// Serverless function config
	// https://vercel.com/docs/build-output-api/v3#vercel-primitives/serverless-functions/configuration
	await writeJson(vcConfig, {
		runtime,
		handler,
		launcherType: 'Nodejs',
		maxDuration,
		supportsResponseStreaming: true,
	});
}

function getRuntime(process: NodeJS.Process, logger: AstroIntegrationLogger): Runtime {
	const version = process.version.slice(1); // 'v18.19.0' --> '18.19.0'
	const major = version.split('.')[0]; // '18.19.0' --> '18'
	const support = SUPPORTED_NODE_VERSIONS[major];
	if (support === undefined) {
		logger.warn(
			`\n` +
				`\tThe local Node.js version (${major}) is not supported by Vercel Serverless Functions.\n` +
				`\tYour project will use Node.js 18 as the runtime instead.\n` +
				`\tConsider switching your local version to 18.\n`
		);
	}
	if (support.status === 'current') {
		return `nodejs${major}.x`;
	} else if (support?.status === 'beta') {
		logger.warn(
			`Your project is being built for Node.js ${major} as the runtime, which is currently in beta for Vercel Serverless Functions.`
		);
		return `nodejs${major}.x`;
	} else if (support.status === 'deprecated') {
		const removeDate = new Intl.DateTimeFormat(undefined, { dateStyle: 'long' }).format(
			support.removal
		);
		logger.warn(
			`\n` +
				`\tYour project is being built for Node.js ${major} as the runtime.\n` +
				`\tThis version is deprecated by Vercel Serverless Functions, and scheduled to be disabled on ${removeDate}.\n` +
				`\tConsider upgrading your local version to 18.\n`
		);
		return `nodejs${major}.x`;
	} else {
		logger.warn(
			`\n` +
				`\tThe local Node.js version (${major}) is not supported by Vercel Serverless Functions.\n` +
				`\tYour project will use Node.js 18 as the runtime instead.\n` +
				`\tConsider switching your local version to 18.\n`
		);
		return 'nodejs18.x';
	}
	return `nodejs${major}.x`;
}
