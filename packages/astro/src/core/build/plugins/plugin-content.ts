import type { Plugin as VitePlugin } from 'vite';
import fsMod from 'node:fs';
import { createHash } from 'node:crypto';
import { addRollupInput } from '../add-rollup-input.js';
import { type BuildInternals } from '../internal.js';
import type { AstroBuildPlugin } from '../plugin.js';
import type { StaticBuildOptions } from '../types.js';
import { generateContentEntryFile, generateLookupMap } from '../../../content/vite-plugin-content-virtual-mod.js';
import { joinPaths } from '../../path.js';
import { fileURLToPath, pathToFileURL } from 'node:url';
import type { ContentLookupMap } from '../../../content/utils.js';
import { CONTENT_RENDER_FLAG } from '../../../content/consts.js';
import { copyFiles } from '../static-build.js';
import pLimit from 'p-limit';

const CONTENT_CACHE_DIR = './content/';
const CONTENT_MANIFEST_FILE = './manifest.json';
const CONTENT_ENTRY_CACHE_DIR = './entries/';
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
}

const virtualEmptyModuleId = `virtual:empty-content`;
const resolvedVirtualEmptyModuleId = `\0${virtualEmptyModuleId}`;

function vitePluginContent(opts: StaticBuildOptions, lookupMap: ContentLookupMap, _internals: BuildInternals): VitePlugin {
	const { cacheDir } = opts.settings.config;
	const contentCacheDir = new URL(CONTENT_CACHE_DIR, cacheDir);
	const contentManifestFile = new URL(CONTENT_MANIFEST_FILE, contentCacheDir);
	const contentEntryCacheDir = new URL(CONTENT_ENTRY_CACHE_DIR, contentCacheDir);
	let oldManifest: ContentManifest = { version: -1, entries: [] }
	let newManifest: ContentManifest = { version: -1, entries: [] }
	let entries: ContentEntries;

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

			if (opts.settings.config.output === 'static') {
				newManifest = await generateContentManifest(opts, lookupMap);
				await fsMod.promises.mkdir(new URL('./', contentManifestFile), { recursive: true });
				await fsMod.promises.writeFile(contentManifestFile, JSON.stringify(newManifest), { encoding: 'utf8' });
				entries = getEntriesFromManifests(oldManifest, newManifest);

				console.log(`Building ${entries.buildFromSource.length} changed files...`)

				for (const { type, entry } of entries.buildFromSource) {
					const fileURL = joinPaths(opts.settings.config.root.toString(), entry);
					const input = fileURLToPath(fileURL);
					const inputs = [`${input}?${collectionTypeToFlag(type)}`];
					if (type === 'content') {
						inputs.push(`${input}?${CONTENT_RENDER_FLAG}`)
					}
					newOptions = addRollupInput(newOptions, inputs);
				}

				if (entries.buildFromSource.length === 0) {
					newOptions = addRollupInput(newOptions, [virtualEmptyModuleId])
				}
			}
			return newOptions;
		},

		resolveId(id) {
			if (id === virtualEmptyModuleId) {
				return resolvedVirtualEmptyModuleId;
			}
		},

		load(id) {
			if (id === resolvedVirtualEmptyModuleId) {
				return {
					code: `// intentionally left empty!\nexport default {}`
				}
			}
		},

		async generateBundle(options, bundle) {
			const content = await generateContentEntryFile({ settings: opts.settings, fs: fsMod, lookupMap });
			this.emitFile({
				type: 'prebuilt-chunk',
				code: content,
				fileName: '.entry.mjs'
			})
			Object.keys(bundle).forEach(key => {
				const mod = bundle[key];
				if (mod.type === 'asset') return;
				if (mod.facadeModuleId === resolvedVirtualEmptyModuleId) {
					delete bundle[key];
				}
			});
		},

		async writeBundle(options) {
			const dist = new URL(pathToFileURL(options.dir!).toString() + '/');
			const cache = contentEntryCacheDir;
			const cacheTmp = new URL('./.tmp/', cache);

			const cacheExists = fsMod.existsSync(cache);
			fsMod.mkdirSync(cache, { recursive: true })
			await fsMod.promises.mkdir(cacheTmp, { recursive: true });
			await copyFiles(dist, cacheTmp, true);
			
			if (cacheExists) {
				await copyFiles(contentEntryCacheDir, dist, false)
			}

			await copyFiles(cacheTmp, contentEntryCacheDir);
			await fsMod.promises.rm(cacheTmp, { recursive: true, force: true });
		}
	};
}

interface ContentEntries {
	restoreFromCache: ContentManifestKey[];
	buildFromSource: ContentManifestKey[];
}
function getEntriesFromManifests(oldManifest: ContentManifest, newManifest: ContentManifest): ContentEntries {
	const { version: oldVersion, entries: oldEntries } = oldManifest;
	const { version: newVersion, entries: newEntries } = newManifest;
	let entries: ContentEntries = { restoreFromCache: [], buildFromSource: [] };

	const newEntryMap = new Map<ContentManifestKey, string>(newEntries);
	if (oldVersion !== newVersion || oldEntries.length === 0) {
		entries.buildFromSource = Array.from(newEntryMap.keys());
		return entries;
	}
	const oldEntryHashMap = new Map<string, ContentManifestKey>(oldEntries.map(([key, hash]) => [hash, key]))

	for (const [entry, hash] of newEntryMap) {
		if (oldEntryHashMap.has(hash)) {
			entries.restoreFromCache.push(entry);
		} else {
			entries.buildFromSource.push(entry);
		}
	}
	return entries;
}

async function generateContentManifest(opts: StaticBuildOptions, lookupMap: ContentLookupMap): Promise<ContentManifest> {
	let manifest: ContentManifest = { version: CONTENT_MANIFEST_VERSION, entries: [] };
	const limit = pLimit(10);
	const promises: Promise<void>[] = [];

	for (const [collection, { type, entries }] of Object.entries(lookupMap)) {
		for (const entry of Object.values(entries)) {
			const key: ContentManifestKey = { collection, type, entry };
			const fileURL = new URL(joinPaths(opts.settings.config.root.toString(), entry));
			promises.push(limit(async () => {
				const data = await fsMod.promises.readFile(fileURL, { encoding: 'utf8' });
				manifest.entries.push([key, checksum(data)])
			}))
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
	return `astro${name}CollectionEntry`
}

export function pluginContent(opts: StaticBuildOptions, internals: BuildInternals): AstroBuildPlugin {
	return {
		targets: ['content'],
		hooks: {
			async 'build:before'() {
				// TODO: filter lookupMap based on file hashes
				const lookupMap = await generateLookupMap({ settings: opts.settings, fs: fsMod });
				
				return {
					vitePlugin: vitePluginContent(opts, lookupMap, internals),
				};
			}
		},
	};
}
