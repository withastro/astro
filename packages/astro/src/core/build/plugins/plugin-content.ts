import { createHash } from 'node:crypto';
import fsMod from 'node:fs';
import { fileURLToPath } from 'node:url';
import glob from 'fast-glob';
import pLimit from 'p-limit';
import { type Plugin as VitePlugin, normalizePath } from 'vite';
import type { AstroConfig } from '../../../@types/astro.js';
import { CONTENT_RENDER_FLAG, PROPAGATED_ASSET_FLAG } from '../../../content/consts.js';
import { type ContentLookupMap, hasContentFlag } from '../../../content/utils.js';
import {
	generateContentEntryFile,
	generateLookupMap,
} from '../../../content/vite-plugin-content-virtual-mod.js';
import { configPaths } from '../../config/index.js';
import { emptyDir } from '../../fs/index.js';
import {
	appendForwardSlash,
	joinPaths,
	removeFileExtension,
	removeLeadingForwardSlash,
} from '../../path.js';
import { isContentCollectionsCacheEnabled } from '../../util.js';
import { addRollupInput } from '../add-rollup-input.js';
import { CHUNKS_PATH, CONTENT_PATH } from '../consts.js';
import type { BuildInternals } from '../internal.js';
import type { AstroBuildPlugin } from '../plugin.js';
import { copyFiles } from '../static-build.js';
import type { StaticBuildOptions } from '../types.js';
import { encodeName } from '../util.js';
import { extendManualChunks } from './util.js';

const CONTENT_CACHE_DIR = './' + CONTENT_PATH;
const CONTENT_MANIFEST_FILE = './manifest.json';
// IMPORTANT: Update this version when making significant changes to the manifest format.
// Only manifests generated with the same version number can be compared.
const CONTENT_MANIFEST_VERSION = 1;

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
	// Hash of the lockfiles, pnpm-lock.yaml, package-lock.json, etc.
	// Kept so that installing new packages results in a full rebuild.
	lockfiles: string;
	// Hash of the Astro config. Changing options results in invalidating the cache.
	configs: string;
}

const virtualEmptyModuleId = `virtual:empty-content`;
const resolvedVirtualEmptyModuleId = `\0${virtualEmptyModuleId}`;
const NO_MANIFEST_VERSION = -1 as const;

function createContentManifest(): ContentManifest {
	return {
		version: NO_MANIFEST_VERSION,
		entries: [],
		serverEntries: [],
		clientEntries: [],
		lockfiles: '',
		configs: '',
	};
}

const getContentRoot = (config: AstroConfig) => new URL('./content/', config.outDir);
const getContentCacheDir = (config: AstroConfig) => new URL(CONTENT_CACHE_DIR, config.cacheDir);
const getCacheTmp = (contentCacheDir: URL) => new URL('./.tmp/', contentCacheDir);

function vitePluginContent(
	opts: StaticBuildOptions,
	lookupMap: ContentLookupMap,
	internals: BuildInternals,
	cachedBuildOutput: Array<{ cached: URL; dist: URL }>,
): VitePlugin {
	const { config } = opts.settings;
	const distContentRoot = getContentRoot(config);
	const contentCacheDir = getContentCacheDir(config);
	const contentManifestFile = new URL(CONTENT_MANIFEST_FILE, contentCacheDir);
	let oldManifest = createContentManifest();
	let newManifest = createContentManifest();
	let entries: ContentEntries;
	let injectedEmptyFile = false;
	let currentManifestState: ReturnType<typeof manifestState> = 'valid';

	if (fsMod.existsSync(contentManifestFile)) {
		try {
			const data = fsMod.readFileSync(contentManifestFile, { encoding: 'utf8' });
			oldManifest = JSON.parse(data);
		} catch {}
	}

	return {
		name: '@astro/plugin-build-content',

		async options(options) {
			let newOptions = Object.assign({}, options);
			newManifest = await generateContentManifest(opts, lookupMap);
			entries = getEntriesFromManifests(oldManifest, newManifest);

			// If the manifest is valid, use the cached client entries as nothing has changed
			currentManifestState = manifestState(oldManifest, newManifest);
			if (currentManifestState === 'valid') {
				internals.cachedClientEntries = oldManifest.clientEntries;
			} else {
				let logReason = '';
				switch (currentManifestState) {
					case 'config-mismatch':
						logReason = 'Astro config has changed';
						break;
					case 'lockfile-mismatch':
						logReason = 'Lockfiles have changed';
						break;
					case 'no-entries':
						logReason = 'No content collections entries cached';
						break;
					case 'version-mismatch':
						logReason = 'The cache manifest version has changed';
						break;
					case 'no-manifest':
						logReason = 'No content manifest was found in the cache';
						break;
				}
				opts.logger.info('build', `Cache invalid, rebuilding from source. Reason: ${logReason}.`);
			}

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

			// Restores cached chunks and assets from the previous build
			// If the manifest state is not valid then it needs to rebuild everything
			// so don't do that in this case.
			if (currentManifestState === 'valid') {
				for (const { cached, dist } of cachedBuildOutput) {
					if (fsMod.existsSync(cached)) {
						await copyFiles(cached, dist, true);
					}
				}
				// Copy over the content cache now so that new files override it
				const cacheExists = fsMod.existsSync(contentCacheDir);
				if (cacheExists) {
					await copyFiles(contentCacheDir, distContentRoot, false);
				}
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
			const entryCache = new Map<string, string>();
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
								`${removeLeadingForwardSlash(removeFileExtension(srcRelativePath))}.render.mjs`,
							);
							return resultId;
						}
						const [srcRelativePath, flag] = id.replace(rootPath, '/').split('?');
						const collectionEntry = findEntryFromSrcRelativePath(
							lookupMap,
							srcRelativePath,
							entryCache,
						);
						if (collectionEntry) {
							let suffix = '.mjs';
							if (flag === PROPAGATED_ASSET_FLAG) {
								suffix = '.entry.mjs';
							}
							id =
								removeLeadingForwardSlash(
									removeFileExtension(encodeName(id.replace(srcPath, '/'))),
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

			const cacheExists = fsMod.existsSync(contentCacheDir);
			// If the manifest is invalid, empty the cache so that we can create a new one.
			if (cacheExists && currentManifestState !== 'valid') {
				emptyDir(contentCacheDir);
			}

			await fsMod.promises.mkdir(contentCacheDir, { recursive: true });
			await fsMod.promises.writeFile(contentManifestFile, JSON.stringify(newManifest), {
				encoding: 'utf8',
			});
		},
	};
}

function findEntryFromSrcRelativePath(
	lookupMap: ContentLookupMap,
	srcRelativePath: string,
	entryCache: Map<string, string>,
) {
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
	newManifest: ContentManifest,
): ContentEntries {
	const { entries: oldEntries } = oldManifest;
	const { entries: newEntries } = newManifest;
	let entries: ContentEntries = { restoreFromCache: [], buildFromSource: [] };

	const newEntryMap = new Map<ContentManifestKey, string>(newEntries);
	if (manifestState(oldManifest, newManifest) !== 'valid') {
		entries.buildFromSource = Array.from(newEntryMap.keys());
		return entries;
	}
	const oldEntryHashMap = new Map<string, ContentManifestKey>(
		oldEntries.map(([key, hash]) => [hash, key]),
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

type ManifestState =
	| 'valid'
	| 'no-manifest'
	| 'version-mismatch'
	| 'no-entries'
	| 'lockfile-mismatch'
	| 'config-mismatch';

function manifestState(oldManifest: ContentManifest, newManifest: ContentManifest): ManifestState {
	// There isn't an existing manifest.
	if (oldManifest.version === NO_MANIFEST_VERSION) {
		return 'no-manifest';
	}
	// Version mismatch, always invalid
	if (oldManifest.version !== newManifest.version) {
		return 'version-mismatch';
	}
	if (oldManifest.entries.length === 0) {
		return 'no-entries';
	}
	// Lockfiles have changed or there is no lockfile at all.
	if (oldManifest.lockfiles !== newManifest.lockfiles || newManifest.lockfiles === '') {
		return 'lockfile-mismatch';
	}
	// Config has changed.
	if (oldManifest.configs !== newManifest.configs) {
		return 'config-mismatch';
	}
	return 'valid';
}

async function generateContentManifest(
	opts: StaticBuildOptions,
	lookupMap: ContentLookupMap,
): Promise<ContentManifest> {
	let manifest = createContentManifest();
	manifest.version = CONTENT_MANIFEST_VERSION;
	const limit = pLimit(10);
	const promises: Promise<void>[] = [];

	for (const [collection, { type, entries }] of Object.entries(lookupMap)) {
		for (const entry of Object.values(entries)) {
			const key: ContentManifestKey = { collection, type, entry };
			const fileURL = new URL(encodeURI(joinPaths(opts.settings.config.root.toString(), entry)));
			promises.push(
				limit(async () => {
					const data = await fsMod.promises.readFile(fileURL, { encoding: 'utf8' });
					manifest.entries.push([key, checksum(data, fileURL.toString())]);
				}),
			);
		}
	}

	const [lockfiles, configs] = await Promise.all([
		lockfilesHash(opts.settings.config.root),
		configHash(opts.settings.config.root),
	]);

	manifest.lockfiles = lockfiles;
	manifest.configs = configs;

	await Promise.all(promises);
	return manifest;
}

async function pushBufferInto(fileURL: URL, buffers: Uint8Array[]) {
	try {
		const handle = await fsMod.promises.open(fileURL, 'r');
		const data = await handle.readFile();
		buffers.push(data);
		await handle.close();
	} catch {
		// File doesn't exist, ignore
	}
}

async function lockfilesHash(root: URL) {
	// Order is important so don't change this.
	const lockfiles = ['package-lock.json', 'pnpm-lock.yaml', 'yarn.lock', 'bun.lockb'];
	const datas: Uint8Array[] = [];
	const promises: Promise<void>[] = [];
	for (const lockfileName of lockfiles) {
		const fileURL = new URL(`./${lockfileName}`, root);
		promises.push(pushBufferInto(fileURL, datas));
	}
	await Promise.all(promises);
	return checksum(...datas);
}

async function configHash(root: URL) {
	const configFileNames = configPaths;
	for (const configPath of configFileNames) {
		try {
			const fileURL = new URL(`./${configPath}`, root);
			const data = await fsMod.promises.readFile(fileURL);
			const hash = checksum(data);
			return hash;
		} catch {
			// File doesn't exist
		}
	}
	// No config file, still create a hash since we can compare nothing against nothing.
	return checksum(`export default {}`);
}

function checksum(...datas: string[] | Uint8Array[]): string {
	const hash = createHash('sha1');
	datas.forEach((data) => hash.update(data));
	return hash.digest('base64');
}

function collectionTypeToFlag(type: 'content' | 'data') {
	const name = type[0].toUpperCase() + type.slice(1);
	return `astro${name}CollectionEntry`;
}

export async function copyContentToCache(opts: StaticBuildOptions) {
	const { config } = opts.settings;
	const distContentRoot = getContentRoot(config);
	const contentCacheDir = getContentCacheDir(config);
	const cacheTmp = getCacheTmp(contentCacheDir);

	await fsMod.promises.mkdir(cacheTmp, { recursive: true });
	await copyFiles(distContentRoot, cacheTmp, true);
	await copyFiles(cacheTmp, contentCacheDir);

	// Read the files from `dist/content/*` and `dist/chunks/*` so that
	// we can clean them out of the dist folder
	let files: string[] = [];
	await Promise.all([
		glob(`**/*.{mjs,json}`, {
			cwd: fileURLToPath(cacheTmp),
		}).then((f) => files.push(...f.map((file) => CONTENT_PATH + file))),
		glob(`**/*.{mjs,json}`, {
			cwd: fileURLToPath(new URL('./' + CHUNKS_PATH, config.outDir)),
		}).then((f) => files.push(...f.map((file) => CHUNKS_PATH + file))),
	]);

	// Remove the tmp folder that's no longer needed.
	await fsMod.promises.rm(cacheTmp, { recursive: true, force: true });

	return files;
}

export function pluginContent(
	opts: StaticBuildOptions,
	internals: BuildInternals,
): AstroBuildPlugin {
	const { cacheDir, outDir } = opts.settings.config;

	const chunksFolder = './' + CHUNKS_PATH;
	const assetsFolder = './' + appendForwardSlash(opts.settings.config.build.assets);
	// These are build output that is kept in the cache.
	const cachedBuildOutput = [
		{ cached: new URL(chunksFolder, cacheDir), dist: new URL(chunksFolder, outDir) },
		{ cached: new URL(assetsFolder, cacheDir), dist: new URL(assetsFolder, outDir) },
	];

	return {
		targets: ['server'],
		hooks: {
			async 'build:before'() {
				if (!isContentCollectionsCacheEnabled(opts.settings.config)) {
					return { vitePlugin: undefined };
				}
				const lookupMap = await generateLookupMap({ settings: opts.settings, fs: fsMod });
				return {
					vitePlugin: vitePluginContent(opts, lookupMap, internals, cachedBuildOutput),
				};
			},

			async 'build:post'() {
				if (!isContentCollectionsCacheEnabled(opts.settings.config)) {
					return;
				}
				// Cache build output of chunks and assets
				const promises: Promise<void[] | undefined>[] = [];
				for (const { cached, dist } of cachedBuildOutput) {
					if (fsMod.existsSync(dist)) {
						promises.push(copyFiles(dist, cached, true));
					}
				}

				if (promises.length) await Promise.all(promises);
			},
		},
	};
}
