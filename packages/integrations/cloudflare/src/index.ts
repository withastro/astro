import { createReadStream, existsSync } from 'node:fs';
import { appendFile, readFile, rename, stat, unlink, writeFile } from 'node:fs/promises';
import { relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { normalizePath } from 'vite';
import { createInterface } from 'node:readline/promises';
import {
	removeLeadingForwardSlash,
	removeTrailingForwardSlash,
} from '@astrojs/internal-helpers/path';
import { createRedirectsFromAstroRoutes, printAsRedirects } from '@astrojs/underscore-redirects';
import { cloudflare as cfVitePlugin, type PluginConfig } from '@cloudflare/vite-plugin';
import type { AstroConfig, AstroIntegration, IntegrationResolvedRoute } from 'astro';
import { rolldownAstroFrontmatterScanPlugin } from './rolldown-plugin-astro-frontmatter.js';
import { getParts } from './utils/generate-routes-json.js';
import { buildAssetsHeadersContent } from './utils/headers.js';
import {
	type ImageServiceConfig,
	hasUserImageService,
	normalizeImageServiceConfig,
	setImageConfig,
} from './utils/image-config.js';
import { createConfigPlugin, type CompileImageConfig } from './vite-plugin-config.js';
import { createNodePrerenderPlugin } from './vite-plugin-dev-server-prerender-middleware.js';
import {
	cloudflareConfigCustomizer,
	DEFAULT_SESSION_KV_BINDING_NAME,
	DEFAULT_IMAGES_BINDING_NAME,
} from './wrangler.js';
import { sessionDrivers } from 'astro/config';
import { createCloudflarePrerenderer } from './prerenderer.js';
import cfPrismPlugin from './vite-plugin-prism.js';
import { loadWranglerEnv } from './utils/wrangler-config.js';

const CLOUDFLARE_KV_SESSION_DRIVER_ENTRYPOINT = sessionDrivers.cloudflareKVBinding().entrypoint;

function usesCloudflareKVSessionDriver(session: AstroConfig['session']): boolean {
	const driver = session?.driver;

	if (!driver) {
		return false;
	}

	if (typeof driver === 'string') {
		return driver === 'cloudflareKVBinding' || driver === 'cloudflare-kv-binding';
	}

	const entrypoint =
		typeof driver.entrypoint === 'string' ? driver.entrypoint : driver.entrypoint.toString();

	return (
		entrypoint === CLOUDFLARE_KV_SESSION_DRIVER_ENTRYPOINT ||
		entrypoint.endsWith('cloudflare-kv-binding')
	);
}

export type { Runtime } from './utils/handler.js';

function hasContentCollectionsConfig(srcDir: URL) {
	const contentConfigPaths = [
		'content.config.mjs',
		'content.config.js',
		'content.config.mts',
		'content.config.ts',
		'content/config.mjs',
		'content/config.js',
		'content/config.mts',
		'content/config.ts',
		'live.config.mjs',
		'live.config.js',
		'live.config.mts',
		'live.config.ts',
	];

	return contentConfigPaths.some((configPath) => existsSync(new URL(`./${configPath}`, srcDir)));
}

function resolveImageServiceEntrypoint(entrypoint: string, root: URL): string {
	if (entrypoint.startsWith('.')) {
		return new URL(entrypoint, root).href;
	}
	return entrypoint;
}

export interface Options
	extends Pick<
		PluginConfig,
		'auxiliaryWorkers' | 'configPath' | 'inspectorPort' | 'persistState' | 'remoteBindings'
	> {
	/** Options for handling images. */
	imageService?: ImageServiceConfig;

	/**
	 * By default, Astro will be configured to use Cloudflare KV to store session data. The KV namespace
	 * will be automatically provisioned when you deploy.
	 *
	 * By default, the binding is named `SESSION`, but you can override this by providing a different name here.
	 * If you define the binding manually in your wrangler config, Astro will use your configuration instead.
	 *
	 * See https://developers.cloudflare.com/workers/wrangler/configuration/#automatic-provisioning for more details.
	 */
	sessionKVBindingName?: string;

	/**
	 * When `imageService` is set to `cloudflare-binding`, the Cloudflare Images binding will be used
	 * to transform images. The binding will be automatically configured for you.
	 *
	 * By default, the binding is named `IMAGES`, but you can override this by providing a different name here.
	 * If you define the binding manually in your wrangler config, Astro will use your configuration instead.
	 *
	 * See https://developers.cloudflare.com/images/transform-images/bindings/ for more details.
	 */
	imagesBindingName?: string;

	/**
	 * Controls which runtime is used for prerendering static pages at build time.
	 *
	 * - `'workerd'` (default): Uses Cloudflare's workerd runtime.
	 * - `'node'`: Uses Astro's default node prerender environment.
	 */
	prerenderEnvironment?: 'workerd' | 'node';

	experimental?: Pick<
		NonNullable<PluginConfig['experimental']>,
		'headersAndRedirectsDevModeSupport'
	>;
}

export default function createIntegration({
	imageService,
	sessionKVBindingName = DEFAULT_SESSION_KV_BINDING_NAME,
	imagesBindingName = DEFAULT_IMAGES_BINDING_NAME,
	prerenderEnvironment = 'workerd',
	...cloudflareOptions
}: Options = {}): AstroIntegration {
	let _config: AstroConfig;
	let _buildOutput: 'server' | 'static';
	let _originalClientDir: URL;

	let _routes: IntegrationResolvedRoute[];
	let cfPluginConfig: PluginConfig;
	let hasUserBuildImageService = false;
	let compileImageConfig: CompileImageConfig | null = null;

	const { buildService, runtimeService } = normalizeImageServiceConfig(imageService);
	const needsImagesBinding = runtimeService === 'cloudflare-binding';
	const hasBuildImageService = buildService === 'compile' || buildService === 'custom';

	return {
		name: '@astrojs/cloudflare',
		hooks: {
			'astro:config:setup': async ({ command, config, updateConfig, logger, addWatchFile }) => {
				if (!!process.versions.webcontainer) {
					throw new Error('`workerd` does not run on Stackblitz.');
				}

				let session = config.session;
				const isCompile = buildService === 'compile';

				if (needsImagesBinding) {
					logger.info(
						`Enabling image processing with Cloudflare Images for production with the "${imagesBindingName}" Images binding.`,
					);
				} else if (hasBuildImageService) {
					logger.info(
						`Enabling compile-time image optimization. Images will be pre-optimized at build time.`,
					);
				}

				if (!session?.driver) {
					logger.info(
						`Enabling sessions with Cloudflare KV with the "${sessionKVBindingName}" KV binding.`,
					);

					session = {
						driver: sessionDrivers.cloudflareKVBinding({
							binding: sessionKVBindingName,
						}),
						cookie: session?.cookie,
						ttl: session?.ttl,
					};
				}

				const needsSessionKVBinding = usesCloudflareKVSessionDriver(session);

				// In dev, `compile` needs the IMAGES binding for real transforms
				// (the image-transform-endpoint uses it). At build time,
				// `compile` uses Sharp on the Node side instead.
				const needsImagesBindingForDev = isCompile && command === 'dev';
				const usesContentCollections = hasContentCollectionsConfig(config.srcDir);
				const prebundleContentRuntime = command === 'dev' && usesContentCollections;
				const isTypeGenPhase = command === 'build' || command === 'sync';

				const needsWorkerCache = config.cache?.provider?.name === 'cloudflare';

				const adapterPluginConfig: Partial<PluginConfig> = {
					config: cloudflareConfigCustomizer({
						needsSessionKVBinding,
						sessionKVBindingName,
						imagesBindingName:
							needsImagesBinding || needsImagesBindingForDev ? imagesBindingName : false,
						needsWorkerCache,
					}),
					...(prerenderEnvironment === 'workerd' && {
						experimental: {
							prerenderWorker: {
								config(_, { entryWorkerConfig }) {
									const { queues, ...restWorkerConfig } = entryWorkerConfig;
									return {
										...restWorkerConfig,
										name: 'prerender',
										...(queues?.producers?.length && {
											queues: { producers: queues.producers },
										}),
										...(needsImagesBinding &&
											!restWorkerConfig.images && {
												images: { binding: imagesBindingName },
											}),
									};
								},
							},
						},
					}),
				};
				// Resolve the full `@cloudflare/vite-plugin` config exactly once by merging
				// the user's `cloudflare({...})` options (e.g. `remoteBindings`,
				// `inspectorPort`, `persistState`, `configPath`, `auxiliaryWorkers`) with
				// the adapter's computed bindings/wrangler wiring. Downstream call sites
				// (the dev/build plugin instance, the prerenderer's preview server, and
				// the `astro preview` entrypoint) then just spread `cfPluginConfig` and
				// cannot accidentally drop user options (see #16705 and related CHANGELOG
				// entries).
				cfPluginConfig = { ...cloudflareOptions, ...adapterPluginConfig };

				// The preview entrypoint uses Cloudflare's vite plugin and so it needs
				// access to the resolved config. There's no proper API for this so we
				// use globalThis.
				if (command === 'preview') {
					globalThis.astroCloudflareConfig = cfPluginConfig;
				}

				// Including prismjs files in `optimizeDeps.includes` when `@astrojs/prism` is not installed
				// causes a "Failed to resolve dependency: @astrojs/prism > prismjs" log to appear.
				// However, when using the `<Prism />` component in a Cloudflare Workers environment,
				// not including prismjs files in `optimizeDeps.includes` causes
				// a "The file does not exist at ..." log to appear.
				// To work around this, we check whether `@astrojs/prism` is installed in the current project.
				// Note: this "Failed to resolve dependency" log will not appear as long as the `@astrojs/prism` package is installed,
				// even if it is not actually used.
				const prismFiles = [
					'@astrojs/prism > prismjs',
					'@astrojs/prism > prismjs/components.js',
					'@astrojs/prism > prismjs/dependencies.js',
				] as const;
				const isAstroPrismPackageInstalled = await getIsAstroPrismInstalled(config.root);

				// Capture user's top-level optimizeDeps before Vite scopes it to the
				// client environment only (Vite 6 Environment API design). We forward
				// these settings into server environments so that user-provided exclude,
				// include, and esbuildOptions (e.g. loader) entries are respected.
				const userOptimizeDeps = config.vite?.optimizeDeps;

				const cloudflareVitePlugins = cfVitePlugin({
					...cfPluginConfig,
					viteEnvironment: { name: 'ssr' },
					assetsOnly: () => _buildOutput === 'static',
				});
				// `sync` and `build` both run type generation (build via its internal sync
				// pass), which creates a temporary Vite server and fires `configureServer`
				// the hook that boots the Cloudflare/workerd runtime. Drop it in both so
				// type generation doesn't pay that startup cost. See #16332.
				if (isTypeGenPhase) {
					for (const plugin of cloudflareVitePlugins) {
						plugin.configureServer = undefined;
					}
				}

				updateConfig({
					build: {
						redirects: false,
					},
					session,
					vite: {
						plugins: [
							...(prerenderEnvironment === 'node' && command === 'dev'
								? [createNodePrerenderPlugin()]
								: []),
							cloudflareVitePlugins,
							{
								name: '@astrojs/cloudflare:cf-imports',
								enforce: 'pre',
								resolveId: {
									filter: {
										id: /^cloudflare:/,
									},
									handler(id) {
										return { id, external: true };
									},
								},
							},
							{
								name: '@astrojs/cloudflare:environment',
								configEnvironment(environmentName, _options) {
									// Skip dependency pre-bundling during type generation (see `isTypeGenPhase` above).
									if (isTypeGenPhase) {
										return { optimizeDeps: { noDiscovery: true, include: [] } };
									}
									const isServerEnvironment = ['astro', 'ssr', 'prerender'].includes(
										environmentName,
									);
									if (isServerEnvironment && !_options.optimizeDeps?.noDiscovery) {
										return {
											optimizeDeps: {
												include: [
													'@astrojs/cloudflare/image-service-workerd',
													'@astrojs/cloudflare/entrypoints/server',
													'astro',
													'astro/runtime/**',
													'astro > html-escaper',
													'astro > mrmime',
													'astro > zod/v4',
													'astro > zod/v4/core',
													'astro > clsx',
													'astro > cookie',
													'astro > devalue',
													'astro > @oslojs/encoding',
													'astro > es-module-lexer',
													'astro > unstorage',
													'astro > neotraverse/modern',
													'astro > piccolore',
													'astro > picomatch',
													'astro/app',
													'astro/app/fetch/default-handler',
													'astro/fetch',
													'astro/hono',
													'astro/assets',
													'astro/assets/runtime',
													'astro/assets/utils/inferRemoteSize.js',
													'astro/assets/fonts/runtime.js',
													...(prebundleContentRuntime ? (['astro/content/runtime'] as const) : []),
													'astro/compiler-runtime',
													'astro/jsx-runtime',
													'astro/app/entrypoint/dev',
													'astro/virtual-modules/middleware.js',
													'astro/virtual-modules/transitions.js',
													'astro/virtual-modules/transitions-events.js',
													'astro/virtual-modules/transitions-router.js',
													'astro/virtual-modules/transitions-swap-functions.js',
													'astro/virtual-modules/transitions-types.js',
													'astro/components',
													...(isAstroPrismPackageInstalled ? prismFiles : []),
													...(Array.isArray(userOptimizeDeps?.include)
														? userOptimizeDeps.include
														: []),
												],
												exclude: [
													'unstorage/drivers/cloudflare-kv-binding',
													'astro:*',
													'virtual:astro:*',
													'virtual:astro-cloudflare:*',
													'virtual:@astrojs/*',
													'@astrojs/starlight',
													...(Array.isArray(userOptimizeDeps?.exclude)
														? userOptimizeDeps.exclude
														: []),
												],
												rolldownOptions: {
													plugins: [rolldownAstroFrontmatterScanPlugin()],
												},
											},
										};
									} else if (environmentName === 'client') {
										return {
											optimizeDeps: {
												include: ['astro/runtime/client/dev-toolbar/entrypoint.js'],
												// Workaround for https://github.com/vitejs/vite/issues/20867
												// When dependencies are discovered mid-request (e.g. a linked package
												// used with client:only), concurrent requests can fail with 504 because
												// the dep optimizer's metadata object gets replaced during `await info.processing`.
												ignoreOutdatedRequests: true,
											},
										};
									}
								},
							},
							{
								enforce: 'post',
								name: '@astrojs/cloudflare:cf-externals',
								applyToEnvironment: (environment) =>
									environment.name === 'ssr' || environment.name === 'prerender',
								config(conf) {
									if (conf.ssr) {
										// Cloudflare does not support externalizing modules in server environments
										conf.ssr.external = undefined;
									}
								},
							},
							createConfigPlugin({
								sessionKVBindingName,
								// `imageServiceEntrypoint` is finalized in `astro:config:done`:
								// integrations may set `image.service` via `updateConfig()` after
								// this hook runs (the adapter always runs first), so the service
								// cannot be resolved yet. The plugin serializes this object lazily
								// at load time, after the mutation below has happened.
								compileImageConfig:
									hasBuildImageService && command !== 'dev'
										? (compileImageConfig = {
												base: config.base,
												assetsPrefix:
													typeof config.build.assetsPrefix === 'string'
														? config.build.assetsPrefix
														: undefined,
												imageServiceEntrypoint: '@astrojs/cloudflare/image-service-workerd',
												buildAssets: config.build.assets ?? '_astro',
											})
										: null,
								cacheProviderEnabled: needsWorkerCache,
							}),
							cfPrismPlugin(),
						],
					},
					image: setImageConfig(imageService, config.image, command, logger),
				});

				if (cloudflareOptions.configPath) {
					addWatchFile(new URL(cloudflareOptions.configPath, config.root));
				}

				addWatchFile(new URL('./wrangler.toml', config.root));
				addWatchFile(new URL('./wrangler.json', config.root));
				addWatchFile(new URL('./wrangler.jsonc', config.root));
			},
			'astro:routes:resolved': ({ routes }) => {
				_routes = routes;
			},
			'astro:config:done': ({ setAdapter, config, injectTypes, logger, buildOutput }) => {
				_config = config;
				_buildOutput = buildOutput;
				_originalClientDir = new URL(config.build.client.href);

				// Resolve the custom image service against the FINAL config: the adapter's
				// `astro:config:setup` runs before every user integration (Astro unshifts
				// the adapter onto the integrations list), so a service registered by an
				// integration via `updateConfig()` is only visible here.
				hasUserBuildImageService = hasBuildImageService && hasUserImageService(config.image);
				if (compileImageConfig && hasUserBuildImageService) {
					compileImageConfig.imageServiceEntrypoint = config.image.service.entrypoint;
				}

				// When a base path is configured, nest the client output directory under
				// the base so that on-disk paths match the URLs Astro writes into HTML.
				// Cloudflare Workers' static-asset binding resolves request URLs literally
				// against the client directory, so the files must live under the base prefix.
				if (config.base !== '/') {
					config.build.client = new URL('.' + config.base + '/', config.build.client);
				}

				injectTypes({
					filename: 'cloudflare.d.ts',
					content: '/// <reference types="@astrojs/cloudflare/types.d.ts" />',
				});

				setAdapter({
					name: '@astrojs/cloudflare',
					adapterFeatures: {
						buildOutput,
						middlewareMode: 'classic',
						preserveBuildClientDir: true,
						preserveBuildServerDir: true,
					},
					entrypointResolution: 'auto',
					previewEntrypoint: '@astrojs/cloudflare/entrypoints/preview',
					supportedAstroFeatures: {
						serverOutput: 'stable',
						hybridOutput: 'stable',
						staticOutput: 'stable',
						i18nDomains: 'experimental',
						sharpImageService: {
							support: 'limited',
							message:
								'When using a custom image service, ensure it is compatible with the Cloudflare Workers runtime.',
							// Only 'custom' could potentially use sharp at runtime.
							suppress: buildService === 'custom' ? 'default' : 'all',
						},
						envGetSecret: 'stable',
					},
				});

				// Assign the Wrangler config's effective env (`vars` merged with
				// `.dev.vars`/`.env` overrides) to process.env so astro:env can find
				// these variables at build time.
				loadWranglerEnv(config.root, cloudflareOptions.configPath, logger);
			},
			'astro:build:start': ({ setPrerenderer }) => {
				if (prerenderEnvironment === 'workerd') {
					setPrerenderer(
						createCloudflarePrerenderer({
							root: _config.root,
							serverDir: _config.build.server,
							clientDir: _config.build.client,
							base: _config.base,
							trailingSlash: _config.trailingSlash,
							cfPluginConfig,
							hasBuildImageService,
							userImageServiceEntrypoint: hasUserBuildImageService
								? resolveImageServiceEntrypoint(_config.image.service.entrypoint, _config.root)
								: undefined,
						}),
					);
				}
			},
			'astro:build:setup': ({ vite, target }) => {
				if (target === 'server') {
					vite.resolve ||= {};
					vite.resolve.alias ||= {};
					vite.ssr ||= {};
					vite.ssr.noExternal = true;

					vite.build ||= {};
					vite.build.rolldownOptions ||= {};
					vite.build.rolldownOptions.output ||= {};
					vite.build.rolldownOptions.external = ['sharp'];

					// @ts-expect-error
					vite.build.rolldownOptions.output.banner ||=
						'globalThis.process ??= {}; globalThis.process.env ??= {};';

					// Cloudflare env is only available per request. This isn't feasible for code that access env vars
					// in a global way, so we shim their access as `process.env.*`. This is not the recommended way for users to access environment variables. But we'll add this for compatibility for chosen variables. Mainly to support `@astrojs/db`
					vite.define = {
						'process.env': 'process.env',
						'globalThis.__ASTRO_IMAGES_BINDING_NAME': JSON.stringify(imagesBindingName),
						...vite.define,
					};
				}
			},
			'astro:build:done': async ({ dir, logger, assets }) => {
				// Move platform files from the base-prefixed client dir to the
				// original client root, since Cloudflare reads them from there.
				if (_config.base !== '/') {
					for (const file of ['.assetsignore', '_headers', '_redirects']) {
						try {
							await rename(
								new URL(`./${file}`, _config.build.client),
								new URL(`./${file}`, _originalClientDir),
							);
						} catch {
							// File may not exist — that's fine
						}
					}
					// The @cloudflare/vite-plugin computes assets.directory from the
					// modified client outDir which includes the base prefix. However,
					// Cloudflare's asset binding resolves the full request URL path
					// (including the base) against the directory, so it must point to
					// the original un-prefixed client root.
					// Note: this patches the generated build-output wrangler.json (in
					// dist/server/), not the project's source wrangler.json.
					try {
						const wranglerJsonUrl = new URL('./wrangler.json', _config.build.server);
						const raw = await readFile(wranglerJsonUrl, 'utf-8');
						const wranglerConfig = JSON.parse(raw);
						if (wranglerConfig.assets?.directory) {
							wranglerConfig.assets.directory = normalizePath(
								relative(fileURLToPath(_config.build.server), fileURLToPath(_originalClientDir)),
							);
							await writeFile(wranglerJsonUrl, JSON.stringify(wranglerConfig));
						}
					} catch {
						// wrangler.json may not exist or may contain invalid JSON
					}
				}

				// Inject an immutable Cache-Control rule for hashed assets so browsers
				// cache them across deploys. Skip when assets are served from another
				// origin (build.assetsPrefix) or when the user's _headers already sets
				// Cache-Control on a rule that would match the assets path — Cloudflare
				// merges duplicate header values with a comma, which would otherwise
				// produce a contradictory directive.
				if (_config.build.assetsPrefix) {
					logger.debug(
						'Skipping Cache-Control injection for assets — `build.assetsPrefix` is set, so assets are served from a different origin.',
					);
				} else {
					const headersPath = new URL('./_headers', _originalClientDir);
					const result = await buildAssetsHeadersContent(
						{
							assetsDir: _config.build.assets,
							basePrefix: removeTrailingForwardSlash(_config.base),
							headersPath,
						},
						(path) => readFile(path, 'utf-8'),
					);
					if (result === null) {
						logger.debug(
							`Skipping Cache-Control injection — _headers already sets Cache-Control on a matching rule.`,
						);
					} else {
						// Atomic write: stage to a temp file, then rename, so a crash
						// mid-write can't leave the user's _headers truncated.
						const tempPath = new URL('./_headers.tmp', _originalClientDir);
						try {
							await writeFile(tempPath, result.content);
							await rename(tempPath, headersPath);
						} catch (err) {
							await unlink(tempPath).catch(() => {});
							throw err;
						}
						logger.info(
							`Injected immutable Cache-Control for ${result.assetsPattern} into _headers.`,
						);
					}
				}

				let redirectsExists = false;
				try {
					const redirectsStat = await stat(new URL('./_redirects', _originalClientDir));
					if (redirectsStat.isFile()) {
						redirectsExists = true;
					}
				} catch (_error) {
					redirectsExists = false;
				}

				const redirects: IntegrationResolvedRoute['segments'][] = [];
				if (redirectsExists) {
					const rl = createInterface({
						input: createReadStream(new URL('./_redirects', _originalClientDir)),
						crlfDelay: Number.POSITIVE_INFINITY,
					});

					for await (const line of rl) {
						const parts = line.split(' ');
						if (parts.length >= 2) {
							const p = removeLeadingForwardSlash(parts[0])
								.split('/')
								.filter(Boolean)
								.map((s: string) => {
									const syntax = s
										.replace(/\/:.*?(?=\/|$)/g, '/*')
										// remove query params as they are not supported by cloudflare
										.replace(/\?.*$/, '');
									return getParts(syntax);
								});
							redirects.push(p);
						}
					}
				}

				const trueRedirects = createRedirectsFromAstroRoutes({
					config: _config,
					routeToDynamicTargetMap: new Map(
						Array.from(
							_routes
								.filter((route) => route.type === 'redirect')
								.map((route) => [route, ''] as const),
						),
					),
					dir,
					buildOutput: _buildOutput,
					assets,
				});

				if (!trueRedirects.empty()) {
					try {
						await appendFile(
							new URL('./_redirects', _originalClientDir),
							printAsRedirects(trueRedirects),
						);
					} catch (_error) {
						logger.error('Failed to write _redirects file');
					}
				}

				// For fully static sites with preserveBuildClientDir, we keep the server directory
				// to maintain consistent structure for deployment

				// Delete this variable so the preview server opens the server build.
				delete process.env.CLOUDFLARE_VITE_BUILD;
			},
		},
	};
}

// Reads the package.json at the current root to check whether `@astrojs/prism` is installed.
// Using `require.resolve()` would not work correctly for projects inside a monorepo
// (such as Astro's test fixtures), as it would traverse parent node_modules directories
// to resolve the package. For this reason, we directly read `package.json` using `readFile` instead.
async function getIsAstroPrismInstalled(rootURL: URL) {
	try {
		const pkgURL = new URL('./package.json', rootURL);
		const input = await readFile(pkgURL, { encoding: 'utf-8' });
		const pkgJson = JSON.parse(input);

		return Object.hasOwn(pkgJson['dependencies'], '@astrojs/prism');
	} catch {
		return false;
	}
}
