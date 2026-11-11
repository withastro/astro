import { fileURLToPath } from 'node:url';
import type * as vite from 'vite';
import type { RouteData } from '../../../index.js';
import {
	getClientOutputDirectory,
	getPrerenderOutputDirectory,
	getServerOutputDirectory,
} from './common.js';
import { VIRTUAL_PAGE_RESOLVED_MODULE_ID } from '../../vite-plugin-pages/const.js';
import { ASTRO_VITE_ENVIRONMENT_NAMES } from '../constants.js';
import { CHUNKS_PATH } from '../../../core/build/consts.js';
import { ASTRO_PAGE_EXTENSION_POST_PATTERN } from '../../../core/build/plugins/util.js';
import { cleanChunkName } from './util.js';
import { makeAstroPageEntryPointFileName } from './static-build.js';
import type { StaticBuildOptionsInput } from './types.js';

const PRERENDER_ENTRY_FILENAME_PREFIX = 'prerender-entry';

export interface CreateViteBuildConfigOptions {
	options: Pick<StaticBuildOptionsInput, 'config' | 'buildOutput' | 'host'>;
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
	isRolldownInput: (moduleName: string | null | undefined) => boolean;
}

/**
 * Creates the Vite InlineConfig used for the multi-environment build.
 *
 * This is a pure config assembly function — it does not execute the build.
 * Extracted from `buildEnvironments()` to enable unit testing of config
 * merging behavior (e.g. user rollup output overrides).
 */
export function createViteBuildConfig(opts: CreateViteBuildConfigOptions): vite.InlineConfig {
	const { options, viteConfig, routes, plugins, builder, isRolldownInput } = opts;
	const { config, buildOutput, host } = options;
	const userTreeshake = viteConfig.build?.rolldownOptions?.treeshake;

	// Separate Astro-managed environment keys from user-defined ones so that the
	// managed environments always appear last (and in a fixed order) in the object.
	// Vite's `configResolved` fires per environment in key-insertion order, and the
	// `astro:resolve-input` plugin relies on `ssr` being resolved last so its
	// rolldown input value is the one that persists. If a user-defined
	// `environments.ssr` is spread first, its key position would place SSR earlier
	// in the iteration order, causing later environments to overwrite the saved
	// input. See https://github.com/withastro/astro/issues/17760
	const {
		[ASTRO_VITE_ENVIRONMENT_NAMES.ssr]: userSsr,
		[ASTRO_VITE_ENVIRONMENT_NAMES.prerender]: userPrerender,
		[ASTRO_VITE_ENVIRONMENT_NAMES.client]: userClient,
		...userEnvironments
	} = viteConfig.environments ?? {};

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
			rolldownOptions: {
				...viteConfig.build?.rolldownOptions,
				// Setting as `exports-only` allows us to safely delete inputs that are only used during prerendering
				preserveEntrySignatures: 'exports-only',
				// Compiled components declare `const $$Foo = $$createComponent(...)` at the top level.
				// Without marking the call pure, Rolldown keeps it and reports the component's default
				// export as rendered even when unused (e.g. re-exported from a barrel file), so Vite's
				// `cssScopeTo` check keeps the component's scoped styles. https://github.com/withastro/astro/issues/18491
				treeshake:
					userTreeshake === false
						? false
						: {
								...(typeof userTreeshake === 'object' ? userTreeshake : {}),
								manualPureFunctions: [
									...((typeof userTreeshake === 'object' && userTreeshake.manualPureFunctions) ||
										[]),
									'$$createComponent',
								],
							},
				checks: {
					...viteConfig.build?.rolldownOptions?.checks,
					// Disable Rolldown's built-in plugin timing warnings. These fire by default
					// and produce noisy warnings about slow plugins during normal builds.
					pluginTimings: false,
				},
				...(host.serverEntry && buildOutput === 'server' ? { input: host.serverEntry.id } : {}),
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
							return `${config.build.assets}/${sanitizedName}.[hash][extname]`;
						}
						return `${config.build.assets}/[name].[hash][extname]`;
					},
					...viteConfig.build?.rolldownOptions?.output,
					entryFileNames(chunkInfo) {
						if (chunkInfo.facadeModuleId?.startsWith(VIRTUAL_PAGE_RESOLVED_MODULE_ID)) {
							return makeAstroPageEntryPointFileName(
								VIRTUAL_PAGE_RESOLVED_MODULE_ID,
								chunkInfo.facadeModuleId,
								routes,
							);
						} else if (
							(host.serverEntry && chunkInfo.facadeModuleId === host.serverEntry.resolvedId) ||
							// This catches the case when the adapter uses `entrypointResolution: 'auto'`. When doing so,
							// the adapter must set rolldownOptions.input or Astro sets it from `serverEntrypoint`.
							isRolldownInput(chunkInfo.name) ||
							isRolldownInput(chunkInfo.facadeModuleId)
						) {
							return config.build.serverEntry;
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
		base: config.base,
		environments: {
			...userEnvironments,
			...host.environments,
			[ASTRO_VITE_ENVIRONMENT_NAMES.prerender]: {
				...userPrerender,
				build: {
					emitAssets: true,
					outDir: fileURLToPath(getPrerenderOutputDirectory(options)),
					rolldownOptions: {
						...(host.prerenderEntry ? { input: host.prerenderEntry } : {}),
						output: {
							entryFileNames: `${PRERENDER_ENTRY_FILENAME_PREFIX}.[hash].mjs`,
							format: 'esm',
							...userPrerender?.build?.rolldownOptions?.output,
						},
					},
					ssr: true,
				},
			},
			[ASTRO_VITE_ENVIRONMENT_NAMES.client]: {
				...userClient,
				build: {
					emitAssets: true,
					target: 'esnext',
					outDir: fileURLToPath(getClientOutputDirectory(options)),
					copyPublicDir: true,
					sourcemap: userClient?.build?.sourcemap ?? viteConfig.build?.sourcemap ?? false,
					minify: userClient?.build?.minify ?? viteConfig.build?.minify ?? true,
					rolldownOptions: {
						preserveEntrySignatures: 'exports-only',
						output: {
							// Inherit top-level rolldown output options (e.g. compact) as a
							// base, then layer Astro defaults on top so that Astro's
							// naming functions are preserved unless explicitly overridden
							// via the environment-specific config.
							...viteConfig.build?.rolldownOptions?.output,
							entryFileNames(chunkInfo) {
								return `${config.build.assets}/${cleanChunkName(chunkInfo.name)}.[hash].js`;
							},
							chunkFileNames(chunkInfo) {
								return `${config.build.assets}/${cleanChunkName(chunkInfo.name)}.[hash].js`;
							},
							assetFileNames(assetInfo) {
								// Strip the @_@ extension-masking pattern from asset names.
								// The @_@ pattern is an internal mechanism for virtual module IDs and should not leak into output filenames.
								const name = assetInfo.names?.[0] ?? '';
								if (name.includes(ASTRO_PAGE_EXTENSION_POST_PATTERN)) {
									const [sanitizedName] = name.split(ASTRO_PAGE_EXTENSION_POST_PATTERN);
									return `${config.build.assets}/${sanitizedName}.[hash][extname]`;
								}
								return `${config.build.assets}/[name].[hash][extname]`;
							},
							...userClient?.build?.rolldownOptions?.output,
						},
					},
				},
			},
			[ASTRO_VITE_ENVIRONMENT_NAMES.ssr]: {
				...userSsr,
				build: {
					outDir: fileURLToPath(getServerOutputDirectory(options)),
					rolldownOptions: {
						output: {
							...userSsr?.build?.rolldownOptions?.output,
							// Workaround for a Rolldown chunking bug (upstream issue pending): Rolldown merges its
							// runtime helpers into an existing chunk, and that host can be a page chunk. The server
							// entry then imports the page chunk statically, so pages evaluate at startup, before an
							// adapter sets up the environment with `setGetEnv()`. Neither `codeSplitting` groups
							// (they never match the runtime module) nor `chunkOptimization` prevent it; wrapping
							// modules in source order keeps the runtime in its own chunk. Remove this once Rolldown
							// stops merging its runtime into dynamically imported chunks.
							strictExecutionOrder: true,
						},
					},
				},
			},
		},
	};
}
