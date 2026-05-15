import { cpSync, existsSync, mkdirSync, readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { emptyDir, removeDir, writeJson } from '@astrojs/internal-helpers/fs';
import { getTransformedRoutes, normalizeRoutes } from '@vercel/routing-utils';
import { AstroError } from 'astro/errors';
import { globSync } from 'tinyglobby';
import { getAstroImageConfig, getDefaultImageConfig } from './image/shared.js';
import { copyDependenciesToFunction } from './lib/nft.js';
import { escapeRegex, getRedirects } from './lib/redirects.js';
import { getInjectableWebAnalyticsContent } from './lib/web-analytics.js';
import { generateEdgeMiddleware } from './serverless/middleware.js';
import { createConfigPlugin } from './vite-plugin-config.js';
const PACKAGE_NAME = '@astrojs/vercel';
const ASTRO_PATH_HEADER = 'x-astro-path';
const ASTRO_PATH_PARAM = 'x_astro_path';
const ASTRO_LOCALS_HEADER = 'x-astro-locals';
const ASTRO_MIDDLEWARE_SECRET_HEADER = 'x-astro-middleware-secret';
const VERCEL_EDGE_MIDDLEWARE_FILE = 'vercel-edge-middleware';
const NODE_PATH = '_render';
const MIDDLEWARE_PATH = '_middleware';
const ISR_PATH = `/_isr?${ASTRO_PATH_PARAM}=$0`;
const SUPPORTED_NODE_VERSIONS = {
	18: {
		status: 'deprecated',
	},
	20: {
		status: 'available',
	},
	22: {
		status: 'available',
	},
	24: {
		status: 'default',
	},
};
function getAdapter({ middlewareMode, skewProtection, buildOutput, staticHeaders }) {
	return {
		name: PACKAGE_NAME,
		entrypointResolution: 'auto',
		serverEntrypoint: `${PACKAGE_NAME}/entrypoint`,
		adapterFeatures: {
			buildOutput,
			middlewareMode,
			staticHeaders,
		},
		supportedAstroFeatures: {
			hybridOutput: 'stable',
			staticOutput: 'stable',
			serverOutput: 'stable',
			sharpImageService: 'stable',
			i18nDomains: 'experimental',
			envGetSecret: 'stable',
		},
		client: {
			internalFetchHeaders: skewProtection
				? () => {
						const deploymentId = process.env.VERCEL_DEPLOYMENT_ID;
						if (deploymentId) {
							return { 'x-deployment-id': deploymentId };
						}
						return {};
					}
				: void 0,
			assetQueryParams:
				skewProtection && process.env.VERCEL_DEPLOYMENT_ID
					? new URLSearchParams({ dpl: process.env.VERCEL_DEPLOYMENT_ID })
					: void 0,
		},
	};
}
function vercelAdapter({
	webAnalytics,
	includeFiles: _includeFiles = [],
	excludeFiles: _excludeFiles = [],
	imageService,
	imagesConfig,
	devImageService = 'sharp',
	middlewareMode,
	edgeMiddleware,
	maxDuration,
	isr = false,
	skewProtection = process.env.VERCEL_SKEW_PROTECTION_ENABLED === '1',
	staticHeaders = false,
} = {}) {
	const resolvedMiddlewareMode = middlewareMode ?? (edgeMiddleware ? 'edge' : 'classic');
	if (maxDuration) {
		if (typeof maxDuration !== 'number') {
			throw new TypeError(`maxDuration must be a number`, {
				cause: maxDuration,
			});
		}
		if (maxDuration <= 0) {
			throw new TypeError(`maxDuration must be a positive number`, {
				cause: maxDuration,
			});
		}
	}
	let _config;
	let _buildTempFolder;
	let _serverEntry;
	let _middlewareEntryPoint;
	let _routeToHeaders = void 0;
	const extraFilesToInclude = [];
	const middlewareSecret = crypto.randomUUID();
	let _buildOutput;
	let staticDir;
	let routes;
	return {
		name: PACKAGE_NAME,
		hooks: {
			'astro:config:setup': async ({ command, config, updateConfig, injectScript, logger }) => {
				if (webAnalytics?.enabled) {
					injectScript(
						'head-inline',
						await getInjectableWebAnalyticsContent({
							mode: command === 'dev' ? 'development' : 'production',
						}),
					);
				}
				staticDir = new URL('./.vercel/output/static', config.root);
				updateConfig({
					build: {
						format: 'directory',
						redirects: false,
					},
					integrations: [
						{
							name: 'astro:copy-vercel-output',
							hooks: {
								'astro:build:done': async () => {
									logger.info('Copying static files to .vercel/output/static');
									const _staticDir =
										_buildOutput === 'static' ? _config.outDir : _config.build.client;
									cpSync(_staticDir, new URL('./.vercel/output/static/', _config.root), {
										recursive: true,
									});
								},
							},
						},
					],
					vite: {
						ssr: {
							external: ['@vercel/nft'],
						},
						plugins: [
							createConfigPlugin({
								middlewareSecret,
								skewProtection,
							}),
						],
					},
					...getAstroImageConfig(
						imageService,
						imagesConfig,
						command,
						devImageService,
						config.image,
					),
				});
			},
			'astro:routes:resolved': (params) => {
				routes = params.routes;
			},
			'astro:config:done': ({ setAdapter, config, logger, buildOutput }) => {
				_buildOutput = buildOutput;
				if (_buildOutput === 'server') {
					if (maxDuration && maxDuration > 900) {
						logger.warn(
							`maxDuration is set to ${maxDuration} seconds, which is longer than the maximum allowed duration of 900 seconds.`,
						);
						logger.warn(
							`Please make sure that your plan allows for this duration. See https://vercel.com/docs/functions/serverless-functions/runtimes#maxduration for more information.`,
						);
					}
					const vercelConfigPath = new URL('vercel.json', config.root);
					if (
						config.trailingSlash &&
						config.trailingSlash !== 'ignore' &&
						existsSync(vercelConfigPath)
					) {
						try {
							const vercelConfig = JSON.parse(readFileSync(vercelConfigPath, 'utf-8'));
							if (
								(vercelConfig.trailingSlash === true && config.trailingSlash === 'never') ||
								(vercelConfig.trailingSlash === false && config.trailingSlash === 'always')
							) {
								logger.error(
									`
	Your "vercel.json" \`trailingSlash\` configuration (set to \`${vercelConfig.trailingSlash}\`) will conflict with your Astro \`trailingSlash\` configuration (set to \`${JSON.stringify(config.trailingSlash)}\`).
	This would cause infinite redirects or duplicate content issues. 
	Please remove the \`trailingSlash\` configuration from your \`vercel.json\` file or Astro config.
`,
								);
							}
						} catch (_err) {
							logger.warn(`Your "vercel.json" config is not a valid json file.`);
						}
					}
					setAdapter(
						getAdapter({
							buildOutput: _buildOutput,
							middlewareMode: resolvedMiddlewareMode,
							skewProtection,
							staticHeaders,
						}),
					);
				} else {
					setAdapter(
						getAdapter({
							middlewareMode: resolvedMiddlewareMode,
							skewProtection,
							buildOutput: _buildOutput,
							staticHeaders,
						}),
					);
				}
				_config = config;
				_buildTempFolder = config.build.server;
				_serverEntry = config.build.serverEntry;
			},
			'astro:build:start': async () => {
				await emptyDir(new URL('./.vercel/output/', _config.root));
			},
			'astro:build:ssr': async ({ middlewareEntryPoint }) => {
				_middlewareEntryPoint = middlewareEntryPoint;
			},
			'astro:build:generated': ({ routeToHeaders }) => {
				_routeToHeaders = routeToHeaders;
			},
			'astro:build:done': async ({ logger }) => {
				const outDir = new URL('./.vercel/output/', _config.root);
				if (staticDir) {
					if (existsSync(staticDir)) {
						emptyDir(staticDir);
					}
					mkdirSync(new URL('./.vercel/output/static/', _config.root), {
						recursive: true,
					});
					mkdirSync(new URL('./.vercel/output/server/', _config.root));
					if (_buildOutput !== 'static') {
						cpSync(_config.build.server, new URL('./.vercel/output/_functions/', _config.root), {
							recursive: true,
						});
					}
				}
				const routeDefinitions = [];
				if (_buildOutput === 'server') {
					if (_config.vite.assetsInclude) {
						const mergeGlobbedIncludes = (globPattern) => {
							if (typeof globPattern === 'string') {
								const entries = globSync(globPattern).map((p) => pathToFileURL(p));
								extraFilesToInclude.push(...entries);
							} else if (Array.isArray(globPattern)) {
								for (const pattern of globPattern) {
									mergeGlobbedIncludes(pattern);
								}
							}
						};
						mergeGlobbedIncludes(_config.vite.assetsInclude);
					}
					const includeFiles = _includeFiles
						.map((file) => new URL(file, _config.root))
						.concat(extraFilesToInclude);
					const excludeFiles = _excludeFiles.map((file) => new URL(file, _config.root));
					const builder = new VercelBuilder(
						_config,
						excludeFiles,
						includeFiles,
						logger,
						outDir,
						maxDuration,
					);
					const entryFile = new URL(_serverEntry, _buildTempFolder);
					if (isr) {
						const isrConfig = typeof isr === 'object' ? isr : {};
						await builder.buildServerlessFolder(entryFile, NODE_PATH, _config.root);
						if (isrConfig.exclude?.length) {
							const expandedExclusions = isrConfig.exclude.flatMap((exclusion) => {
								if (exclusion instanceof RegExp) {
									return routes
										.filter((route) => exclusion.test(route.pattern))
										.map((route) => route.pattern);
								}
								return [exclusion];
							});
							const dest = _middlewareEntryPoint ? MIDDLEWARE_PATH : NODE_PATH;
							for (const route of expandedExclusions) {
								routeDefinitions.push({
									src: escapeRegex(route),
									dest,
								});
							}
						}
						await builder.buildISRFolder(entryFile, '_isr', isrConfig, _config.root);
						for (const route of routes) {
							const excludeRouteFromIsr = isrConfig.exclude?.some((exclusion) => {
								if (exclusion instanceof RegExp) {
									return exclusion.test(route.pattern);
								}
								return exclusion === route.pattern;
							});
							if (!excludeRouteFromIsr) {
								const src = route.patternRegex.source;
								const dest =
									src.startsWith('^\\/_image') || src.startsWith('^\\/_server-islands')
										? NODE_PATH
										: ISR_PATH;
								if (!route.isPrerendered)
									routeDefinitions.push({
										src,
										dest,
									});
							}
						}
					} else {
						await builder.buildServerlessFolder(entryFile, NODE_PATH, _config.root);
						const dest = _middlewareEntryPoint ? MIDDLEWARE_PATH : NODE_PATH;
						for (const route of routes) {
							if (!route.isPrerendered)
								routeDefinitions.push({
									src: route.patternRegex.source,
									dest,
								});
						}
					}
					if (_middlewareEntryPoint) {
						await builder.buildMiddlewareFolder(
							_middlewareEntryPoint,
							MIDDLEWARE_PATH,
							middlewareSecret,
						);
					}
				}
				const fourOhFourRoute = routes.find((route) => route.pathname === '/404');
				const vercelConfigJson = new URL('./.vercel/output/config.json', _config.root);
				const finalRoutes = [
					{
						src: `^/${_config.build.assets}/(.*)$`,
						headers: {
							'cache-control': 'public, max-age=31536000, immutable',
						},
						continue: true,
					},
				];
				if (_buildOutput === 'server') {
					finalRoutes.push(...routeDefinitions);
				}
				if (fourOhFourRoute) {
					if (_buildOutput === 'server') {
						finalRoutes.push({
							src: '/.*',
							dest: fourOhFourRoute.isPrerendered
								? '/404.html'
								: _middlewareEntryPoint
									? MIDDLEWARE_PATH
									: NODE_PATH,
							status: 404,
						});
					} else {
						finalRoutes.push({
							src: '/.*',
							dest: '/404.html',
							status: 404,
						});
					}
				}
				let trailingSlash;
				if (_config.trailingSlash && _config.trailingSlash !== 'ignore') {
					trailingSlash = _config.trailingSlash === 'always';
				}
				const { routes: redirects = [], error } = getTransformedRoutes({
					trailingSlash,
					rewrites: [],
					redirects: getRedirects(routes, _config),
					headers: [],
				});
				if (error) {
					throw new AstroError(
						`Error generating redirects: ${error.message}`,
						error.link ? `${error.action ?? 'More info'}: ${error.link}` : void 0,
					);
				}
				let images;
				if (imagesConfig) {
					images = {
						...imagesConfig,
						domains:
							imagesConfig.domains || _config.image.domains
								? [...(imagesConfig.domains ?? []), ...(_config.image.domains ?? [])]
								: void 0,
						remotePatterns: [...(imagesConfig.remotePatterns ?? [])],
					};
					const remotePatterns = _config.image.remotePatterns;
					for (const pattern of remotePatterns) {
						if (isAcceptedPattern(pattern)) {
							images.remotePatterns?.push(pattern);
						}
					}
				} else if (imageService) {
					images = getDefaultImageConfig(_config.image);
				}
				const normalized = normalizeRoutes([...(redirects ?? []), ...finalRoutes]);
				if (normalized.error) {
					throw new AstroError(
						`Error generating routes: ${normalized.error.message}`,
						normalized.error.link
							? `${normalized.error.action ?? 'More info'}: ${normalized.error.link}`
							: void 0,
					);
				}
				if (_routeToHeaders && _routeToHeaders.size > 0) {
					if (!normalized.routes) {
						normalized.routes = [];
					}
					if (staticHeaders) {
						const routesWithConfigHeaders = createRoutesWithStaticHeaders(_routeToHeaders, _config);
						const fileSystemRouteIndex = normalized.routes.findIndex(
							(r) => 'handle' in r && r.handle === 'filesystem',
						);
						normalized.routes.splice(fileSystemRouteIndex, 0, ...routesWithConfigHeaders);
					}
				}
				await writeJson(vercelConfigJson, {
					version: 3,
					routes: normalized.routes,
					images,
				});
				if (_buildOutput === 'server') {
					await removeDir(_buildTempFolder);
				}
			},
		},
	};
}
function isAcceptedPattern(pattern) {
	if (pattern == null) {
		return false;
	}
	if (!pattern.hostname) {
		return false;
	}
	if (pattern.protocol && (pattern.protocol !== 'http' || pattern.protocol !== 'https')) {
		return false;
	}
	return true;
}
class VercelBuilder {
	NTF_CACHE = {};
	config;
	excludeFiles;
	includeFiles;
	logger;
	outDir;
	maxDuration;
	runtime;
	constructor(
		config,
		excludeFiles,
		includeFiles,
		logger,
		outDir,
		maxDuration,
		runtime = getRuntime(process, logger),
	) {
		this.config = config;
		this.excludeFiles = excludeFiles;
		this.includeFiles = includeFiles;
		this.logger = logger;
		this.outDir = outDir;
		this.maxDuration = maxDuration;
		this.runtime = runtime;
	}
	async buildServerlessFolder(entry, functionName, root) {
		const { includeFiles, excludeFiles, logger, NTF_CACHE, runtime, maxDuration } = this;
		const functionFolder = new URL(`./functions/${functionName}.func/`, this.outDir);
		const packageJson = new URL(`./functions/${functionName}.func/package.json`, this.outDir);
		const vcConfig = new URL(`./functions/${functionName}.func/.vc-config.json`, this.outDir);
		const { handler } = await copyDependenciesToFunction(
			{
				entry,
				outDir: functionFolder,
				includeFiles,
				excludeFiles,
				logger,
				root,
			},
			NTF_CACHE,
		);
		await writeJson(packageJson, {
			type: 'module',
		});
		await writeJson(vcConfig, {
			runtime,
			handler: handler.replaceAll('\\', '/'),
			launcherType: 'Nodejs',
			maxDuration,
			supportsResponseStreaming: true,
		});
	}
	async buildISRFolder(entry, functionName, isr, root) {
		await this.buildServerlessFolder(entry, functionName, root);
		const prerenderConfig = new URL(
			`./functions/${functionName}.prerender-config.json`,
			this.outDir,
		);
		await writeJson(prerenderConfig, {
			expiration: isr.expiration ?? false,
			bypassToken: isr.bypassToken,
			allowQuery: [ASTRO_PATH_PARAM],
			passQuery: true,
		});
	}
	async buildMiddlewareFolder(entry, functionName, middlewareSecret) {
		const functionFolder = new URL(`./functions/${functionName}.func/`, this.outDir);
		await generateEdgeMiddleware(
			entry,
			this.config.root,
			new URL(VERCEL_EDGE_MIDDLEWARE_FILE, this.config.srcDir),
			new URL('./middleware.mjs', functionFolder),
			middlewareSecret,
			this.logger,
		);
		await writeJson(new URL(`./.vc-config.json`, functionFolder), {
			runtime: 'edge',
			entrypoint: 'middleware.mjs',
		});
	}
}
function getRuntime(process2, logger) {
	const version = process2.version.slice(1);
	const major = version.split('.')[0];
	const support = SUPPORTED_NODE_VERSIONS[major];
	if (support === void 0) {
		logger.warn(
			`
	The local Node.js version (${major}) is not supported by Vercel Serverless Functions.
	Your project will use Node.js 24 as the runtime instead.
	Consider switching your local version to 24.
`,
		);
		return 'nodejs24.x';
	}
	if (support.status === 'default' || support.status === 'available') {
		return `nodejs${major}.x`;
	}
	if (support.status === 'retiring') {
		if (support.warnDate && /* @__PURE__ */ new Date() >= support.warnDate) {
			logger.warn(
				`Your project is being built for Node.js ${major} as the runtime, which is retiring by ${support.removal}.`,
			);
		}
		return `nodejs${major}.x`;
	}
	if (support.status === 'beta') {
		logger.warn(
			`Your project is being built for Node.js ${major} as the runtime, which is currently in beta for Vercel Serverless Functions.`,
		);
		return `nodejs${major}.x`;
	}
	if (support.status === 'deprecated') {
		logger.warn(
			`
	Your project is being built for Node.js ${major} as the runtime.
	This version is deprecated by Vercel Serverless Functions.
	Consider upgrading your local version to 24.
`,
		);
		return `nodejs${major}.x`;
	}
	return 'nodejs24.x';
}
function createRoutesWithStaticHeaders(staticHeaders, config) {
	const vercelHeaders = [];
	for (const [pathname, { headers }] of staticHeaders.entries()) {
		if (config.security.csp) {
			const csp = headers.get('Content-Security-Policy');
			if (csp) {
				const _headers = {
					'content-security-policy': csp,
				};
				vercelHeaders.push({
					src: pathname,
					headers: _headers,
				});
			}
		}
	}
	return vercelHeaders;
}
export {
	ASTRO_LOCALS_HEADER,
	ASTRO_MIDDLEWARE_SECRET_HEADER,
	ASTRO_PATH_HEADER,
	ASTRO_PATH_PARAM,
	NODE_PATH,
	VERCEL_EDGE_MIDDLEWARE_FILE,
	vercelAdapter as default,
};
