import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import colors from 'piccolore';
import * as vite from 'vite';
import { LINKS_PLACEHOLDER } from '../../content/consts.js';
import { contentAssetsBuildPostHook } from '../../content/vite-plugin-content-assets.js';
import { type BuildInternals, createBuildInternals } from '../../core/build/internal.js';
import { emptyDir, removeEmptyDirs } from '../../core/fs/index.js';
import { appendForwardSlash, prependForwardSlash } from '../../core/path.js';
import { runHookBuildSetup } from '../../integrations/hooks.js';
import { SERIALIZED_MANIFEST_RESOLVED_ID } from '../../manifest/serialized.js';
import { getClientOutputDirectory, getServerOutputDirectory } from '../../prerender/utils.js';
import type { RouteData } from '../../types/public/internal.js';
import { VIRTUAL_PAGE_RESOLVED_MODULE_ID } from '../../vite-plugin-pages/const.js';
import { PAGE_SCRIPT_ID } from '../../vite-plugin-scripts/index.js';
import { routeIsRedirect } from '../routing/helpers.js';
import { getOutDirWithinCwd } from './common.js';
import { CHUNKS_PATH } from './consts.js';
import { generatePages } from './generate.js';
import { trackPageData } from './internal.js';
import { getAllBuildPlugins } from './plugins/index.js';
import { manifestBuildPostHook } from './plugins/plugin-manifest.js';
import {
	isLegacyAdapter,
	LEGACY_SSR_ENTRY_VIRTUAL_MODULE,
	RESOLVED_LEGACY_SSR_ENTRY_VIRTUAL_MODULE,
} from './plugins/plugin-ssr.js';
import { ASTRO_PAGE_EXTENSION_POST_PATTERN } from './plugins/util.js';
import type { StaticBuildOptions } from './types.js';
import { encodeName, getTimeStat, viteBuildReturnToRollupOutputs } from './util.js';
import { NOOP_MODULE_ID } from './plugins/plugin-noop.js';
import { ASTRO_VITE_ENVIRONMENT_NAMES } from '../constants.js';
import type { InputOption } from 'rollup';
import { getSSRAssets } from './internal.js';

const PRERENDER_ENTRY_FILENAME_PREFIX = 'prerender-entry';

/**
 * Minimal chunk data extracted from RollupOutput for deferred manifest/content injection.
 * Allows releasing full RollupOutput objects early to reduce memory usage.
 */
export interface ExtractedChunk {
	fileName: string;
	code: string;
	moduleIds: string[];
	prerender: boolean;
}

/**
 * Extracts only the chunks that need post-build injection from RollupOutput.
 * This allows releasing the full RollupOutput to reduce memory usage.
 */
function extractRelevantChunks(
	outputs: vite.Rollup.RollupOutput[],
	prerender: boolean,
): ExtractedChunk[] {
	const extracted: ExtractedChunk[] = [];

	for (const output of outputs) {
		for (const chunk of output.output) {
			if (chunk.type === 'asset') continue;

			const needsContentInjection = chunk.code.includes(LINKS_PLACEHOLDER);
			const needsManifestInjection = chunk.moduleIds.includes(SERIALIZED_MANIFEST_RESOLVED_ID);

			if (needsContentInjection || needsManifestInjection) {
				extracted.push({
					fileName: chunk.fileName,
					code: chunk.code,
					moduleIds: [...chunk.moduleIds],
					prerender,
				});
			}
		}
	}

	return extracted;
}

export async function viteBuild(opts: StaticBuildOptions) {
	const { allPages, settings } = opts;

	// The pages to be built for rendering purposes.
	// (comment above may be outdated ?)
	const pageInput = new Set<string>();

	// Build internals needed by the CSS plugin
	const internals = createBuildInternals();

	for (const pageData of Object.values(allPages)) {
		const astroModuleURL = new URL('./' + pageData.component, settings.config.root);
		const astroModuleId = prependForwardSlash(pageData.component);

		// Track the page data in internals
		trackPageData(internals, pageData.component, pageData, astroModuleId, astroModuleURL);

		if (!routeIsRedirect(pageData.route)) {
			pageInput.add(astroModuleId);
		}
	}

	// Empty out the dist folder, if needed. Vite has a config for doing this
	// but because we are running 2 vite builds in parallel, that would cause a race
	// condition, so we are doing it ourselves
	if (settings.config?.vite?.build?.emptyOutDir !== false) {
		emptyDir(settings.config.outDir, new Set('.git'));
	}

	// Build your project (SSR application code, assets, client JS, etc.)
	const ssrTime = performance.now();
	opts.logger.info('build', `Building ${settings.buildOutput} entrypoints...`);
	await buildEnvironments(opts, internals);
	opts.logger.info(
		'build',
		colors.green(`✓ Completed in ${getTimeStat(ssrTime, performance.now())}.`),
	);

	return { internals };
}

/**
 * Builds all Vite environments (SSR, prerender, client) in sequence.
 *
 * This is the core build function that orchestrates Astro's multi-environment build process.
 * Environments are built sequentially because they have dependencies on each other.
 *
 * ## Build Order & Dependencies
 *
 * 1. **SSR Environment** (built first)
 *    - Generates the server runtime entry point
 *    - Outputs to server directory
 *
 * 2. **Prerender Environment** (built second)
 *    - Generates code for static prerenderable routes
 *    - Entry: `astro/entrypoints/prerender`
 *    - Outputs to `.prerender/` in server directory
 *
 * 3. **Client Environment** (built last)
 *    - MUST be built after SSR/prerender because client inputs are discovered during those builds
 *    - During SSR/prerender, Astro discovers:
 *      - Components with hydration directives (client:*)
 *      - Client-only components
 *      - Page scripts
 *    - These discoveries populate `internals.clientInput` which becomes the rollup input
 *    - Config is mutated after builder creation to set dynamic inputs
 *    - If no client scripts exist, uses a "noop" entrypoint to satisfy Rollup's input requirement
 *    - public/ folder is copied during this build
 *
 * Returns outputs from each environment for post-build processing (manifest injection, etc).
 */
async function buildEnvironments(opts: StaticBuildOptions, internals: BuildInternals) {
	const { allPages, settings, viteConfig } = opts;
	const routes = Object.values(allPages).flatMap((pageData) => pageData.route);

	const legacyAdapter = !settings.adapter || isLegacyAdapter(settings.adapter);

	const buildPlugins = getAllBuildPlugins(internals, opts);
	const flatPlugins = buildPlugins.flat().filter(Boolean);
	const plugins = [...flatPlugins, ...(viteConfig.plugins || [])];
	let currentRollupInput: InputOption | undefined = undefined;
	plugins.push({
		name: 'astro:resolve-input',
		// When the rollup input is safe to update, we normalize it to always be an object
		// so we can reliably identify which entrypoint corresponds to the adapter
		enforce: 'post',
		config(config) {
			if (typeof config.build?.rollupOptions?.input === 'string') {
				config.build.rollupOptions.input = { index: config.build.rollupOptions.input };
			} else if (Array.isArray(config.build?.rollupOptions?.input)) {
				config.build.rollupOptions.input = Object.fromEntries(
					config.build.rollupOptions.input.map((v, i) => [`index_${i}`, v]),
				);
			}
		},
		// We save the rollup input to be able to check later on
		configResolved(config) {
			currentRollupInput = config.build.rollupOptions.input;
		},
	});
	// Post plugin for manifest injection, page generation, and cleanup
	// This runs after all other buildApp hooks (including platform plugins like Cloudflare)
	plugins.push({
		name: 'astro:build-generate',
		enforce: 'post',
		buildApp: {
			order: 'post',
			async handler() {
				// Inject manifest and content placeholders into extracted chunks
				await runManifestInjection(opts, internals, internals.extractedChunks ?? []);

				// Generation and cleanup
				const prerenderOutputDir = new URL('./.prerender/', getServerOutputDirectory(settings));

				// TODO: The `static` and `server` branches below are nearly identical now.
				// Consider refactoring to remove the else-if and unify the logic.
				if (settings.buildOutput === 'static') {
					settings.timer.start('Static generate');
					// Move prerender and SSR assets to client directory before cleaning up
					await ssrMoveAssets(opts, internals, prerenderOutputDir);
					// Generate the pages
					await generatePages(opts, internals, prerenderOutputDir);
					// Clean up prerender directory after generation
					await fs.promises.rm(prerenderOutputDir, { recursive: true, force: true });
					settings.timer.end('Static generate');
				} else if (settings.buildOutput === 'server') {
					settings.timer.start('Server generate');
					await generatePages(opts, internals, prerenderOutputDir);
					// Move prerender and SSR assets to client directory before cleaning up
					await ssrMoveAssets(opts, internals, prerenderOutputDir);
					// Clean up prerender directory after generation
					await fs.promises.rm(prerenderOutputDir, { recursive: true, force: true });
					settings.timer.end('Server generate');
				}
			},
		},
	});

	function isRollupInput(moduleName: string | null): boolean {
		if (!currentRollupInput || !moduleName) {
			return false;
		}
		if (typeof currentRollupInput === 'string') {
			return currentRollupInput === moduleName;
		} else if (Array.isArray(currentRollupInput)) {
			return currentRollupInput.includes(moduleName);
		} else {
			return Object.keys(currentRollupInput).includes(moduleName);
		}
	}

	const viteBuildConfig: vite.InlineConfig = {
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
							return [prefix, sanitizedName, suffix].join('');
						}
						// Injected routes include "pages/[name].[ext]" already. Clean those up!
						if (name.startsWith('pages/')) {
							const sanitizedName = name.split('.')[0];
							return [prefix, sanitizedName, suffix].join('');
						}
						const encoded = encodeName(name);
						return [prefix, encoded, suffix].join('');
					},
					assetFileNames: `${settings.config.build.assets}/[name].[hash][extname]`,
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
							return opts.settings.config.build.serverEntry;
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
		// Top-level buildApp for framework build orchestration
		// This takes precedence over platform plugin fallbacks (e.g., Cloudflare)
		builder: {
			async buildApp(builder) {
				// Build ssr environment for server output (only for non-static builds)
				let ssrChunks: BuildInternals['extractedChunks'] = [];
				if (settings.buildOutput !== 'static') {
					settings.timer.start('SSR build');
					let ssrOutput = await builder.build(
						builder.environments[ASTRO_VITE_ENVIRONMENT_NAMES.ssr],
					);
					settings.timer.end('SSR build');
					// Extract chunks needing injection, then release output for GC
					const ssrOutputs = viteBuildReturnToRollupOutputs(ssrOutput);
					ssrChunks = extractRelevantChunks(ssrOutputs, false);
					ssrOutput = undefined as any;
				}

				// Build prerender environment for static generation
				settings.timer.start('Prerender build');
				let prerenderOutput = await builder.build(builder.environments.prerender);
				settings.timer.end('Prerender build');

				// Extract prerender entry filename and store in internals
				extractPrerenderEntryFileName(internals, prerenderOutput);

				// Extract chunks needing injection, then release output for GC
				const prerenderOutputs = viteBuildReturnToRollupOutputs(prerenderOutput);
				const prerenderChunks = extractRelevantChunks(prerenderOutputs, true);
				prerenderOutput = undefined as any;

				// Build client environment
				// We must discover client inputs after SSR build because hydration/client-only directives
				// are only detected during SSR. We mutate the config here since the builder was already created
				// and this is the only way to update the input after instantiation.
				internals.clientInput = getClientInput(internals, settings);
				if (!internals.clientInput.size) {
					// At least 1 input is required to do a build, otherwise Vite throws.
					// We need the client build to happen in order to copy over the `public/` folder
					// So using the noop plugin here which will give us an input that just gets thrown away.
					internals.clientInput.add(NOOP_MODULE_ID);
				}
				builder.environments.client.config.build.rollupOptions.input = Array.from(
					internals.clientInput,
				);
				settings.timer.start('Client build');
				await builder.build(builder.environments.client);
				settings.timer.end('Client build');

				// Store extracted chunks on internals for post plugin to consume
				internals.extractedChunks = [...ssrChunks, ...prerenderChunks];
			},
		},
		envPrefix: viteConfig.envPrefix ?? 'PUBLIC_',
		base: settings.config.base,
		environments: {
			...(viteConfig.environments ?? {}),
			[ASTRO_VITE_ENVIRONMENT_NAMES.prerender]: {
				build: {
					emitAssets: true,
					outDir: fileURLToPath(new URL('./.prerender/', getServerOutputDirectory(settings))),
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
							entryFileNames: `${settings.config.build.assets}/[name].[hash].js`,
							chunkFileNames: `${settings.config.build.assets}/[name].[hash].js`,
							assetFileNames: `${settings.config.build.assets}/[name].[hash][extname]`,
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

	const updatedViteBuildConfig = await runHookBuildSetup({
		config: settings.config,
		pages: internals.pagesByKeys,
		vite: viteBuildConfig,
		target: 'server',
		logger: opts.logger,
	});

	const builder = await vite.createBuilder(updatedViteBuildConfig);
	await builder.buildApp();
}

/**
 * Finds and returns the prerender entry filename from the build output.
 * Throws an error if no prerender entry file is found.
 */
function getPrerenderEntryFileName(
	prerenderOutput:
		| vite.Rollup.RollupOutput
		| vite.Rollup.RollupOutput[]
		| vite.Rollup.RollupWatcher,
): string {
	const outputs = viteBuildReturnToRollupOutputs(prerenderOutput);

	for (const output of outputs) {
		for (const chunk of output.output) {
			if (chunk.type !== 'asset' && 'fileName' in chunk) {
				const fileName = chunk.fileName;
				if (fileName.startsWith(PRERENDER_ENTRY_FILENAME_PREFIX)) {
					return fileName;
				}
			}
		}
	}

	throw new Error(
		'Could not find the prerender entry point in the build output. This is likely a bug in Astro.',
	);
}

/**
 * Extracts the prerender entry filename from the build output
 * and stores it in internals for later retrieval in generatePages.
 */
function extractPrerenderEntryFileName(
	internals: BuildInternals,
	prerenderOutput:
		| vite.Rollup.RollupOutput
		| vite.Rollup.RollupOutput[]
		| vite.Rollup.RollupWatcher,
) {
	internals.prerenderEntryFileName = getPrerenderEntryFileName(prerenderOutput);
}

async function runManifestInjection(
	opts: StaticBuildOptions,
	internals: BuildInternals,
	chunks: ExtractedChunk[],
) {
	const mutations = new Map<string, { code: string; prerender: boolean }>();

	const mutate = (fileName: string, newCode: string, prerender: boolean) => {
		mutations.set(fileName, { code: newCode, prerender });
	};

	await manifestBuildPostHook(opts, internals, { chunks, mutate });
	await contentAssetsBuildPostHook(
		opts.settings.config.base,
		opts.settings.config.build.assetsPrefix,
		internals,
		{ chunks, mutate },
	);
	await writeMutatedChunks(opts, mutations);
}

/**
 * Writes chunks that were modified by post-build hooks (e.g., manifest injection).
 * Mutations are collected during the manifest hook and persisted here to the
 * appropriate output directories (server or prerender).
 */
async function writeMutatedChunks(
	opts: StaticBuildOptions,
	mutations: Map<string, { code: string; prerender: boolean }>,
) {
	const { settings } = opts;
	const config = settings.config;
	const serverOutputDir = getServerOutputDirectory(settings);

	for (const [fileName, mutation] of mutations) {
		let root: URL;

		if (mutation.prerender) {
			// Write to prerender directory
			root = new URL('./.prerender/', serverOutputDir);
		} else if (settings.buildOutput === 'server') {
			root = config.build.server;
		} else {
			root = getOutDirWithinCwd(config.outDir);
		}

		const fullPath = path.join(fileURLToPath(root), fileName);
		const fileURL = pathToFileURL(fullPath);
		await fs.promises.mkdir(new URL('./', fileURL), { recursive: true });
		await fs.promises.writeFile(fileURL, mutation.code, 'utf-8');
	}
}

/**
 * Moves prerender and SSR assets to the client directory.
 * In server mode, assets are initially scattered across server and prerender
 * directories but need to be consolidated in the client directory for serving.
 * Reads asset filenames from internals.ssrAssetsPerEnvironment which is populated
 * by vitePluginSSRAssets during the build.
 */
async function ssrMoveAssets(
	opts: StaticBuildOptions,
	internals: BuildInternals,
	prerenderOutputDir: URL,
) {
	opts.logger.info('build', 'Rearranging server assets...');
	const isFullyStaticSite = opts.settings.buildOutput === 'static';
	const serverRoot = opts.settings.config.build.server;
	const clientRoot = isFullyStaticSite
		? opts.settings.config.outDir
		: opts.settings.config.build.client;

	// Move prerender assets
	const prerenderAssetsToMove = getSSRAssets(internals, ASTRO_VITE_ENVIRONMENT_NAMES.prerender);
	if (prerenderAssetsToMove.size > 0) {
		await Promise.all(
			Array.from(prerenderAssetsToMove).map(async function moveAsset(filename) {
				const currentUrl = new URL(filename, appendForwardSlash(prerenderOutputDir.toString()));
				const clientUrl = new URL(filename, appendForwardSlash(clientRoot.toString()));
				if (!fs.existsSync(currentUrl)) return;
				const dir = new URL(path.parse(clientUrl.href).dir);
				if (!fs.existsSync(dir)) await fs.promises.mkdir(dir, { recursive: true });
				return fs.promises.rename(currentUrl, clientUrl);
			}),
		);
	}

	// If this is fully static site, we don't need to do the next parts at all.
	if (isFullyStaticSite) {
		return;
	}

	// Move SSR assets
	const ssrAssetsToMove = getSSRAssets(internals, ASTRO_VITE_ENVIRONMENT_NAMES.ssr);
	if (ssrAssetsToMove.size > 0) {
		await Promise.all(
			Array.from(ssrAssetsToMove).map(async function moveAsset(filename) {
				const currentUrl = new URL(filename, appendForwardSlash(serverRoot.toString()));
				const clientUrl = new URL(filename, appendForwardSlash(clientRoot.toString()));
				if (!fs.existsSync(currentUrl)) return;
				const dir = new URL(path.parse(clientUrl.href).dir);
				if (!fs.existsSync(dir)) await fs.promises.mkdir(dir, { recursive: true });
				return fs.promises.rename(currentUrl, clientUrl);
			}),
		);
		removeEmptyDirs(fileURLToPath(serverRoot));
	}
}

function getClientInput(
	internals: BuildInternals,
	settings: StaticBuildOptions['settings'],
): Set<string> {
	const rendererClientEntrypoints = settings.renderers
		.map((r) => r.clientEntrypoint)
		.filter((a) => typeof a === 'string') as string[];

	const clientInput = new Set([
		...internals.discoveredHydratedComponents.keys(),
		...internals.discoveredClientOnlyComponents.keys(),
		...rendererClientEntrypoints,
		...internals.discoveredScripts,
	]);

	if (settings.scripts.some((script) => script.stage === 'page')) {
		clientInput.add(PAGE_SCRIPT_ID);
	}

	return clientInput;
}

/**
 * This function takes the virtual module name of any page entrypoint and
 * transforms it to generate a final `.mjs` output file.
 *
 * Input: `@astro-page:src/pages/index@_@astro`
 * Output: `pages/index.astro.mjs`
 * Input: `@astro-page:../node_modules/my-dep/injected@_@astro`
 * Output: `pages/injected.mjs`
 *
 * 1. We clean the `facadeModuleId` by removing the `ASTRO_PAGE_MODULE_ID` prefix and `ASTRO_PAGE_EXTENSION_POST_PATTERN`.
 * 2. We find the matching route pattern in the manifest (or fallback to the cleaned module id)
 * 3. We replace square brackets with underscore (`[slug]` => `_slug_`) and `...` with `` (`[...slug]` => `_---slug_`).
 * 4. We append the `.mjs` extension, so the file will always be an ESM module
 *
 * @param prefix string
 * @param facadeModuleId string
 * @param pages AllPagesData
 */
export function makeAstroPageEntryPointFileName(
	prefix: string,
	facadeModuleId: string,
	routes: RouteData[],
) {
	const pageModuleId = facadeModuleId
		.replace(prefix, '')
		.replace(ASTRO_PAGE_EXTENSION_POST_PATTERN, '.');
	const route = routes.find((routeData) => routeData.component === pageModuleId);
	const name = route?.route ?? pageModuleId;
	return `pages${name
		.replace(/\/$/, '/index')
		.replaceAll(/[[\]]/g, '_')
		.replaceAll('...', '---')}.astro.mjs`;
}
