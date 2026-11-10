import fs from 'node:fs';
import { getRouterRegistry } from '../../registry.js';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import colors from 'piccolore';
import * as vite from 'vite';
import { type BuildInternals, createBuildInternals } from './internal.js';
import { copyTimestamps, emptyDir, removeEmptyDirs } from '../fs/index.js';
import { prependForwardSlash } from '@astrojs/internal-helpers/path';
import { SERIALIZED_MANIFEST_RESOLVED_ID } from '../constants.js';
import type { BuildOutputDirectories, RouteData } from '../../../index.js';

import { generatePages } from './generate.js';
import { pathToDirectoryURL } from './common.js';
import { trackPageData } from './internal.js';
import { getAllBuildPlugins } from '../../../core/build/plugins/index.js';
import { manifestBuildPostHook } from './plugins/plugin-manifest.js';

import { ASTRO_PAGE_EXTENSION_POST_PATTERN } from '../../../core/build/plugins/util.js';
import type {
	BuildPostHook,
	ExtractedChunk,
	StaticBuildOptions,
	StaticBuildOptionsInput,
} from './types.js';
import { getTimeStat, viteBuildReturnToRolldownOutputs } from './util.js';
import { NOOP_MODULE_ID } from '../../../core/build/plugins/plugin-noop.js';
import { ASTRO_VITE_ENVIRONMENT_NAMES } from '../constants.js';
import type { Rolldown } from 'vite';
import { getSSRAssets } from './internal.js';
import {
	SERVER_ISLAND_MAP_MARKER,
	hasServerIslands,
} from '../server-islands/vite-plugin-server-islands.js';
import { buildPhase, buildTimingsVitePlugins } from './timings/index.js';
import { createViteBuildConfig } from './vite-build-config.js';
import { removeViteManifestDirectories } from './vite-plugin-ssr-assets.js';

const PRERENDER_ENTRY_FILENAME_PREFIX = 'prerender-entry';

export type { ExtractedChunk };

/**
 * Extracts only the chunks that need post-build injection from RolldownOutput.
 * This allows releasing the full RolldownOutput to reduce memory usage.
 */
function extractRelevantChunks(
	outputs: vite.Rolldown.RolldownOutput[],
	prerender: boolean,
	markers: readonly string[],
): ExtractedChunk[] {
	const extracted: ExtractedChunk[] = [];

	for (const output of outputs) {
		for (const chunk of output.output) {
			if (chunk.type === 'asset') continue;

			const needsHostInjection = markers.some((marker) => chunk.code.includes(marker));
			const needsManifestInjection = chunk.moduleIds.includes(SERIALIZED_MANIFEST_RESOLVED_ID);
			const needsServerIslandInjection = chunk.code.includes(SERVER_ISLAND_MAP_MARKER);

			if (needsHostInjection || needsManifestInjection || needsServerIslandInjection) {
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

export async function viteBuild(opts: StaticBuildOptionsInput) {
	// Build internals needed by the CSS plugin
	const internals = createBuildInternals();
	prepareBuild(opts, internals);

	// Build your project (SSR application code, assets, client JS, etc.)
	const ssrTime = performance.now();
	opts.logger.info('build', `Building ${opts.buildOutput} entrypoints...`);
	const outputDirectories = await buildEnvironments(opts, internals);
	opts.logger.info(
		'build',
		colors.green(`✓ Completed in ${getTimeStat(ssrTime, performance.now())}.`),
	);

	return { internals, outputDirectories };
}

/** Records the pages in `internals` and empties the output directory. */
export function prepareBuild(opts: StaticBuildOptionsInput, internals: BuildInternals): void {
	const { allPages, config } = opts;
	for (const pageData of Object.values(allPages)) {
		const astroModuleURL = new URL('./' + pageData.component, config.root);
		const astroModuleId = prependForwardSlash(pageData.component);

		// Track the page data in internals
		trackPageData(internals, pageData.component, pageData, astroModuleId, astroModuleURL);
	}

	// Empty out the dist folder, if needed. Vite has a config for doing this
	// but because we are running 2 vite builds in parallel, that would cause a race
	// condition, so we are doing it ourselves.
	if (opts.viteConfig.build?.emptyOutDir !== false) {
		emptyDir(config.outDir, new Set('.git'));
	}
}

/**
 * Builds all Vite environments (SSR, prerender, client) in sequence.
 *
 * This is the core build function that orchestrates Astro's multi-environment build process.
 * Environments are built sequentially because they have dependencies on each other.
 *
 * ## Build Order & Dependencies
 *
 * 1. **Prerender Environment** (built first)
 *    - Generates code for static prerenderable routes
 *    - Entry: `astro/entrypoints/prerender`
 *    - Outputs to `.prerender/` in server directory
 *
 * 2. **SSR Environment** (built second)
 *    - Generates the server runtime entry point
 *    - Outputs to server directory
 *
 * 3. **Client Environment** (built last)
 *    - MUST be built after SSR/prerender because client inputs are discovered during those builds
 *    - During SSR/prerender, Astro discovers:
 *      - Components with hydration directives (client:*)
 *      - Client-only components
 *      - Page scripts
 *    - These discoveries populate `internals.clientInput` which becomes the rolldown input
 *    - Config is mutated after builder creation to set dynamic inputs
 *    - If no client scripts exist, uses a "noop" entrypoint to satisfy Rolldown's input requirement
 *    - public/ folder is copied during this build
 *
 * Returns outputs from each environment for post-build processing (manifest injection, etc).
 */
async function buildEnvironments(opts: StaticBuildOptionsInput, internals: BuildInternals) {
	const { allPages, host, viteConfig } = opts;
	const routes = Object.values(allPages).flatMap((pageData) => pageData.route);
	const steps = createBuildSteps(opts, internals);
	const plugins = [
		...steps.buildPlugins,
		...(viteConfig.plugins || []),
		...buildTimingsVitePlugins(),
		...steps.postPlugins,
	];

	const viteBuildConfig = createViteBuildConfig({
		options: opts,
		viteConfig,
		routes,
		plugins,
		// Top-level buildApp for framework build orchestration
		// This takes precedence over platform plugin fallbacks (e.g., Cloudflare)
		builder: { buildApp: steps.buildApp },
		isRolldownInput: steps.isRolldownInput,
	});

	const updatedViteBuildConfig = await host.setupViteConfig(viteBuildConfig, internals.pagesByKeys);

	const builder = await vite.createBuilder(updatedViteBuildConfig);
	internals.routerRegistry = getRouterRegistry(builder.config);
	await builder.buildApp();
	return getResolvedOutputDirectories(builder);
}

function getResolvedOutputDirectories(builder: vite.ViteBuilder): BuildOutputDirectories {
	const environments = builder.environments;
	return {
		client: pathToDirectoryURL(
			environments[ASTRO_VITE_ENVIRONMENT_NAMES.client].config.build.outDir,
		),
		server: pathToDirectoryURL(environments[ASTRO_VITE_ENVIRONMENT_NAMES.ssr].config.build.outDir),
		prerender: pathToDirectoryURL(
			environments[ASTRO_VITE_ENVIRONMENT_NAMES.prerender].config.build.outDir,
		),
	};
}

/** The plugins and the environment builds of a production build. */
export interface BuildSteps {
	/** The build's own plugins. */
	buildPlugins: vite.Plugin[];
	/** Plugins that must come after every other plugin: input normalization, page generation. */
	postPlugins: vite.Plugin[];
	/** Builds the prerender, server and client environments, in that order. */
	buildApp(builder: vite.ViteBuilder): Promise<void>;
	/** Whether `moduleName` is an input of the server build. */
	isRolldownInput(moduleName: string | null | undefined): boolean;
	/** Replaces the server build input recorded when the config was resolved. */
	setRolldownInput(input: Rolldown.InputOption | undefined): void;
}

/**
 * Creates the plugins and the `buildApp` steps of a production build. They read `opts` when
 * their hooks run, so a host can fill it in once the route table is known.
 */
export function createBuildSteps(
	opts: StaticBuildOptionsInput,
	internals: BuildInternals,
): BuildSteps {
	const buildPlugins = getAllBuildPlugins(internals, opts).flat().filter(Boolean) as vite.Plugin[];
	let currentRolldownInput: Rolldown.InputOption | undefined = undefined;
	let buildPostHooks: BuildPostHook[] = [];
	const postPlugins: vite.Plugin[] = [
		{
			name: 'astro:resolve-input',
			// When the rolldown input is safe to update, we normalize it to always be an object
			// so we can reliably identify which entrypoint corresponds to the adapter
			enforce: 'post',
			config(config) {
				if (typeof config.build?.rolldownOptions?.input === 'string') {
					config.build.rolldownOptions.input = { index: config.build.rolldownOptions.input };
				} else if (Array.isArray(config.build?.rolldownOptions?.input)) {
					config.build.rolldownOptions.input = Object.fromEntries(
						config.build.rolldownOptions.input.map((v, i) => [`index_${i}`, v]),
					);
				}
			},
			// We save the rolldown input to be able to check later on
			configResolved(config) {
				currentRolldownInput = config.build.rolldownOptions.input;
			},
		},
		// Post plugin for manifest injection, page generation, and cleanup
		// This runs after all other buildApp hooks (including platform plugins like Cloudflare)
		{
			name: 'astro:build-generate',
			enforce: 'post',
			buildApp: {
				order: 'post',
				async handler(builder) {
					const { buildOutput, host } = opts;
					const resolvedOpts: StaticBuildOptions = {
						...opts,
						outputDirectories: getResolvedOutputDirectories(builder),
					};
					try {
						// Inject manifest and content placeholders into extracted chunks
						await buildPhase('manifest injection', () =>
							runManifestInjection(
								resolvedOpts,
								internals,
								internals.extractedChunks ?? [],
								buildPostHooks,
							),
						);

						// Generation and cleanup
						const prerenderOutputDir = resolvedOpts.outputDirectories.prerender;

						// TODO: The `static` and `server` branches below are nearly identical now.
						// Consider refactoring to remove the else-if and unify the logic.
						if (buildOutput === 'static') {
							host.timer.start('Static generate');
							// Move prerender and SSR assets to client directory before cleaning up
							await buildPhase('rearrange assets', () => ssrMoveAssets(resolvedOpts, internals));
							// Generate the pages
							await buildPhase('generate pages', () =>
								generatePages(resolvedOpts, internals, prerenderOutputDir, builder),
							);
							// Clean up prerender directory after generation
							await fs.promises.rm(prerenderOutputDir, { recursive: true, force: true });
							host.timer.end('Static generate');
						} else if (buildOutput === 'server') {
							host.timer.start('Server generate');
							await buildPhase('generate pages', () =>
								generatePages(resolvedOpts, internals, prerenderOutputDir, builder),
							);
							// Move prerender and SSR assets to client directory before cleaning up
							await buildPhase('rearrange assets', () => ssrMoveAssets(resolvedOpts, internals));
							// Clean up prerender directory after generation
							await fs.promises.rm(prerenderOutputDir, { recursive: true, force: true });
							host.timer.end('Server generate');
						}
					} finally {
						await removeViteManifestDirectories(
							Array.from(internals.astroViteManifestDirectories, (href) => new URL(href)),
						);
					}
				},
			},
		},
	];

	function isRolldownInput(moduleName: string | null | undefined): boolean {
		if (!currentRolldownInput || !moduleName) {
			return false;
		}
		if (typeof currentRolldownInput === 'string') {
			return currentRolldownInput === moduleName;
		} else if (Array.isArray(currentRolldownInput)) {
			return currentRolldownInput.includes(moduleName);
		} else {
			return Object.keys(currentRolldownInput).includes(moduleName);
		}
	}

	async function buildApp(builder: vite.ViteBuilder) {
		const { buildOutput, host } = opts;
		const chunkMarkers = host.chunkPostHooks.map((hook) => hook.marker);
		internals.routerRegistry = getRouterRegistry(builder.config);
		// Build prerender environment for static generation
		host.timer.start('Prerender build');
		let prerenderOutput = await buildPhase('prerender bundle', () =>
			builder.build(builder.environments.prerender),
		);
		host.timer.end('Prerender build');

		// Extract prerender entry filename and store in internals
		extractPrerenderEntryFileName(internals, prerenderOutput);

		// Extract chunks needing injection, then release output for GC
		const prerenderOutputs = viteBuildReturnToRolldownOutputs(prerenderOutput);
		const prerenderChunks = extractRelevantChunks(prerenderOutputs, true, chunkMarkers);
		prerenderOutput = undefined as any;

		// Build ssr environment for server output
		let ssrChunks: BuildInternals['extractedChunks'] = [];
		if (needsServerBuild(buildOutput, builder)) {
			host.timer.start('SSR build');
			let ssrOutput = await buildPhase('ssr bundle', () =>
				builder.build(builder.environments[ASTRO_VITE_ENVIRONMENT_NAMES.ssr]),
			);
			host.timer.end('SSR build');
			// Extract chunks needing injection, then release output for GC
			const ssrOutputs = viteBuildReturnToRolldownOutputs(ssrOutput);
			ssrChunks = extractRelevantChunks(ssrOutputs, false, chunkMarkers);
			ssrOutput = undefined as any;
		}

		const ssrPlugins = builder.environments[ASTRO_VITE_ENVIRONMENT_NAMES.ssr]?.config.plugins ?? [];
		buildPostHooks = ssrPlugins
			.map((plugin: vite.Plugin) =>
				typeof plugin.api?.buildPostHook === 'function' ? plugin.api.buildPostHook : undefined,
			)
			.filter(Boolean) as BuildPostHook[];

		// Build client environment
		// We must discover client inputs after SSR build because hydration/client-only directives
		// are only detected during SSR. We mutate the config here since the builder was already created
		// and this is the only way to update the input after instantiation.
		internals.clientInput = getClientInput(internals, host.renderers);
		if (!internals.clientInput.size) {
			// At least 1 input is required to do a build; otherwise, Vite throws.
			// We need the client build to happen in order to copy over the `public/` folder
			// So using the noop plugin here which will give us an input that just gets thrown away.
			internals.clientInput.add(NOOP_MODULE_ID);
		}
		// Sort the client input to ensure deterministic Rollup entry point ordering.
		// `internals.clientInput` is a Set whose iteration order depends on async module resolution
		// timing during prerendering. Without sorting, consecutive builds of the same
		// source code can produce different output filenames, breaking CDN caching.
		const sortedClientInput = Array.from(internals.clientInput).sort();
		builder.environments.client.config.build.rolldownOptions.input = sortedClientInput;
		host.timer.start('Client build');
		await buildPhase('client bundle', () => builder.build(builder.environments.client));
		// Vite copies public files without keeping timestamps (#18483).
		// Use its resolved config, including publicDir/copyPublicDir overrides.
		const clientConfig = builder.environments.client.config;
		if (clientConfig.build.copyPublicDir && clientConfig.publicDir) {
			await copyTimestamps(
				pathToDirectoryURL(clientConfig.publicDir),
				pathToDirectoryURL(clientConfig.build.outDir),
			);
		}
		host.timer.end('Client build');

		// Store extracted chunks on internals for post plugin to consume
		internals.extractedChunks = [...ssrChunks, ...prerenderChunks];
	}

	return {
		buildPlugins,
		postPlugins,
		buildApp,
		isRolldownInput,
		setRolldownInput(input) {
			currentRolldownInput = input;
		},
	};
}

/**
 * Finds and returns the prerender entry filename from the build output.
 * Throws an error if no prerender entry file is found.
 */
function getPrerenderEntryFileName(
	prerenderOutput:
		| vite.Rolldown.RolldownOutput
		| vite.Rolldown.RolldownOutput[]
		| vite.Rolldown.RolldownWatcher,
): string {
	const outputs = viteBuildReturnToRolldownOutputs(prerenderOutput);

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
		| vite.Rolldown.RolldownOutput
		| vite.Rolldown.RolldownOutput[]
		| vite.Rolldown.RolldownWatcher,
) {
	internals.prerenderEntryFileName = getPrerenderEntryFileName(prerenderOutput);
}

async function runManifestInjection(
	opts: StaticBuildOptions,
	internals: BuildInternals,
	chunks: ExtractedChunk[],
	buildPostHooks: BuildPostHook[],
) {
	const mutations = new Map<string, { code: string; prerender: boolean }>();

	const mutate = (fileName: string, newCode: string, prerender: boolean) => {
		mutations.set(fileName, { code: newCode, prerender });
	};

	await manifestBuildPostHook(opts, internals, { chunks, mutate });
	for (const hook of opts.host.chunkPostHooks) {
		await hook.run({ chunks, mutate }, internals);
	}

	for (const buildPostHook of buildPostHooks) {
		await buildPostHook({ chunks, mutate });
	}

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
	for (const [fileName, mutation] of mutations) {
		let root: URL;

		if (mutation.prerender) {
			// Write to prerender directory
			root = opts.outputDirectories.prerender;
		} else {
			root = opts.outputDirectories.server;
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
async function ssrMoveAssets(opts: StaticBuildOptions, internals: BuildInternals) {
	opts.logger.info('build', 'Rearranging server assets...');
	const isFullyStaticSite = opts.buildOutput === 'static';
	const serverRoot = opts.outputDirectories.server;
	const clientRoot = opts.outputDirectories.client;
	const prerenderOutputDir = opts.outputDirectories.prerender;

	// Move prerender assets
	const prerenderAssetsToMove = getSSRAssets(internals, ASTRO_VITE_ENVIRONMENT_NAMES.prerender);
	if (prerenderAssetsToMove.size > 0) {
		await Promise.all(
			Array.from(prerenderAssetsToMove).map(async function moveAsset(filename) {
				const currentUrl = new URL(filename, prerenderOutputDir);
				const clientUrl = new URL(filename, clientRoot);
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
				const currentUrl = new URL(filename, serverRoot);
				const clientUrl = new URL(filename, clientRoot);
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
	renderers: StaticBuildOptions['host']['renderers'],
): Set<string> {
	const rendererClientEntrypoints = renderers
		.map((r) => r.clientEntrypoint)
		.filter((a) => typeof a === 'string') as string[];

	const clientInput = new Set([
		...internals.discoveredHydratedComponents.keys(),
		...internals.discoveredClientOnlyComponents.keys(),
		...rendererClientEntrypoints,
		...internals.discoveredScripts,
	]);

	for (const specifier of internals.routerRegistry!.getPageScripts('build')) {
		clientInput.add(specifier);
	}

	return clientInput;
}

/**
 * Determines whether the SSR build environment needs to be built.
 * This is true when the build output is 'server', or when server islands
 * were discovered during the prerender build (even for static sites).
 */
function needsServerBuild(
	buildOutput: StaticBuildOptions['buildOutput'],
	builder: vite.ViteBuilder,
): boolean {
	if (buildOutput === 'server') {
		return true;
	}
	return hasServerIslands(builder.environments.prerender as vite.BuildEnvironment);
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
 * 2. We find the matching route pattern in the manifest (or fall back to the cleaned module id)
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
