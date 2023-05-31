import type { AstroConfig, AstroIntegration } from 'astro';
import { ssgBuild } from './build/ssg.js';
import type { ImageService, SSRImageService, TransformOptions } from './loaders/index.js';
import type { LoggerLevel } from './utils/logger.js';
import { joinPaths, prependForwardSlash, propsToFilename } from './utils/paths.js';
import { isHybridOutput } from './utils/prerender.js';
import { createPlugin } from './vite-plugin-astro-image.js';

export { getImage } from './lib/get-image.js';
export { getPicture } from './lib/get-picture.js';

const PKG_NAME = '@astrojs/image';
const ROUTE_PATTERN = '/_image';
const UNSUPPORTED_ADAPTERS = new Set([
	'@astrojs/cloudflare',
	'@astrojs/deno',
	'@astrojs/netlify/edge-functions',
	'@astrojs/vercel/edge',
]);

interface BuildConfig {
	client: URL;
	server: URL;
	assets: string;
}

interface ImageIntegration {
	loader?: ImageService;
	defaultLoader: SSRImageService;
	addStaticImage?: (transform: TransformOptions) => string;
}

declare global {
	// eslint-disable-next-line no-var
	var astroImage: ImageIntegration;
}

export interface IntegrationOptions {
	/**
	 * Entry point for the @type {HostedImageService} or @type {LocalImageService} to be used.
	 */
	serviceEntryPoint?: '@astrojs/image/squoosh' | '@astrojs/image/sharp' | string;
	logLevel?: LoggerLevel;
	cacheDir?: false | string;
}

export default function integration(options: IntegrationOptions = {}): AstroIntegration {
	const resolvedOptions = {
		serviceEntryPoint: '@astrojs/image/squoosh',
		logLevel: 'info' as LoggerLevel,
		cacheDir: './node_modules/.astro/image',
		...options,
	};

	let _config: AstroConfig;
	let _buildConfig: BuildConfig;

	// During SSG builds, this is used to track all transformed images required.
	const staticImages = new Map<string, Map<string, TransformOptions>>();

	function getViteConfiguration(isDev: boolean) {
		return {
			plugins: [createPlugin(_config, resolvedOptions)],
			build: {
				rollupOptions: {
					external: ['sharp'],
				},
			},
			ssr: {
				noExternal: ['@astrojs/image', resolvedOptions.serviceEntryPoint],
				// Externalize CJS dependencies used by `serviceEntryPoint`. Vite dev mode has trouble
				// loading these modules with `ssrLoadModule`, but works in build.
				external: isDev ? ['http-cache-semantics', 'image-size', 'mime'] : [],
			},
			assetsInclude: ['**/*.wasm'],
		};
	}

	return {
		name: PKG_NAME,
		hooks: {
			'astro:config:setup': async ({ command, config, updateConfig, injectRoute }) => {
				_config = config;
				updateConfig({
					vite: getViteConfiguration(command === 'dev'),
				});

				if (command === 'dev' || config.output === 'server' || isHybridOutput(config)) {
					injectRoute({
						pattern: ROUTE_PATTERN,
						entryPoint: '@astrojs/image/endpoint',
					});
				}

				const { default: defaultLoader } = await import(
					resolvedOptions.serviceEntryPoint === '@astrojs/image/sharp'
						? './loaders/sharp.js'
						: './loaders/squoosh.js'
				);

				globalThis.astroImage = {
					defaultLoader,
				};
			},
			'astro:config:done': ({ config }) => {
				_config = config;
				_buildConfig = config.build;
			},
			'astro:build:start': () => {
				const adapterName = _config.adapter?.name;
				if (adapterName && UNSUPPORTED_ADAPTERS.has(adapterName)) {
					throw new Error(
						`@astrojs/image is not supported with the ${adapterName} adapter. Please choose a Node.js compatible adapter.`
					);
				}
			},
			'astro:build:setup': async () => {
				// Used to cache all images rendered to HTML
				// Added to globalThis to share the same map in Node and Vite
				function addStaticImage(transform: TransformOptions) {
					const srcTranforms = staticImages.has(transform.src)
						? staticImages.get(transform.src)!
						: new Map<string, TransformOptions>();

					const filename = propsToFilename(transform, resolvedOptions.serviceEntryPoint);

					srcTranforms.set(filename, transform);
					staticImages.set(transform.src, srcTranforms);

					// Prepend the Astro config's base path, if it was used.
					// Doing this here makes sure that base is ignored when building
					// staticImages to /dist, but the rendered HTML will include the
					// base prefix for `src`.
					if (_config.build.assetsPrefix) {
						return joinPaths(_config.build.assetsPrefix, _buildConfig.assets, filename);
					} else {
						return prependForwardSlash(joinPaths(_config.base, _buildConfig.assets, filename));
					}
				}

				// Helpers for building static images should only be available for SSG
				if (_config.output === 'static') {
					globalThis.astroImage.addStaticImage = addStaticImage;
				}
			},
			'astro:build:generated': async ({ dir }) => {
				// for SSG builds, build all requested image transforms to dist
				const loader = globalThis?.astroImage?.loader;

				if (loader && 'transform' in loader && staticImages.size > 0) {
					const cacheDir = !!resolvedOptions.cacheDir
						? new URL(resolvedOptions.cacheDir, _config.root)
						: undefined;

					await ssgBuild({
						loader,
						staticImages,
						config: _config,
						outDir: dir,
						logLevel: resolvedOptions.logLevel,
						cacheDir,
					});
				}
			},
		},
	};
}
