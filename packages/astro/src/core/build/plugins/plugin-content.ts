import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import pLimit from 'p-limit';
import { normalizePath, type Plugin as VitePlugin } from 'vite';
import { CONTENT_RENDER_FLAG, PROPAGATED_ASSET_FLAG } from '../../../content/consts.js';
import { hasContentFlag, type ContentLookupMap } from '../../../content/utils.js';
import {
	generateContentEntryFile,
	generateLookupMap,
} from '../../../content/vite-plugin-content-virtual-mod.js';
import { isServerLikeOutput } from '../../../prerender/utils.js';
import { joinPaths, removeFileExtension, removeLeadingForwardSlash } from '../../path.js';
import { addRollupInput } from '../add-rollup-input.js';
import { type BuildInternals } from '../internal.js';
import type { AstroBuildPlugin } from '../plugin.js';
import { copyFiles } from '../static-build.js';
import type { StaticBuildOptions } from '../types.js';
import { encodeName } from '../util.js';
import { extendManualChunks } from './util.js';
import { isTrackableModule, checksum, ModuleGraph, ModuleNode, resolvePackageVersion } from './cache/module-graph.js';
import { createRequire } from 'node:module';

function getEntrypointsFromModuleNode(input: ModuleNode): ModuleNode[] {
	const result = new Set<ModuleNode>(input.isEntry ? [input] : []);
	for (const importer of input.importers.values()) {
		if (result.has(importer)) break;
		for (const node of getEntrypointsFromModuleNode(importer)) {
			result.add(node);
		}
	}
	return Array.from(result);
}

const BUILD_CACHE_DIR = './build/';
const BUILD_MANIFEST_FILE = './astro.manifest.json';
// IMPORTANT: Update this version when making significant changes to the manifest format.
// Only manifests generated with the same version number can be compared.
const CONTENT_MANIFEST_VERSION = 0;

interface ContentManifestKey {
	collection: string;
	type: 'content' | 'data';
	entry: string;
}
interface ContentManifest {
	version: number;
	entries: [ContentManifestKey, string][];
	// Tracks components that should be included in the server build
	// When the cache is restored, these might no longer be referenced
	serverEntries: string[];
	// Tracks components that should be passed to the client build
	// When the cache is restored, these might no longer be referenced
	clientEntries: string[];
}

const virtualEmptyModuleId = `virtual:empty-content`;
const resolvedVirtualEmptyModuleId = `\0${virtualEmptyModuleId}`;

function createContentManifest(): ContentManifest {
	return { version: -1, entries: [], serverEntries: [], clientEntries: [] };
}

function vitePluginModuleGraph(opts: StaticBuildOptions, lookupMap: ContentLookupMap): VitePlugin {
	const graph = new ModuleGraph(opts.settings.config.root);
	const rootPath = fileURLToPath(opts.settings.config.root);
	const require = createRequire(opts.settings.config.root);
	const packageResolutions = new Map<string, string>();

	const { config } = opts.settings;
	const { cacheDir } = config;
	const buildCacheDir = new URL(BUILD_CACHE_DIR, cacheDir);
	const buildManifestFile = new URL(BUILD_MANIFEST_FILE, buildCacheDir);

	function resolveId(id: string): string {
		// Intentionally using `||` instead of `??` here to catch empty strings
		return packageResolutions.get(id) || graph.normalizeId(id);
	}

	const content = graph.get('astro:content');
	for (const { entries } of Object.values(lookupMap)) {
		for (const entrypoint of Object.values(entries)) {
			const node = graph.get(entrypoint);
			graph.checksums.set(graph.normalizeId(entrypoint), checksum(new URL(`./${entrypoint}`, opts.settings.config.root)));
			graph.addEntrypoint(entrypoint);
			node.addImporter('astro:content');
			content.addImport(entrypoint)
		}
	}

	let oldModuleGraph: ModuleGraph | undefined;

	const plugin: VitePlugin = {
		name: 'astro:module-graph',
		enforce: 'post',
		options(options) {
			if (Array.isArray(options.plugins)) {
				const index = options.plugins.findIndex(v => typeof v === 'object' && !Array.isArray(v) && v && v.name === 'astro:module-graph');
				options.plugins.splice(index, 1);
				options.plugins.splice(0, 0, plugin);
			}

			if (fs.existsSync(buildManifestFile)) {
				const oldManifest = fs.readFileSync(buildManifestFile, { encoding: 'utf8' })
				oldModuleGraph = new ModuleGraph(opts.settings.config.root);
				oldModuleGraph.rehydrate(JSON.parse(oldManifest));
				if (oldModuleGraph.version !== ModuleGraph.currentVersion) {
					fs.rmSync(buildManifestFile);
					return;
				}
				let invalidatedNodes = new Set<ModuleNode>();
				for (let [id, oldChecksum] of oldModuleGraph.checksums) {
					if (id.startsWith('dep:')) {
						id = id.replace(/^dep\:/, '');
						const newChecksum = resolvePackageVersion(id, require);
						if (newChecksum === oldChecksum) continue;
					} else {
						const fileURL = new URL('./' + id, opts.settings.config.root);
						const newChecksum = checksum(fileURL);
						if (newChecksum === oldChecksum) continue;
					}
					invalidatedNodes.add(oldModuleGraph.get(id));
				}
				
				const invalidatedEntrypoints = new Set<ModuleNode>();
				console.log('      node', Array.from(invalidatedNodes).map(n => n.id));
				for (const invalidatedNode of invalidatedNodes) {
					for (const entrypoint of getEntrypointsFromModuleNode(invalidatedNode)) {
						invalidatedEntrypoints.add(entrypoint);
					}
				}
				console.log('entrypoint', Array.from(invalidatedEntrypoints).map(n => n.id));
			}
		},
		async resolveId(id, importer) {
			const resolution = await this.resolve(id, importer, { skipSelf: true });
			if (resolution?.id) {
				const resolvedId = resolution.id;
				if (!isTrackableModule(resolvedId)) return;
				if (graph.checksums.has(resolvedId) || graph.checksums.has(`dep:${resolvedId}`)) return;
				if (resolvedId.startsWith(rootPath) && !resolvedId.includes('node_modules')) {
					graph.checksums.set(graph.normalizeId(resolvedId), checksum(graph.normalizeId(resolvedId)));
					return;
				}
				if (packageResolutions.has(resolvedId)) return;
				let packageSpecifier = id;
				if (id.startsWith('.')) {
					if (importer && packageResolutions.has(importer)) {
						packageResolutions.set(resolvedId, packageResolutions.get(importer)!);
					}
					return;
				}
				if (id.startsWith('@')) {
					packageSpecifier = id.split('/').slice(0, 2).join('/');
				} else {
					packageSpecifier = id.split('/').at(0)!;
				}
				packageResolutions.set(resolvedId, packageSpecifier);
				if (graph.checksums.has(`dep:${packageSpecifier}`)) {
					return;
				}
				try {
					// External packages will not be resolved
					// We try to resolve their package.json version
					const pkgInfo = require(`${packageSpecifier}/package.json`);
					if (pkgInfo.version) {
						graph.checksums.set(`dep:${packageSpecifier}`, pkgInfo.version);
					}
				} catch {}
			}
		},
		async buildEnd() {
			for (let moduleId of this.getModuleIds()) {
				let isPackage = false;
				const info = this.getModuleInfo(moduleId);
				if (!info) continue;
				if (!isTrackableModule(info.id)) continue;
				const id = graph.normalizeId(resolveId(moduleId))
				if (packageResolutions.has(id)) {
					isPackage = true;
				}
				const node = graph.get(id);
				const isEntry = info.dynamicImporters.find(n => n.startsWith('\0@astro-page:'));
				if (isEntry) {
					graph.addEntrypoint(id);
				}
				for (const importer of info.importers) {
					if (!isTrackableModule(importer)) continue;
					node.addImporter(resolveId(importer));
				}
				for (const importer of info.dynamicImporters) {
					if (!isTrackableModule(importer)) continue;
					node.addImporter(resolveId(importer));
				}
				if (isPackage) continue;
				for (const imported of info.importedIds) {
					if (!isTrackableModule(imported)) continue;
					node.addImport(resolveId(imported));
				}
				for (const imported of info.dynamicallyImportedIds) {
					if (!isTrackableModule(imported)) continue;
					node.addImport(resolveId(imported));
				}
			}

			await fs.promises.mkdir(new URL('./', buildManifestFile), { recursive: true });
			await fs.promises.writeFile(buildManifestFile, JSON.stringify(graph), {
				encoding: 'utf8',
			});
		}
	}
	return plugin;
}

function vitePluginContent(
	opts: StaticBuildOptions,
	lookupMap: ContentLookupMap,
	internals: BuildInternals
): VitePlugin {
	const { config } = opts.settings;
	const { cacheDir } = config;
	const distRoot = config.outDir;
	const buildCacheDir = new URL(BUILD_CACHE_DIR, cacheDir);
	// const contentManifestFile = new URL(BUILD_MANIFEST_FILE, buildCacheDir);
	// let oldManifest = createContentManifest();
	let newManifest = createContentManifest();
	// let entries: ContentEntries;
	let injectedEmptyFile = false;

	// if (fsMod.existsSync(contentManifestFile)) {
	// 	try {
	// 		const data = fsMod.readFileSync(contentManifestFile, { encoding: 'utf8' });
	// 		oldManifest = JSON.parse(data);
	// 		internals.cachedClientEntries = oldManifest.clientEntries;
	// 	} catch {}
	// }

	return {
		name: '@astro/plugin-build-content',

		async options(options) {
			let newOptions = Object.assign({}, options);
			// newManifest = await generateContentManifest(opts, lookupMap);
			// entries = getEntriesFromManifests(oldManifest, newManifest);
			const inputs: string[] = [];
			
			// 	newOptions = addRollupInput(newOptions, inputs);
			for (const { type, entries: collectionEntries } of Object.values(lookupMap)) {
				for (const entrypoint of Object.values(collectionEntries)) {
					const fileURL = encodeURI(joinPaths(opts.settings.config.root.toString(), entrypoint));
					const input = fileURLToPath(fileURL);
					inputs.push(`${input}?${collectionTypeToFlag(type)}`);
					if (type === 'content') {
						// Content entries also need to include the version with the RENDER flag
						inputs.push(`${input}?${CONTENT_RENDER_FLAG}`);
					}
				}
			}
			newOptions = addRollupInput(newOptions, inputs);
			return newOptions;

			// // Of the cached entries, these ones need to be rebuilt
			// for (const { type, entry } of entries.buildFromSource) {
			// 	const fileURL = encodeURI(joinPaths(opts.settings.config.root.toString(), entry));
			// 	const input = fileURLToPath(fileURL);
			// 	// Adds `/src/content/blog/post-1.md?astroContentCollectionEntry` as a top-level input
			// 	const inputs = [`${input}?${collectionTypeToFlag(type)}`];
			// 	if (type === 'content') {
			// 		// Content entries also need to include the version with the RENDER flag
			// 		inputs.push(`${input}?${CONTENT_RENDER_FLAG}`);
			// 	}
			// 	newOptions = addRollupInput(newOptions, inputs);
			// }
			// // Restores cached chunks from the previous build
			// if (fsMod.existsSync(buildCacheDir)) {
			// 	await copyFiles(buildCacheDir, distRoot, true);
			// }
			// // If nothing needs to be rebuilt, we inject a fake entrypoint to appease Rollup
			// if (entries.buildFromSource.length === 0) {
			// 	newOptions = addRollupInput(newOptions, [virtualEmptyModuleId]);
			// 	injectedEmptyFile = true;
			// }
			// return newOptions;
		},

		outputOptions(outputOptions) {
			const rootPath = normalizePath(fileURLToPath(opts.settings.config.root));
			const srcPath = normalizePath(fileURLToPath(opts.settings.config.srcDir));
			extendManualChunks(outputOptions, {
				before(id, meta) {
					if (id.startsWith(srcPath) && id.slice(srcPath.length).startsWith('content')) {
						const info = meta.getModuleInfo(id);
						if (
							info?.dynamicImporters.length === 1 &&
							hasContentFlag(info.dynamicImporters[0], PROPAGATED_ASSET_FLAG)
						) {
							const [srcRelativePath] = id.replace(rootPath, '/').split('?');
							const resultId = encodeName(
								`${removeLeadingForwardSlash(removeFileExtension(srcRelativePath))}.render.mjs`
							);
							return resultId;
						}
						const [srcRelativePath, flag] = id.replace(rootPath, '/').split('?');
						const collectionEntry = findEntryFromSrcRelativePath(lookupMap, srcRelativePath);
						if (collectionEntry) {
							let suffix = '.mjs';
							if (flag === PROPAGATED_ASSET_FLAG) {
								suffix = '.entry.mjs';
							}
							id =
								removeLeadingForwardSlash(
									removeFileExtension(encodeName(id.replace(srcPath, '/')))
								) + suffix;
							return id;
						}
					}
				},
			});
		},

		resolveId(id) {
			if (id === virtualEmptyModuleId) {
				return resolvedVirtualEmptyModuleId;
			}
		},

		async load(id) {
			if (id === resolvedVirtualEmptyModuleId) {
				return {
					code: `// intentionally left empty!\nexport default {}`,
				};
			}
		},

		async generateBundle(_options, bundle) {
			const code = await generateContentEntryFile({
				settings: opts.settings,
				fs: fs,
				lookupMap,
				IS_DEV: false,
				IS_SERVER: false,
			});
			this.emitFile({
				type: 'prebuilt-chunk',
				code,
				fileName: 'content/entry.mjs',
			});
			if (!injectedEmptyFile) return;
			Object.keys(bundle).forEach((key) => {
				const mod = bundle[key];
				if (mod.type === 'asset') return;
				if (mod.facadeModuleId === resolvedVirtualEmptyModuleId) {
					delete bundle[key];
				}
			});
		},

		async writeBundle() {
			// These are stored in the manifest to ensure that they are included in the build
			// in case they aren't referenced _outside_ of the cached content.
			// We can use this info in the manifest to run a proper client build again.
			const clientComponents = new Set([
				...internals.discoveredHydratedComponents.keys(),
				...internals.discoveredClientOnlyComponents.keys(),
				...internals.discoveredScripts,
			]);
			// Likewise, these are server modules that might not be referenced
			// once the cached items are excluded from the build process
			const serverComponents = new Set([
				...internals.discoveredHydratedComponents.keys(),
			]);
			newManifest.serverEntries = Array.from(serverComponents);
			newManifest.clientEntries = Array.from(clientComponents);
			// await fsMod.promises.mkdir(new URL('./', contentManifestFile), { recursive: true });
			// await fsMod.promises.writeFile(contentManifestFile, JSON.stringify(newManifest), {
			// 	encoding: 'utf8',
			// });
			await copyFiles(distRoot, buildCacheDir);
		},
	};
}

const entryCache = new Map<string, string>();
function findEntryFromSrcRelativePath(lookupMap: ContentLookupMap, srcRelativePath: string) {
	let value = entryCache.get(srcRelativePath);
	if (value) return value;
	for (const collection of Object.values(lookupMap)) {
		for (const entry of Object.values(collection)) {
			for (const entryFile of Object.values(entry)) {
				if (entryFile === srcRelativePath) {
					value = entryFile;
					entryCache.set(srcRelativePath, entryFile);
					return value;
				}
			}
		}
	}
}

interface ContentEntries {
	restoreFromCache: ContentManifestKey[];
	buildFromSource: ContentManifestKey[];
}
function getEntriesFromManifests(
	oldManifest: ContentManifest,
	newManifest: ContentManifest
): ContentEntries {
	const { version: oldVersion, entries: oldEntries } = oldManifest;
	const { version: newVersion, entries: newEntries } = newManifest;
	let entries: ContentEntries = { restoreFromCache: [], buildFromSource: [] };

	const newEntryMap = new Map<ContentManifestKey, string>(newEntries);
	if (oldVersion !== newVersion || oldEntries.length === 0) {
		entries.buildFromSource = Array.from(newEntryMap.keys());
		return entries;
	}
	const oldEntryHashMap = new Map<string, ContentManifestKey>(
		oldEntries.map(([key, hash]) => [hash, key])
	);

	for (const [entry, hash] of newEntryMap) {
		if (oldEntryHashMap.has(hash)) {
			entries.restoreFromCache.push(entry);
		} else {
			entries.buildFromSource.push(entry);
		}
	}
	return entries;
}

async function generateContentManifest(
	opts: StaticBuildOptions,
	lookupMap: ContentLookupMap
): Promise<ContentManifest> {
	let manifest: ContentManifest = {
		version: CONTENT_MANIFEST_VERSION,
		entries: [],
		serverEntries: [],
		clientEntries: [],
	};
	const limit = pLimit(10);
	const promises: Promise<void>[] = [];

	// for (const [collection, { type, entries }] of Object.entries(lookupMap)) {
	// 	for (const entry of Object.values(entries)) {
	// 		const key: ContentManifestKey = { collection, type, entry };
	// 		const fileURL = new URL(encodeURI(joinPaths(opts.settings.config.root.toString(), entry)));
	// 		promises.push(
	// 			limit(async () => {
	// 				const data = await fsMod.promises.readFile(fileURL, { encoding: 'utf8' });
	// 				// manifest.entries.push([key, checksum(data)]);
	// 			})
	// 		);
	// 	}
	// }

	await Promise.all(promises);
	return manifest;
}

function collectionTypeToFlag(type: 'content' | 'data') {
	const name = type[0].toUpperCase() + type.slice(1);
	return `astro${name}CollectionEntry`;
}

export function pluginContent(
	opts: StaticBuildOptions,
	internals: BuildInternals
): AstroBuildPlugin {
	const buildCacheDir = new URL(BUILD_CACHE_DIR, opts.settings.config.cacheDir);
	const outDir = opts.settings.config.outDir;

	return {
		targets: ['server'],
		hooks: {
			async 'build:before'() {
				if (!opts.settings.config.experimental.contentCollectionCache) {
					return { vitePlugin: undefined };
				}
				if (isServerLikeOutput(opts.settings.config)) {
					return { vitePlugin: undefined };
				}
				if (fs.existsSync(buildCacheDir)) {
					await copyFiles(buildCacheDir, outDir, true);
				}

				const lookupMap = await generateLookupMap({ settings: opts.settings, fs: fs });
				return {
					vitePlugin: [vitePluginModuleGraph(opts, lookupMap), vitePluginContent(opts, lookupMap, internals)],
				};
			}
		},
	};
}
