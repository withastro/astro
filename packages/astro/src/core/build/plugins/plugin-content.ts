import { createHash } from 'node:crypto';
import fsMod from 'node:fs';
import { fileURLToPath } from 'node:url';
import pLimit from 'p-limit';
import { type Plugin as VitePlugin, normalizePath } from 'vite';
import { CONTENT_RENDER_FLAG, PROPAGATED_ASSET_FLAG } from '../../../content/consts.js';
import { type ContentLookupMap, hasContentFlag } from '../../../content/utils.js';
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

const CONTENT_CACHE_DIR = './content/';
const CONTENT_MANIFEST_FILE = './manifest.json';
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

function vitePluginContent(
	opts: StaticBuildOptions,
	lookupMap: ContentLookupMap,
	internals: BuildInternals
): VitePlugin {
	const { config } = opts.settings;
	const { cacheDir } = config;
	const distRoot = config.outDir;
	const distContentRoot = new URL('./content/', distRoot);
	const cachedChunks = new URL('./chunks/', opts.settings.config.cacheDir);
	const distChunks = new URL('./chunks/', opts.settings.config.outDir);
	const contentCacheDir = new URL(CONTENT_CACHE_DIR, cacheDir);
	const contentManifestFile = new URL(CONTENT_MANIFEST_FILE, contentCacheDir);
	const cache = contentCacheDir;
	const cacheTmp = new URL('./.tmp/', cache);
	let oldManifest = createContentManifest();
	let newManifest = createContentManifest();
	let entries: ContentEntries;
	let injectedEmptyFile = false;

	if (fsMod.existsSync(contentManifestFile)) {
		try {
			const data = fsMod.readFileSync(contentManifestFile, { encoding: 'utf8' });
			oldManifest = JSON.parse(data);
			internals.cachedClientEntries = oldManifest.clientEntries;
		} catch {}
	}

	return {
		name: '@astro/plugin-build-content',

		async options(options) {
			let newOptions = Object.assign({}, options);
			newManifest = await generateContentManifest(opts, lookupMap);
			entries = getEntriesFromManifests(oldManifest, newManifest);

			// Of the cached entries, these ones need to be rebuilt
			for (const { type, entry } of entries.buildFromSource) {
				const fileURL = encodeURI(joinPaths(opts.settings.config.root.toString(), entry));
				const input = fileURLToPath(fileURL);
				// Adds `/src/content/blog/post-1.md?astroContentCollectionEntry` as a top-level input
				const inputs = [`${input}?${collectionTypeToFlag(type)}`];
				if (type === 'content') {
					// Content entries also need to include the version with the RENDER flag
					inputs.push(`${input}?${CONTENT_RENDER_FLAG}`);
				}
				newOptions = addRollupInput(newOptions, inputs);
			}
			// Restores cached chunks from the previous build
			if (fsMod.existsSync(cachedChunks)) {
				await copyFiles(cachedChunks, distChunks, true);
			}
			// If nothing needs to be rebuilt, we inject a fake entrypoint to appease Rollup
			if (entries.buildFromSource.length === 0) {
				newOptions = addRollupInput(newOptions, [virtualEmptyModuleId]);
				injectedEmptyFile = true;
			}
			return newOptions;
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
				fs: fsMod,
				lookupMap,
				IS_DEV: false,
				IS_SERVER: false,
				isClient: false,
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
				...oldManifest.clientEntries,
				...internals.discoveredHydratedComponents.keys(),
				...internals.discoveredClientOnlyComponents.keys(),
				...internals.discoveredScripts,
			]);
			// Likewise, these are server modules that might not be referenced
			// once the cached items are excluded from the build process
			const serverComponents = new Set([
				...oldManifest.serverEntries,
				...internals.discoveredHydratedComponents.keys(),
			]);
			newManifest.serverEntries = Array.from(serverComponents);
			newManifest.clientEntries = Array.from(clientComponents);
			await fsMod.promises.mkdir(contentCacheDir, { recursive: true });
			await fsMod.promises.writeFile(contentManifestFile, JSON.stringify(newManifest), {
				encoding: 'utf8',
			});

			const cacheExists = fsMod.existsSync(cache);
			fsMod.mkdirSync(cache, { recursive: true });
			await fsMod.promises.mkdir(cacheTmp, { recursive: true });
			await copyFiles(distContentRoot, cacheTmp, true);
			if (cacheExists) {
				await copyFiles(contentCacheDir, distContentRoot, false);
			}
			await copyFiles(cacheTmp, contentCacheDir);
			await fsMod.promises.rm(cacheTmp, { recursive: true, force: true });
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

	for (const [collection, { type, entries }] of Object.entries(lookupMap)) {
		for (const entry of Object.values(entries)) {
			const key: ContentManifestKey = { collection, type, entry };
			const fileURL = new URL(encodeURI(joinPaths(opts.settings.config.root.toString(), entry)));
			promises.push(
				limit(async () => {
					const data = await fsMod.promises.readFile(fileURL, { encoding: 'utf8' });
					manifest.entries.push([key, checksum(data)]);
				})
			);
		}
	}

	await Promise.all(promises);
	return manifest;
}

function checksum(data: string): string {
	return createHash('sha1').update(data).digest('base64');
}

function collectionTypeToFlag(type: 'content' | 'data') {
	const name = type[0].toUpperCase() + type.slice(1);
	return `astro${name}CollectionEntry`;
}

export function pluginContent(
	opts: StaticBuildOptions,
	internals: BuildInternals
): AstroBuildPlugin {
	const cachedChunks = new URL('./chunks/', opts.settings.config.cacheDir);
	const distChunks = new URL('./chunks/', opts.settings.config.outDir);

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

				const lookupMap = await generateLookupMap({ settings: opts.settings, fs: fsMod });
				return {
					vitePlugin: vitePluginContent(opts, lookupMap, internals),
				};
			},

			async 'build:post'() {
				if (!opts.settings.config.experimental.contentCollectionCache) {
					return;
				}
				if (isServerLikeOutput(opts.settings.config)) {
					return;
				}
				if (fsMod.existsSync(distChunks)) {
					await copyFiles(distChunks, cachedChunks, true);
				}
			},
		},
	};
}
