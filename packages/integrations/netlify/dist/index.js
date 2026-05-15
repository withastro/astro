import { randomUUID } from 'node:crypto';
import { appendFile, mkdir, readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { emptyDir } from '@astrojs/internal-helpers/fs';
import { createRedirectsFromAstroRoutes, printAsRedirects } from '@astrojs/underscore-redirects';
import netlifyVitePlugin from '@netlify/vite-plugin';
import { build } from 'esbuild';
import { glob, globSync } from 'tinyglobby';
import { copyDependenciesToFunction } from './lib/nft.js';
import { sessionDrivers } from 'astro/config';
import { createConfigPlugin } from './vite-plugin-config.js';
const { version: packageVersion } = JSON.parse(
	await readFile(new URL('../package.json', import.meta.url), 'utf8'),
);
function remotePatternToRegex(pattern, logger) {
	let { protocol, hostname, port, pathname } = pattern;
	let regexStr = '';
	if (protocol) {
		regexStr += `${protocol}://`;
	} else {
		regexStr += '[a-z]+://';
	}
	if (hostname) {
		if (hostname.startsWith('**.')) {
			regexStr += '([a-z0-9-]+\\.)*';
			hostname = hostname.substring(3);
		} else if (hostname.startsWith('*.')) {
			regexStr += '([a-z0-9-]+\\.)?';
			hostname = hostname.substring(2);
		}
		regexStr += hostname.replace(/\./g, '\\.');
	} else {
		regexStr += '[a-z0-9.-]+';
	}
	if (port) {
		regexStr += `:${port}`;
	} else {
		regexStr += '(:[0-9]+)?';
	}
	if (pathname) {
		if (pathname.endsWith('/**')) {
			regexStr += `(\\${pathname.replace('/**', '')}.*)`;
		}
		if (pathname.endsWith('/*')) {
			regexStr += `(\\${pathname.replace('/*', '')}/[^/?#]+)/?`;
		} else {
			regexStr += `(\\${pathname})`;
		}
	} else {
		regexStr += '(\\/[^?#]*)?';
	}
	if (!regexStr.endsWith('.*)')) {
		regexStr += '([?][^#]*)?';
	}
	try {
		new RegExp(regexStr);
	} catch {
		logger.warn(
			`Could not generate a valid regex from the remotePattern "${JSON.stringify(
				pattern,
			)}". Please check the syntax.`,
		);
		return void 0;
	}
	return regexStr;
}
function remoteImagesFromAstroConfig(config, logger) {
	const remoteImages = [];
	remoteImages.push(
		...config.image.domains.map((domain) => `https?://${domain.replaceAll('.', '\\.')}/.*`),
	);
	remoteImages.push(
		...config.image.remotePatterns
			.map((pattern) => remotePatternToRegex(pattern, logger))
			.filter(Boolean),
	);
	return remoteImages;
}
async function writeNetlifyFrameworkConfig(config, staticHeaders, logger) {
	const remoteImages = remoteImagesFromAstroConfig(config, logger);
	const headers = [];
	if (!config.build.assetsPrefix) {
		headers.push({
			for: `${config.base}${config.base.endsWith('/') ? '' : '/'}${config.build.assets}/*`,
			values: {
				'Cache-Control': 'public, max-age=31536000, immutable',
			},
		});
	}
	if (staticHeaders && staticHeaders.size > 0) {
		for (const [pathname, { headers: routeHeaders }] of staticHeaders.entries()) {
			if (config.security.csp) {
				const csp = routeHeaders.get('Content-Security-Policy');
				if (csp) {
					headers.push({
						for: pathname,
						values: {
							'Content-Security-Policy': csp,
						},
					});
				}
			}
		}
	}
	const deployConfigDir = new URL('.netlify/v1/', config.root);
	await mkdir(deployConfigDir, { recursive: true });
	await writeFile(
		new URL('./config.json', deployConfigDir),
		JSON.stringify({
			images: { remote_images: remoteImages },
			headers,
		}),
	);
}
async function writeSkewProtectionConfig(config) {
	const deployId = process.env.DEPLOY_ID;
	if (!deployId) {
		return;
	}
	const deployConfigDir = new URL('.netlify/v1/', config.root);
	await mkdir(deployConfigDir, { recursive: true });
	await writeFile(
		new URL('./skew-protection.json', deployConfigDir),
		JSON.stringify({
			patterns: ['/_actions/.*', '/_server-islands/.*', '.*\\.(html)$'],
			sources: [
				{ type: 'header', name: 'X-Netlify-Deploy-ID' },
				{ type: 'query', name: 'dpl' },
			],
		}),
	);
}
function netlifyIntegration(integrationConfig) {
	const isRunningInNetlify = Boolean(
		process.env.NETLIFY || process.env.NETLIFY_LOCAL || process.env.NETLIFY_DEV,
	);
	let _config;
	let outDir;
	let rootDir;
	let astroMiddlewareEntryPoint = void 0;
	let staticHeadersMap = void 0;
	const extraFilesToInclude = [];
	const middlewareSecret = randomUUID();
	let finalBuildOutput;
	const TRACE_CACHE = {};
	const ssrBuildDir = () => new URL('./.netlify/build/', rootDir);
	const ssrOutputDir = () => new URL('./.netlify/v1/functions/ssr/', rootDir);
	const middlewareOutputDir = () => new URL('.netlify/v1/edge-functions/middleware/', rootDir);
	const cleanFunctions = async () =>
		await Promise.all([
			emptyDir(middlewareOutputDir()),
			emptyDir(ssrOutputDir()),
			emptyDir(ssrBuildDir()),
		]);
	async function writeRedirects(routes2, dir, buildOutput, assets) {
		const staticRedirects = routes2.filter(
			(route) => route.type === 'redirect' && (route.redirect || route.redirectRoute),
		);
		for (const { pattern, redirectRoute } of staticRedirects) {
			const distURL = assets.get(pattern);
			if (!distURL && redirectRoute) {
				const redirectDistURL = assets.get(redirectRoute.pattern);
				if (redirectDistURL) {
					assets.set(pattern, redirectDistURL);
				}
			}
		}
		const fallback = finalBuildOutput === 'static' ? '/.netlify/static' : '/.netlify/functions/ssr';
		const redirects = createRedirectsFromAstroRoutes({
			config: _config,
			dir,
			routeToDynamicTargetMap: new Map(staticRedirects.map((route) => [route, fallback])),
			buildOutput,
			assets,
		});
		if (!redirects.empty()) {
			await appendFile(
				new URL('_redirects', outDir),
				`
${printAsRedirects(redirects)}
`,
			);
		}
	}
	async function getFilesByGlob(include = [], exclude = []) {
		const files = await glob(include, {
			cwd: fileURLToPath(rootDir),
			absolute: true,
			ignore: exclude,
			expandDirectories: false,
		});
		return files.map((file) => pathToFileURL(file));
	}
	async function writeSSRFunction({ logger, root, serverEntry, notFoundContent }) {
		const entry = new URL(`./${serverEntry}`, ssrBuildDir());
		const _includeFiles = integrationConfig?.includeFiles || [];
		const _excludeFiles = integrationConfig?.excludeFiles || [];
		if (finalBuildOutput === 'server') {
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
		}
		const includeFiles = (await getFilesByGlob(_includeFiles, _excludeFiles)).concat(
			extraFilesToInclude,
		);
		const excludeFiles = await getFilesByGlob(_excludeFiles);
		const { handler } = await copyDependenciesToFunction(
			{
				entry,
				outDir: ssrOutputDir(),
				includeFiles,
				excludeFiles,
				logger,
				root,
			},
			TRACE_CACHE,
		);
		await writeFile(
			new URL('./ssr.mjs', ssrOutputDir()),
			`
			import { createHandler } from './${handler}';

			export default createHandler(${JSON.stringify({ notFoundContent })});

			// The config must be inlined here instead of imported because Netlify
			// parses this file statically to read the config.
			export const config = {
				includedFiles: ['**/*'],
				name: 'Astro SSR',
				nodeBundler: 'none',
				generator: '@astrojs/netlify@${packageVersion}',
				path: '/*',
				preferStatic: true,
			};
		`,
		);
	}
	async function writeMiddleware({ entrypoint, serverEntry }) {
		await mkdir(middlewareOutputDir(), { recursive: true });
		await writeFile(
			new URL(`./${serverEntry}`, middlewareOutputDir()),
			/* ts */
			`
			import { onRequest } from "${fileURLToPath(entrypoint).replaceAll('\\', '/')}";
			import { createContext, trySerializeLocals } from 'astro/middleware';

			export default async (request, context) => {
				const ctx = createContext({
					request,
					params: {},
					locals: { netlify: { context } },
					clientAddress: context.ip,
				});
				// https://docs.netlify.com/edge-functions/api/#return-a-rewrite
				ctx.rewrite = (target) => {
					if(target instanceof Request) {
						// We can only mutate headers, so if anything else is different, we need to fetch
						// the target URL instead.
						if(target.method !== request.method || target.body || target.url.origin !== request.url.origin) {
							return fetch(target);
						}
						// We can't replace the headers object, so we need to delete all headers and set them again
						request.headers.forEach((_value, key) => {
							request.headers.delete(key);
						});
						target.headers.forEach((value, key) => {
							request.headers.set(key, value);
						});
						return new URL(target.url);
					}
					return new URL(target, request.url);
				};
				const next = () => {
					const { netlify, ...otherLocals } = ctx.locals;
					request.headers.set("x-astro-locals", trySerializeLocals(otherLocals));
					request.headers.set("x-astro-middleware-secret", "${middlewareSecret}");
					return context.next();
				};

				return onRequest(ctx, next);
			}

			export const config = {
				name: "Astro Middleware",
				generator: "@astrojs/netlify@${packageVersion}",
				path: "/*", excludedPath: ["/_astro/*", "/.netlify/images/*"]
			};
			`,
		);
		await build({
			entryPoints: [fileURLToPath(new URL(`./${serverEntry}`, middlewareOutputDir()))],
			// allow `node:` prefixed imports, which are valid in netlify's deno edge runtime
			plugins: [
				{
					name: 'allowNodePrefixedImports',
					setup(pluginBuild) {
						pluginBuild.onResolve({ filter: /^node:.*$/ }, (args) => ({
							path: args.path,
							external: true,
						}));
					},
				},
			],
			target: 'es2022',
			platform: 'neutral',
			mainFields: ['module', 'main'],
			outfile: fileURLToPath(new URL('./middleware.mjs', middlewareOutputDir())),
			allowOverwrite: true,
			format: 'esm',
			bundle: true,
			minify: false,
			external: ['sharp'],
			banner: {
				// Import Deno polyfill for `process.env` at the top of the file
				js: 'import process from "node:process";',
			},
		});
	}
	function getLocalDevNetlifyContext(req) {
		const isHttps = req.headers['x-forwarded-proto'] === 'https';
		const parseBase64JSON = (header) => {
			if (typeof req.headers[header] === 'string') {
				try {
					return JSON.parse(Buffer.from(req.headers[header], 'base64').toString('utf8'));
				} catch {}
			}
		};
		const context = {
			get url() {
				throw new Error('Please use Astro.url instead.');
			},
			// The dev server is a long running process, so promises will run even with a noop
			waitUntil: () => {},
			account: parseBase64JSON('x-nf-account-info') ?? {
				id: 'mock-netlify-account-id',
			},
			deploy: {
				context: 'dev',
				id:
					typeof req.headers['x-nf-deploy-id'] === 'string'
						? req.headers['x-nf-deploy-id']
						: 'mock-netlify-deploy-id',
				published: false,
			},
			site: parseBase64JSON('x-nf-site-info') ?? {
				id: 'mock-netlify-site-id',
				name: 'mock-netlify-site.netlify.app',
				url: `${isHttps ? 'https' : 'http'}://localhost:${isRunningInNetlify ? 8888 : 4321}`,
			},
			geo: parseBase64JSON('x-nf-geo') ?? {
				city: 'Mock City',
				country: { code: 'mock', name: 'Mock Country' },
				subdivision: { code: 'SD', name: 'Mock Subdivision' },
				timezone: 'UTC',
				longitude: 0,
				latitude: 0,
			},
			ip:
				typeof req.headers['x-nf-client-connection-ip'] === 'string'
					? req.headers['x-nf-client-connection-ip']
					: (req.socket.remoteAddress ?? '127.0.0.1'),
			server: {
				region: 'local-dev',
			},
			requestId:
				typeof req.headers['x-nf-request-id'] === 'string'
					? req.headers['x-nf-request-id']
					: 'mock-netlify-request-id',
			get cookies() {
				throw new Error('Please use Astro.cookies instead.');
			},
			json: (input) => Response.json(input),
			log: console.info,
			next: () => {
				throw new Error('`context.next` is not implemented for serverless functions');
			},
			get params() {
				throw new Error("context.params don't contain any usable content in Astro.");
			},
			rewrite() {
				throw new Error('context.rewrite is not available in Astro.');
			},
		};
		return context;
	}
	let routes;
	return {
		name: '@astrojs/netlify',
		hooks: {
			'astro:config:setup': async ({ config, updateConfig, logger, command }) => {
				rootDir = config.root;
				await cleanFunctions();
				outDir = new URL(config.outDir, rootDir);
				let session = config.session;
				if (!session?.driver) {
					logger.info('Enabling sessions with Netlify Blobs');
					session = {
						driver: sessionDrivers.netlifyBlobs({
							name: 'astro-sessions',
							consistency: 'strong',
						}),
						cookie: session?.cookie,
						ttl: session?.ttl,
					};
				}
				const features =
					typeof integrationConfig?.devFeatures === 'boolean'
						? {
								images: integrationConfig.devFeatures,
								environmentVariables: integrationConfig.devFeatures,
							}
						: {
								images: integrationConfig?.devFeatures?.images ?? true,
								environmentVariables: integrationConfig?.devFeatures?.environmentVariables ?? false,
							};
				const vitePluginOptions = {
					images: {
						// If features is an object, use the `images` property
						// Otherwise, use the boolean value of `features`, defaulting to true
						enabled: features.images,
						remoteURLPatterns: remoteImagesFromAstroConfig(config, logger),
					},
					environmentVariables: {
						// If features is an object, use the `environmentVariables` property
						// Otherwise, use the boolean value of `features`, defaulting to false
						enabled: features.environmentVariables,
					},
				};
				updateConfig({
					outDir,
					build: {
						redirects: false,
						client: outDir,
						server: ssrBuildDir(),
					},
					session,
					vite: {
						plugins: [
							netlifyVitePlugin(vitePluginOptions),
							createConfigPlugin({
								middlewareSecret,
								cacheOnDemandPages: !!integrationConfig?.cacheOnDemandPages,
							}),
						],
						server: {
							watch: {
								ignored: [fileURLToPath(new URL('./.netlify/**', rootDir))],
							},
						},
					},
					image: {
						service: {
							// defaults to true, so should only be disabled if the user has
							// explicitly set false
							entrypoint:
								integrationConfig?.imageCDN === false || // In dev, if the vite plugin's image proxy isn't enabled, don't try to use the Netlify service since it won't work
								(command === 'dev' && vitePluginOptions?.images?.enabled === false)
									? void 0
									: '@astrojs/netlify/image-service.js',
						},
					},
				});
			},
			'astro:routes:resolved': (params) => {
				routes = params.routes;
			},
			'astro:config:done': async (params) => {
				rootDir = params.config.root;
				_config = params.config;
				const middlewareMode =
					integrationConfig?.middlewareMode ??
					(integrationConfig?.edgeMiddleware ? 'edge' : 'classic');
				const useStaticHeaders = integrationConfig?.staticHeaders ?? false;
				params.setAdapter({
					name: '@astrojs/netlify',
					entrypointResolution: 'auto',
					serverEntrypoint: '@astrojs/netlify/ssr-function.js',
					adapterFeatures: {
						middlewareMode,
						staticHeaders: useStaticHeaders,
					},
					supportedAstroFeatures: {
						hybridOutput: 'stable',
						staticOutput: 'stable',
						serverOutput: 'stable',
						sharpImageService: 'stable',
						envGetSecret: 'stable',
					},
					client: {
						internalFetchHeaders: () => {
							const deployId = process.env.DEPLOY_ID;
							if (deployId) {
								return { 'X-Netlify-Deploy-ID': deployId };
							}
							return {};
						},
						assetQueryParams: process.env.DEPLOY_ID
							? new URLSearchParams({ dpl: process.env.DEPLOY_ID })
							: void 0,
					},
				});
				finalBuildOutput = params.buildOutput;
			},
			'astro:build:generated': ({ routeToHeaders }) => {
				staticHeadersMap = routeToHeaders;
			},
			'astro:build:ssr': async ({ middlewareEntryPoint }) => {
				astroMiddlewareEntryPoint = middlewareEntryPoint;
			},
			'astro:build:done': async ({ assets, dir, logger }) => {
				await writeRedirects(routes, dir, finalBuildOutput, assets);
				logger.info('Emitted _redirects');
				if (finalBuildOutput !== 'static') {
					let notFoundContent = void 0;
					try {
						notFoundContent = await readFile(new URL('./404.html', dir), 'utf8');
					} catch {}
					await writeSSRFunction({
						logger,
						root: _config.root,
						serverEntry: _config.build.serverEntry,
						notFoundContent,
					});
					logger.info('Generated SSR Function');
				}
				if (astroMiddlewareEntryPoint) {
					await writeMiddleware({
						entrypoint: astroMiddlewareEntryPoint,
						serverEntry: _config.build.serverEntry,
					});
					logger.info('Generated Middleware Edge Function');
				}
				await writeNetlifyFrameworkConfig(_config, staticHeadersMap, logger);
				await writeSkewProtectionConfig(_config);
			},
			// local dev
			'astro:server:setup': async ({ server }) => {
				const existingSessionModule = server.moduleGraph.getModuleById('astro:sessions');
				if (existingSessionModule) {
					server.moduleGraph.invalidateModule(existingSessionModule);
				}
				const clientLocalsSymbol = /* @__PURE__ */ Symbol.for('astro.locals');
				server.middlewares.use((req, _res, next) => {
					Reflect.set(req, clientLocalsSymbol, {
						netlify: { context: getLocalDevNetlifyContext(req) },
					});
					next();
				});
			},
		},
	};
}
export { netlifyIntegration as default, remotePatternToRegex };
