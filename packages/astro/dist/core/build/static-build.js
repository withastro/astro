import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import colors from 'piccolore';
import * as vite from 'vite';
import { LINKS_PLACEHOLDER } from '../../content/consts.js';
import { contentAssetsBuildPostHook } from '../../content/vite-plugin-content-assets.js';
import { createBuildInternals } from '../../core/build/internal.js';
import { emptyDir, removeEmptyDirs } from '../../core/fs/index.js';
import { appendForwardSlash, prependForwardSlash } from '../../core/path.js';
import { runHookBuildSetup } from '../../integrations/hooks.js';
import { SERIALIZED_MANIFEST_RESOLVED_ID } from '../../manifest/serialized.js';
import { getPrerenderOutputDirectory } from '../../prerender/utils.js';
import { PAGE_SCRIPT_ID } from '../../vite-plugin-scripts/index.js';
import { routeIsRedirect } from '../routing/helpers.js';
import { getOutDirWithinCwd } from './common.js';
import { generatePages } from './generate.js';
import { trackPageData } from './internal.js';
import { getAllBuildPlugins } from './plugins/index.js';
import { manifestBuildPostHook } from './plugins/plugin-manifest.js';
import { ASTRO_PAGE_EXTENSION_POST_PATTERN } from './plugins/util.js';
import { getTimeStat, viteBuildReturnToRollupOutputs } from './util.js';
import { NOOP_MODULE_ID } from './plugins/plugin-noop.js';
import { ASTRO_VITE_ENVIRONMENT_NAMES } from '../constants.js';
import { getSSRAssets } from './internal.js';
import { SERVER_ISLAND_MAP_MARKER } from '../server-islands/vite-plugin-server-islands.js';
import { createViteBuildConfig } from './vite-build-config.js';
const PRERENDER_ENTRY_FILENAME_PREFIX = 'prerender-entry';
function extractRelevantChunks(outputs, prerender) {
	const extracted = [];
	for (const output of outputs) {
		for (const chunk of output.output) {
			if (chunk.type === 'asset') continue;
			const needsContentInjection = chunk.code.includes(LINKS_PLACEHOLDER);
			const needsManifestInjection = chunk.moduleIds.includes(SERIALIZED_MANIFEST_RESOLVED_ID);
			const needsServerIslandInjection = chunk.code.includes(SERVER_ISLAND_MAP_MARKER);
			if (needsContentInjection || needsManifestInjection || needsServerIslandInjection) {
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
async function viteBuild(opts) {
	const { allPages, settings } = opts;
	const pageInput = /* @__PURE__ */ new Set();
	const internals = createBuildInternals();
	for (const pageData of Object.values(allPages)) {
		const astroModuleURL = new URL('./' + pageData.component, settings.config.root);
		const astroModuleId = prependForwardSlash(pageData.component);
		trackPageData(internals, pageData.component, pageData, astroModuleId, astroModuleURL);
		if (!routeIsRedirect(pageData.route)) {
			pageInput.add(astroModuleId);
		}
	}
	if (settings.config?.vite?.build?.emptyOutDir !== false) {
		emptyDir(settings.config.outDir, new Set('.git'));
	}
	const ssrTime = performance.now();
	opts.logger.info('build', `Building ${settings.buildOutput} entrypoints...`);
	await buildEnvironments(opts, internals);
	opts.logger.info(
		'build',
		colors.green(`\u2713 Completed in ${getTimeStat(ssrTime, performance.now())}.`),
	);
	return { internals };
}
async function buildEnvironments(opts, internals) {
	const { allPages, settings, viteConfig } = opts;
	const routes = Object.values(allPages).flatMap((pageData) => pageData.route);
	const buildPlugins = getAllBuildPlugins(internals, opts);
	const flatPlugins = buildPlugins.flat().filter(Boolean);
	const plugins = [...flatPlugins, ...(viteConfig.plugins || [])];
	let currentRollupInput = void 0;
	let buildPostHooks = [];
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
	plugins.push({
		name: 'astro:build-generate',
		enforce: 'post',
		buildApp: {
			order: 'post',
			async handler() {
				await runManifestInjection(
					opts,
					internals,
					internals.extractedChunks ?? [],
					buildPostHooks,
				);
				const prerenderOutputDir = getPrerenderOutputDirectory(settings);
				if (settings.buildOutput === 'static') {
					settings.timer.start('Static generate');
					await ssrMoveAssets(opts, internals, prerenderOutputDir);
					await generatePages(opts, internals, prerenderOutputDir);
					await fs.promises.rm(prerenderOutputDir, { recursive: true, force: true });
					settings.timer.end('Static generate');
				} else if (settings.buildOutput === 'server') {
					settings.timer.start('Server generate');
					await generatePages(opts, internals, prerenderOutputDir);
					await ssrMoveAssets(opts, internals, prerenderOutputDir);
					await fs.promises.rm(prerenderOutputDir, { recursive: true, force: true });
					settings.timer.end('Server generate');
				}
			},
		},
	});
	function isRollupInput(moduleName) {
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
	const viteBuildConfig = createViteBuildConfig({
		settings,
		viteConfig,
		routes,
		plugins,
		// Top-level buildApp for framework build orchestration
		// This takes precedence over platform plugin fallbacks (e.g., Cloudflare)
		builder: {
			async buildApp(builder2) {
				settings.timer.start('Prerender build');
				let prerenderOutput = await builder2.build(builder2.environments.prerender);
				settings.timer.end('Prerender build');
				extractPrerenderEntryFileName(internals, prerenderOutput);
				const prerenderOutputs = viteBuildReturnToRollupOutputs(prerenderOutput);
				const prerenderChunks = extractRelevantChunks(prerenderOutputs, true);
				prerenderOutput = void 0;
				let ssrChunks = [];
				if (settings.buildOutput !== 'static') {
					settings.timer.start('SSR build');
					let ssrOutput = await builder2.build(
						builder2.environments[ASTRO_VITE_ENVIRONMENT_NAMES.ssr],
					);
					settings.timer.end('SSR build');
					const ssrOutputs = viteBuildReturnToRollupOutputs(ssrOutput);
					ssrChunks = extractRelevantChunks(ssrOutputs, false);
					ssrOutput = void 0;
				}
				const ssrPlugins =
					builder2.environments[ASTRO_VITE_ENVIRONMENT_NAMES.ssr]?.config.plugins ?? [];
				buildPostHooks = ssrPlugins
					.map((plugin) =>
						typeof plugin.api?.buildPostHook === 'function' ? plugin.api.buildPostHook : void 0,
					)
					.filter(Boolean);
				internals.clientInput = getClientInput(internals, settings);
				if (!internals.clientInput.size) {
					internals.clientInput.add(NOOP_MODULE_ID);
				}
				const sortedClientInput = Array.from(internals.clientInput).sort();
				builder2.environments.client.config.build.rollupOptions.input = sortedClientInput;
				settings.timer.start('Client build');
				await builder2.build(builder2.environments.client);
				settings.timer.end('Client build');
				internals.extractedChunks = [...ssrChunks, ...prerenderChunks];
			},
		},
		isRollupInput,
	});
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
function getPrerenderEntryFileName(prerenderOutput) {
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
function extractPrerenderEntryFileName(internals, prerenderOutput) {
	internals.prerenderEntryFileName = getPrerenderEntryFileName(prerenderOutput);
}
async function runManifestInjection(opts, internals, chunks, buildPostHooks) {
	const mutations = /* @__PURE__ */ new Map();
	const mutate = (fileName, newCode, prerender) => {
		mutations.set(fileName, { code: newCode, prerender });
	};
	await manifestBuildPostHook(opts, internals, { chunks, mutate });
	await contentAssetsBuildPostHook(
		opts.settings.config.base,
		opts.settings.config.build.assetsPrefix,
		internals,
		{ chunks, mutate },
	);
	for (const buildPostHook of buildPostHooks) {
		await buildPostHook({ chunks, mutate });
	}
	await writeMutatedChunks(opts, mutations);
}
async function writeMutatedChunks(opts, mutations) {
	const { settings } = opts;
	const config = settings.config;
	for (const [fileName, mutation] of mutations) {
		let root;
		if (mutation.prerender) {
			root = getPrerenderOutputDirectory(settings);
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
async function ssrMoveAssets(opts, internals, prerenderOutputDir) {
	opts.logger.info('build', 'Rearranging server assets...');
	const isFullyStaticSite = opts.settings.buildOutput === 'static';
	const preserveStructure = opts.settings.adapter?.adapterFeatures?.preserveBuildClientDir;
	const serverRoot = opts.settings.config.build.server;
	const clientRoot =
		isFullyStaticSite && !preserveStructure
			? opts.settings.config.outDir
			: opts.settings.config.build.client;
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
	if (isFullyStaticSite) {
		return;
	}
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
function getClientInput(internals, settings) {
	const rendererClientEntrypoints = settings.renderers
		.map((r) => r.clientEntrypoint)
		.filter((a) => typeof a === 'string');
	const clientInput = /* @__PURE__ */ new Set([
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
function makeAstroPageEntryPointFileName(prefix, facadeModuleId, routes) {
	const pageModuleId = facadeModuleId
		.replace(prefix, '')
		.replace(ASTRO_PAGE_EXTENSION_POST_PATTERN, '.');
	const route = routes.find((routeData) => routeData.component === pageModuleId);
	const name = route?.route ?? pageModuleId;
	return `pages${name.replace(/\/$/, '/index').replaceAll(/[[\]]/g, '_').replaceAll('...', '---')}.astro.mjs`;
}
export { makeAstroPageEntryPointFileName, viteBuild };
