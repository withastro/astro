import { existsSync, readFileSync } from 'node:fs';
import { basename } from 'node:path';
import { pathToFileURL } from 'node:url';
import { removeDir, writeJson } from '@astrojs/internal-helpers/fs';
import type {
	AstroAdapter,
	AstroConfig,
	AstroIntegration,
	AstroIntegrationLogger,
	IntegrationRouteData,
} from 'astro';
import { AstroError } from 'astro/errors';
import glob from 'fast-glob';
import {
	type DevImageService,
	type VercelImageConfig,
	getAstroImageConfig,
	getDefaultImageConfig,
} from '../image/shared.js';
import { copyDependenciesToFunction } from '../lib/nft.js';
import { escapeRegex, getRedirects } from '../lib/redirects.js';
import {
	type VercelWebAnalyticsConfig,
	getInjectableWebAnalyticsContent,
} from '../lib/web-analytics.js';
import { generateEdgeMiddleware } from './middleware.js';

const PACKAGE_NAME = '@astrojs/vercel/serverless';

/**
 * The edge function calls the node server at /_render,
 * with the original path as the value of this header.
 */
export const ASTRO_PATH_HEADER = 'x-astro-path';
export const ASTRO_PATH_PARAM = 'x_astro_path';

/**
 * The edge function calls the node server at /_render,
 * with the locals serialized into this header.
 */
export const ASTRO_LOCALS_HEADER = 'x-astro-locals';
export const ASTRO_MIDDLEWARE_SECRET_HEADER = 'x-astro-middleware-secret';
export const VERCEL_EDGE_MIDDLEWARE_FILE = 'vercel-edge-middleware';

// Vercel routes the folder names to a path on the deployed website.
// We attempt to avoid interfering by prefixing with an underscore.
export const NODE_PATH = '_render';
const MIDDLEWARE_PATH = '_middleware';

// This isn't documented by vercel anywhere, but unlike serverless
// and edge functions, isr functions are not passed the original path.
// Instead, we have to use $0 to refer to the regex match from "src".
const ISR_PATH = `/_isr?${ASTRO_PATH_PARAM}=$0`;

// https://vercel.com/docs/concepts/functions/serverless-functions/runtimes/node-js#node.js-version
const SUPPORTED_NODE_VERSIONS: Record<
	string,
	| { status: 'default' }
	| { status: 'beta' }
	| { status: 'retiring'; removal: Date | string; warnDate: Date }
	| { status: 'deprecated'; removal: Date }
> = {
	18: { status: 'retiring', removal: 'Early 2025', warnDate: new Date('October 1 2024') },
	20: { status: 'default' },
};

function getAdapter({
	edgeMiddleware,
	middlewareSecret,
	skewProtection,
}: {
	edgeMiddleware: boolean;
	middlewareSecret: string;
	skewProtection: boolean;
}): AstroAdapter {
	return {
		name: PACKAGE_NAME,
		serverEntrypoint: `${PACKAGE_NAME}/entrypoint`,
		exports: ['default'],
		args: { middlewareSecret, skewProtection },
		adapterFeatures: {
			edgeMiddleware,
			buildOutput: 'server',
		},
		supportedAstroFeatures: {
			hybridOutput: 'stable',
			staticOutput: 'stable',
			serverOutput: 'stable',
			sharpImageService: 'stable',
			i18nDomains: 'experimental',
			envGetSecret: 'stable',
		},
	};
}

export interface VercelServerlessConfig {
	/** Configuration for [Vercel Web Analytics](https://vercel.com/docs/concepts/analytics). */
	webAnalytics?: VercelWebAnalyticsConfig;

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

	/** The maximum duration (in seconds) that Serverless Functions can run before timing out. See the [Vercel documentation](https://vercel.com/docs/functions/serverless-functions/runtimes#maxduration) for the default and maximum limit for your account plan. */
	maxDuration?: number;

	/** Whether to cache on-demand rendered pages in the same way as static files. */
	isr?: boolean | VercelISRConfig;
	/**
	 * It enables Vercel skew protection: https://vercel.com/docs/deployments/skew-protection
	 */
	skewProtection?: boolean;
}

interface VercelISRConfig {
	/**
	 * A secret random string that you create.
	 * Its presence in the `__prerender_bypass` cookie will result in fresh responses being served, bypassing the cache. See Vercel’s documentation on [Draft Mode](https://vercel.com/docs/build-output-api/v3/features#draft-mode) for more information.
	 * Its presence in the `x-prerender-revalidate` header will result in a fresh response which will then be cached for all future requests to be used. See Vercel’s documentation on [On-Demand Incremental Static Regeneration (ISR)](https://vercel.com/docs/build-output-api/v3/features#on-demand-incremental-static-regeneration-isr) for more information.
	 *
	 * @default `undefined`
	 */
	bypassToken?: string;

	/**
	 * Expiration time (in seconds) before the pages will be re-generated.
	 *
	 * Setting to `false` means that the page will stay cached as long as the current deployment is in production.
	 *
	 * @default `false`
	 */
	expiration?: number | false;

	/**
	 * Paths that will always be served by a serverless function instead of an ISR function.
	 *
	 * @default `[]`
	 */
	exclude?: string[];
}

export default function vercelServerless({
	webAnalytics,
	includeFiles: _includeFiles = [],
	excludeFiles: _excludeFiles = [],
	imageService,
	imagesConfig,
	devImageService = 'sharp',
	edgeMiddleware = false,
	maxDuration,
	isr = false,
	skewProtection = false,
}: VercelServerlessConfig = {}): AstroIntegration {
	if (maxDuration) {
		if (typeof maxDuration !== 'number') {
			// biome-ignore lint/style/noUnusedTemplateLiteral: <explanation>
			throw new TypeError(`maxDuration must be a number`, { cause: maxDuration });
		}
		if (maxDuration <= 0) {
			// biome-ignore lint/style/noUnusedTemplateLiteral: <explanation>
			throw new TypeError(`maxDuration must be a positive number`, { cause: maxDuration });
		}
	}

	let _config: AstroConfig;
	let _buildTempFolder: URL;
	let _serverEntry: string;
	let _entryPoints: Map<IntegrationRouteData, URL>;
	let _middlewareEntryPoint: URL | undefined;
	// Extra files to be merged with `includeFiles` during build
	const extraFilesToInclude: URL[] = [];
	// Secret used to verify that the caller is the astro-generated edge middleware and not a third-party
	const middlewareSecret = crypto.randomUUID();

	return {
		name: PACKAGE_NAME,
		hooks: {
			'astro:config:setup': async ({ command, config, updateConfig, injectScript, logger }) => {
				if (maxDuration && maxDuration > 900) {
					logger.warn(
						`maxDuration is set to ${maxDuration} seconds, which is longer than the maximum allowed duration of 900 seconds.`
					);
					logger.warn(
						// biome-ignore lint/style/noUnusedTemplateLiteral: <explanation>
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

				const vercelConfigPath = new URL('vercel.json', config.root);
				if (existsSync(vercelConfigPath)) {
					try {
						const vercelConfig = JSON.parse(readFileSync(vercelConfigPath, 'utf-8'));
						if (vercelConfig.trailingSlash === true && config.trailingSlash === 'always') {
							logger.warn(
								'\n' +
									`\tYour "vercel.json" \`trailingSlash\` configuration (set to \`true\`) will conflict with your Astro \`trailinglSlash\` configuration (set to \`"always"\`).\n` +
									// biome-ignore lint/style/noUnusedTemplateLiteral: <explanation>
									`\tThis would cause infinite redirects under certain conditions and throw an \`ERR_TOO_MANY_REDIRECTS\` error.\n` +
									`\tTo prevent this, your Astro configuration is updated to \`"ignore"\` during builds.\n`
							);
							updateConfig({
								trailingSlash: 'ignore',
							});
						}
					} catch (_err) {
						logger.warn(`Your "vercel.json" config is not a valid json file.`);
					}
				}

				updateConfig({
					outDir: new URL('./.vercel/output/', config.root),
					build: {
						client: new URL('./.vercel/output/static/', config.root),
						server: new URL('./.vercel/output/_functions/', config.root),
						redirects: false,
					},
					vite: {
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
			'astro:config:done': ({ setAdapter, config }) => {
				setAdapter(getAdapter({ edgeMiddleware, middlewareSecret, skewProtection }));

				_config = config;
				_buildTempFolder = config.build.server;
				_serverEntry = config.build.serverEntry;
			},
			'astro:build:ssr': async ({ entryPoints, middlewareEntryPoint }) => {
				_entryPoints = new Map(
					Array.from(entryPoints).filter(([routeData]) => !routeData.prerender)
				);
				_middlewareEntryPoint = middlewareEntryPoint;
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

				const routeDefinitions: Array<{
					src: string;
					dest: string;
					middlewarePath?: string;
				}> = [];

				const includeFiles = _includeFiles
					.map((file) => new URL(file, _config.root))
					.concat(extraFilesToInclude);
				const excludeFiles = _excludeFiles.map((file) => new URL(file, _config.root));

				const builder = new VercelBuilder(_config, excludeFiles, includeFiles, logger, maxDuration);

				// Multiple entrypoint support
				if (_entryPoints.size) {
					const getRouteFuncName = (route: IntegrationRouteData) =>
						route.component.replace('src/pages/', '');

					const getFallbackFuncName = (entryFile: URL) =>
						basename(entryFile.toString())
							.replace('entry.', '')
							.replace(/\.mjs$/, '');

					for (const [route, entryFile] of _entryPoints) {
						const func = route.component.startsWith('src/pages/')
							? getRouteFuncName(route)
							: getFallbackFuncName(entryFile);

						await builder.buildServerlessFolder(entryFile, func, _config.root);

						routeDefinitions.push({
							src: route.pattern.source,
							dest: func,
						});
					}
				} else {
					const entryFile = new URL(_serverEntry, _buildTempFolder);
					if (isr) {
						const isrConfig = typeof isr === 'object' ? isr : {};
						await builder.buildServerlessFolder(entryFile, NODE_PATH, _config.root);
						if (isrConfig.exclude?.length) {
							const dest = _middlewareEntryPoint ? MIDDLEWARE_PATH : NODE_PATH;
							for (const route of isrConfig.exclude) {
								// vercel interprets src as a regex pattern, so we need to escape it
								routeDefinitions.push({ src: escapeRegex(route), dest });
							}
						}
						await builder.buildISRFolder(entryFile, '_isr', isrConfig, _config.root);
						for (const route of routes) {
							const src = route.pattern.source;
							const dest = src.startsWith('^\\/_image') ? NODE_PATH : ISR_PATH;
							if (!route.prerender) routeDefinitions.push({ src, dest });
						}
					} else {
						await builder.buildServerlessFolder(entryFile, NODE_PATH, _config.root);
						const dest = _middlewareEntryPoint ? MIDDLEWARE_PATH : NODE_PATH;
						for (const route of routes) {
							if (!route.prerender) routeDefinitions.push({ src: route.pattern.source, dest });
						}
					}
				}
				if (_middlewareEntryPoint) {
					await builder.buildMiddlewareFolder(
						_middlewareEntryPoint,
						MIDDLEWARE_PATH,
						middlewareSecret
					);
				}
				const fourOhFourRoute = routes.find((route) => route.pathname === '/404');
				// Output configuration
				// https://vercel.com/docs/build-output-api/v3#build-output-configuration
				// biome-ignore lint/style/noUnusedTemplateLiteral: <explanation>
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
										dest: fourOhFourRoute.prerender
											? '/404.html'
											: _middlewareEntryPoint
												? MIDDLEWARE_PATH
												: NODE_PATH,
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
				await removeDir(_buildTempFolder);
			},
		},
	};
}

type Runtime = `nodejs${string}.x`;

class VercelBuilder {
	readonly NTF_CACHE = {};

	constructor(
		readonly config: AstroConfig,
		readonly excludeFiles: URL[],
		readonly includeFiles: URL[],
		readonly logger: AstroIntegrationLogger,
		readonly maxDuration?: number,
		readonly runtime = getRuntime(process, logger)
	) {}

	async buildServerlessFolder(entry: URL, functionName: string, root: URL) {
		const { config, includeFiles, excludeFiles, logger, NTF_CACHE, runtime, maxDuration } = this;
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
				excludeFiles,
				logger,
				root,
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
			handler: handler.replaceAll('\\', '/'),
			launcherType: 'Nodejs',
			maxDuration,
			supportsResponseStreaming: true,
		});
	}

	async buildISRFolder(entry: URL, functionName: string, isr: VercelISRConfig, root: URL) {
		await this.buildServerlessFolder(entry, functionName, root);
		const prerenderConfig = new URL(
			`./functions/${functionName}.prerender-config.json`,
			this.config.outDir
		);
		// https://vercel.com/docs/build-output-api/v3/primitives#prerender-configuration-file
		await writeJson(prerenderConfig, {
			expiration: isr.expiration ?? false,
			bypassToken: isr.bypassToken,
			allowQuery: [ASTRO_PATH_PARAM],
			passQuery: true,
		});
	}

	async buildMiddlewareFolder(entry: URL, functionName: string, middlewareSecret: string) {
		const functionFolder = new URL(`./functions/${functionName}.func/`, this.config.outDir);

		await generateEdgeMiddleware(
			entry,
			this.config.root,
			new URL(VERCEL_EDGE_MIDDLEWARE_FILE, this.config.srcDir),
			new URL('./middleware.mjs', functionFolder),
			middlewareSecret,
			this.logger
		);

		// biome-ignore lint/style/noUnusedTemplateLiteral: <explanation>
		await writeJson(new URL(`./.vc-config.json`, functionFolder), {
			runtime: 'edge',
			entrypoint: 'middleware.mjs',
		});
	}
}

function getRuntime(process: NodeJS.Process, logger: AstroIntegrationLogger): Runtime {
	const version = process.version.slice(1); // 'v18.19.0' --> '18.19.0'
	const major = version.split('.')[0]; // '18.19.0' --> '18'
	const support = SUPPORTED_NODE_VERSIONS[major];
	if (support === undefined) {
		logger.warn(
			// biome-ignore lint/style/useTemplate: <explanation>
			// biome-ignore lint/style/noUnusedTemplateLiteral: <explanation>
			`\n` +
				`\tThe local Node.js version (${major}) is not supported by Vercel Serverless Functions.\n` +
				// biome-ignore lint/style/noUnusedTemplateLiteral: <explanation>
				`\tYour project will use Node.js 18 as the runtime instead.\n` +
				// biome-ignore lint/style/noUnusedTemplateLiteral: <explanation>
				`\tConsider switching your local version to 18.\n`
		);
		return 'nodejs18.x';
	}
	if (support.status === 'default') {
		return `nodejs${major}.x`;
	}
	if (support.status === 'retiring') {
		if (support.warnDate && new Date() >= support.warnDate) {
			logger.warn(
				`Your project is being built for Node.js ${major} as the runtime, which is retiring by ${support.removal}.`
			);
		}
		return `nodejs${major}.x`;
	}
	if (support.status === 'beta') {
		logger.warn(
			`Your project is being built for Node.js ${major} as the runtime, which is currently in beta for Vercel Serverless Functions.`
		);
		return `nodejs${major}.x`;
	}
	if (support.status === 'deprecated') {
		const removeDate = new Intl.DateTimeFormat(undefined, { dateStyle: 'long' }).format(
			support.removal
		);
		logger.warn(
			// biome-ignore lint/style/useTemplate: <explanation>
			// biome-ignore lint/style/noUnusedTemplateLiteral: <explanation>
			`\n` +
				`\tYour project is being built for Node.js ${major} as the runtime.\n` +
				`\tThis version is deprecated by Vercel Serverless Functions, and scheduled to be disabled on ${removeDate}.\n` +
				// biome-ignore lint/style/noUnusedTemplateLiteral: <explanation>
				`\tConsider upgrading your local version to 18.\n`
		);
		return `nodejs${major}.x`;
	}
	return 'nodejs18.x';
}
