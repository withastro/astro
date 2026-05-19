import { fileURLToPath } from 'node:url';
import type * as vite from 'vite';
import type { RouteData } from '../../types/public/internal.js';
import type { AstroSettings } from '../../types/astro.js';
import {
	getClientOutputDirectory,
	getPrerenderOutputDirectory,
	getServerOutputDirectory,
} from '../../prerender/utils.js';
import { VIRTUAL_PAGE_RESOLVED_MODULE_ID } from '../../vite-plugin-pages/const.js';
import { ASTRO_VITE_ENVIRONMENT_NAMES } from '../constants.js';
import { CHUNKS_PATH } from './consts.js';
import {
	isLegacyAdapter,
	LEGACY_SSR_ENTRY_VIRTUAL_MODULE,
	RESOLVED_LEGACY_SSR_ENTRY_VIRTUAL_MODULE,
} from './plugins/plugin-ssr.js';
import { ASTRO_PAGE_EXTENSION_POST_PATTERN } from './plugins/util.js';
import { cleanChunkName } from './util.js';
import { makeAstroPageEntryPointFileName } from './static-build.js';

const PRERENDER_ENTRY_FILENAME_PREFIX = 'prerender-entry';

export interface CreateViteBuildConfigOptions {
	/** The resolved Astro settings. */
	settings: AstroSettings;
	/** The base Vite config produced by createVite(). */
	viteConfig: vite.InlineConfig;
	/** All routes to be built. */
	routes: RouteData[];
	/** Assembled Vite plugins (build plugins + user plugins). */
	plugins: vite.PluginOption[];
	/** The buildApp callback for the Vite builder. */
	builder: vite.BuilderOptions;
	/**
	 * A function that checks whether a given module name is a rollup input.
	 * Used by entryFileNames to determine the server entry.
	 */
	isRollupInput: (moduleName: string | null) => boolean;
}

/**
 * Creates the Vite InlineConfig used for the multi-environment build.
 *
 * This is a pure config assembly function — it does not execute the build.
 * Extracted from `buildEnvironments()` to enable unit testing of config
 * merging behavior (e.g. user rollup output overrides).
 */
export function createViteBuildConfig(opts: CreateViteBuildConfigOptions): vite.InlineConfig {
	const { settings, viteConfig, routes, plugins, builder, isRollupInput } = opts;
	const legacyAdapter = !settings.adapter || isLegacyAdapter(settings.adapter);

	return {
		...viteConfig,
		logLevel: viteConfig.logLevel ?? 'error',
		build: {
			target: 'esnext',
			// Vite defaults cssMinify to false in SSR by default, but we want to minify it
			// as the CSS generated are used and served to the client.
			cssMinify: viteConfig.build?.minify == null ? true : !!viteConfig.build?.minify,
			...viteConfig.build,
			emptyOutDir: false,
			copyPublicDir: false,
			manifest: false,
			rollupOptions: {
				...viteConfig.build?.rollupOptions,
				// Setting as `exports-only` allows us to safely delete inputs that are only used during prerendering
				preserveEntrySignatures: 'exports-only',
				...(legacyAdapter && settings.buildOutput === 'server'
					? { input: LEGACY_SSR_ENTRY_VIRTUAL_MODULE }
					: {}),
				output: {
					hoistTransitiveImports: false,
					format: 'esm',
					minifyInternalExports: true,
					// Server chunks can't go in the assets (_astro) folder
					// We need to keep these separate
					chunkFileNames(chunkInfo) {
						const { name } = chunkInfo;
						let prefix = CHUNKS_PATH;
						let suffix = '_[hash].mjs';

						// Sometimes chunks have the `@_@astro` suffix due to SSR logic. Remove it!
						// TODO: refactor our build logic to avoid this
						if (name.includes(ASTRO_PAGE_EXTENSION_POST_PATTERN)) {
							const [sanitizedName] = name.split(ASTRO_PAGE_EXTENSION_POST_PATTERN);
							return [prefix, cleanChunkName(sanitizedName), suffix].join('');
						}
						// Injected routes include "pages/[name].[ext]" already. Clean those up!
						if (name.startsWith('pages/')) {
							const sanitizedName = name.split('.')[0];
							return [prefix, cleanChunkName(sanitizedName), suffix].join('');
						}
						return [prefix, cleanChunkName(name), suffix].join('');
					},
					assetFileNames(assetInfo) {
						// Strip the @_@ extension-masking pattern from asset names, just like chunkFileNames above.
						// The @_@ pattern is an internal mechanism for virtual module IDs and should not leak into output filenames.
						const name = assetInfo.names?.[0] ?? '';
						if (name.includes(ASTRO_PAGE_EXTENSION_POST_PATTERN)) {
							const [sanitizedName] = name.split(ASTRO_PAGE_EXTENSION_POST_PATTERN);
							return `${settings.config.build.assets}/${sanitizedName}.[hash][extname]`;
						}
						return `${settings.config.build.assets}/[name].[hash][extname]`;
					},
					...viteConfig.build?.rollupOptions?.output,
					entryFileNames(chunkInfo) {
						if (chunkInfo.facadeModuleId?.startsWith(VIRTUAL_PAGE_RESOLVED_MODULE_ID)) {
							return makeAstroPageEntryPointFileName(
								VIRTUAL_PAGE_RESOLVED_MODULE_ID,
								chunkInfo.facadeModuleId,
								routes,
							);
						} else if (
							chunkInfo.facadeModuleId === RESOLVED_LEGACY_SSR_ENTRY_VIRTUAL_MODULE ||
							// This catches the case when the adapter uses `entrypointResolution: 'auto'`. When doing so,
							// the adapter must set rollupOptions.input or Astro sets it from `serverEntrypoint`.
							isRollupInput(chunkInfo.name) ||
							isRollupInput(chunkInfo.facadeModuleId)
						) {
							return settings.config.build.serverEntry;
						} else {
							return '[name].mjs';
						}
					},
				},
			},
			ssr: true,
			ssrEmitAssets: true,
			// improve build performance
			minify: false,
			modulePreload: { polyfill: false },
			reportCompressedSize: false,
		},
		plugins,
		builder,
		envPrefix: viteConfig.envPrefix ?? 'PUBLIC_',
		base: settings.config.base,
		environments: {
			...(viteConfig.environments ?? {}),
			[ASTRO_VITE_ENVIRONMENT_NAMES.prerender]: {
				build: {
					emitAssets: true,
					outDir: fileURLToPath(getPrerenderOutputDirectory(settings)),
					rollupOptions: {
						// Only skip the default prerender entrypoint if an adapter with `entrypointResolution: 'self'` is used
						// AND provides a custom prerenderer. Otherwise, use the default.
						...(!legacyAdapter && settings.prerenderer
							? {}
							: { input: 'astro/entrypoints/prerender' }),
						output: {
							entryFileNames: `${PRERENDER_ENTRY_FILENAME_PREFIX}.[hash].mjs`,
							format: 'esm',
							...viteConfig.environments?.prerender?.build?.rollupOptions?.output,
						},
					},
					ssr: true,
				},
			},
			[ASTRO_VITE_ENVIRONMENT_NAMES.client]: {
				build: {
					emitAssets: true,
					target: 'esnext',
					outDir: fileURLToPath(getClientOutputDirectory(settings)),
					copyPublicDir: true,
					sourcemap: viteConfig.environments?.client?.build?.sourcemap ?? false,
					minify: true,
					rollupOptions: {
						preserveEntrySignatures: 'exports-only',
						output: {
							entryFileNames(chunkInfo) {
								return `${settings.config.build.assets}/${cleanChunkName(chunkInfo.name)}.[hash].js`;
							},
							chunkFileNames(chunkInfo) {
								return `${settings.config.build.assets}/${cleanChunkName(chunkInfo.name)}.[hash].js`;
							},
							assetFileNames(assetInfo) {
								// Strip the @_@ extension-masking pattern from asset names.
								// The @_@ pattern is an internal mechanism for virtual module IDs and should not leak into output filenames.
								const name = assetInfo.names?.[0] ?? '';
								if (name.includes(ASTRO_PAGE_EXTENSION_POST_PATTERN)) {
									const [sanitizedName] = name.split(ASTRO_PAGE_EXTENSION_POST_PATTERN);
									return `${settings.config.build.assets}/${sanitizedName}.[hash][extname]`;
								}
								return `${settings.config.build.assets}/[name].[hash][extname]`;
							},
							...viteConfig.environments?.client?.build?.rollupOptions?.output,
						},
					},
				},
			},
			[ASTRO_VITE_ENVIRONMENT_NAMES.ssr]: {
				build: {
					outDir: fileURLToPath(getServerOutputDirectory(settings)),
					rollupOptions: {
						output: {
							...viteConfig.environments?.ssr?.build?.rollupOptions?.output,
						},
					},
				},
			},
		},
	};
}
