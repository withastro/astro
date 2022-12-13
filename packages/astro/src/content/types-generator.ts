import { normalizePath } from 'vite';
import glob from 'fast-glob';
import fsMod from 'node:fs';
import * as path from 'node:path';
import { bold, cyan } from 'kleur/colors';
import { info, LogOptions, warn } from '../core/logger/core.js';
import type { AstroSettings } from '../@types/astro.js';
import { appendForwardSlash, isRelativePath } from '../core/path.js';
import { contentFileExts, CONTENT_TYPES_FILE } from './consts.js';
import { pathToFileURL } from 'node:url';
import {
	CollectionConfig,
	ContentConfig,
	loadContentConfig,
	ContentPaths,
	ContentObservable,
} from './utils.js';

type ChokidarEvent = 'add' | 'addDir' | 'change' | 'unlink' | 'unlinkDir';
type ContentEvent = { name: ChokidarEvent; entry: string };
type EntryInfo = {
	id: string;
	slug: string;
	collection: string;
};

export type GenerateContentTypes = {
	init(): Promise<void>;
	queueEvent(event: ContentEvent): void;
};

type ContentTypes = Record<string, Record<string, string>>;

type CreateContentGeneratorParams = {
	contentPaths: ContentPaths;
	contentConfigObserver: ContentObservable;
	logging: LogOptions;
	settings: AstroSettings;
	fs: typeof fsMod;
};

const msg = {
	collectionAdded: (collection: string) => `${cyan(collection)} collection added`,
	entryAdded: (entry: string, collection: string) => `${cyan(entry)} added to ${bold(collection)}.`,
};

export async function createContentTypesGenerator({
	contentPaths,
	contentConfigObserver,
	fs,
	logging,
	settings,
}: CreateContentGeneratorParams): Promise<GenerateContentTypes> {
	const contentTypes: ContentTypes = {};

	let events: Promise<void>[] = [];
	let debounceTimeout: NodeJS.Timeout | undefined;

	const contentTypesBase = await fsMod.promises.readFile(
		new URL(CONTENT_TYPES_FILE, contentPaths.generatedInputDir),
		'utf-8'
	);

	async function init() {
		const pattern =
			new URL('./**/', contentPaths.contentDir).pathname + `*{${contentFileExts.join(',')}}`;
		const entries = await glob(pattern, {
			fs: {
				readdir: fs.readdir.bind(fs),
				readdirSync: fs.readdirSync.bind(fs),
			},
		});
		for (const entry of entries) {
			await onEvent({ name: 'add', entry }, { shouldLog: false });
		}
		const observable = contentConfigObserver.get();
		await runEventsDebounced();
		if (observable.status === 'loaded') {
			warnNonexistentCollections({ logging, contentConfig: observable.config, contentTypes });
		}
	}

	async function onEvent(event: ContentEvent, opts?: { shouldLog: boolean }) {
		const shouldLog = opts?.shouldLog ?? true;

		if (event.name === 'addDir' || event.name === 'unlinkDir') {
			const collection = path.relative(contentPaths.contentDir.pathname, event.entry);
			// If directory is multiple levels deep, it is not a collection. Ignore event.
			const isCollectionEvent = collection.split(path.sep).length === 1;
			if (!isCollectionEvent) return;
			switch (event.name) {
				case 'addDir':
					addCollection(contentTypes, JSON.stringify(collection));
					if (shouldLog) {
						info(logging, 'content', msg.collectionAdded(collection));
					}
					break;
				case 'unlinkDir':
					removeCollection(contentTypes, JSON.stringify(collection));
					break;
			}
		} else {
			const fileType = getEntryType(event.entry, contentPaths);
			if (fileType === 'config') {
				contentConfigObserver.set({ status: 'loading' });
				const config = await loadContentConfig({ fs, settings });
				if (config instanceof Error) {
					contentConfigObserver.set({ status: 'error', error: config });
				} else {
					contentConfigObserver.set({ status: 'loaded', config });
				}

				const observable = contentConfigObserver.get();
				if (observable.status === 'loaded') {
					warnNonexistentCollections({
						logging,
						contentConfig: observable.config,
						contentTypes,
					});
				}
				return;
			}
			if (fileType === 'unknown') {
				warn(
					logging,
					'content',
					`${cyan(
						path.relative(contentPaths.contentDir.pathname, event.entry)
					)} is not a supported file type. Skipping.`
				);
				return;
			}
			const entryInfo = getEntryInfo({
				entryPath: event.entry,
				contentDir: contentPaths.contentDir,
			});
			// Not a valid `src/content/` entry. Silently return.
			if (entryInfo instanceof Error) return;
			if (entryInfo.collection === '.') {
				warn(
					logging,
					'content',
					`${cyan(
						path.relative(contentPaths.contentDir.pathname, event.entry)
					)} must be nested in a collection directory. Skipping.`
				);
				return;
			}

			const { id, slug, collection } = entryInfo;
			const collectionKey = JSON.stringify(collection);
			const entryKey = JSON.stringify(id);
			const observable = contentConfigObserver.get();
			const collectionConfig =
				observable.status === 'loaded' ? observable.config.collections[collection] : undefined;
			switch (event.name) {
				case 'add':
					if (!(collectionKey in contentTypes)) {
						addCollection(contentTypes, collectionKey);
					}
					if (!(entryKey in contentTypes[collectionKey])) {
						addEntry(contentTypes, collectionKey, entryKey, slug, collectionConfig);
					}
					if (shouldLog) {
						info(logging, 'content', msg.entryAdded(entryInfo.slug, entryInfo.collection));
					}
					break;
				case 'unlink':
					if (collectionKey in contentTypes && entryKey in contentTypes[collectionKey]) {
						removeEntry(contentTypes, collectionKey, entryKey);
					}
					break;
				case 'change':
					// noop. Frontmatter types are inferred from collection schema import, so they won't change!
					break;
			}
		}
	}

	function queueEvent(event: ContentEvent, eventOpts?: { shouldLog: boolean }) {
		if (!event.entry.startsWith(contentPaths.contentDir.pathname)) return;
		if (event.entry.endsWith(CONTENT_TYPES_FILE)) return;

		events.push(onEvent(event, eventOpts));
		runEventsDebounced();
	}

	function runEventsDebounced() {
		debounceTimeout && clearTimeout(debounceTimeout);
		debounceTimeout = setTimeout(async () => {
			await Promise.all(events);
			await writeContentFiles({
				fs,
				contentTypes,
				paths: contentPaths,
				contentTypesBase,
				hasContentConfig: contentConfigObserver.get().status === 'loaded',
			});
		}, 50 /* debounce 50 ms to batch chokidar events */);
	}
	return { init, queueEvent };
}

function addCollection(contentMap: ContentTypes, collectionKey: string) {
	contentMap[collectionKey] = {};
}

function removeCollection(contentMap: ContentTypes, collectionKey: string) {
	delete contentMap[collectionKey];
}

function addEntry(
	contentTypes: ContentTypes,
	collectionKey: string,
	entryKey: string,
	slug: string,
	collectionConfig?: CollectionConfig
) {
	const dataType = collectionConfig?.schema ? `InferEntrySchema<${collectionKey}>` : 'any';
	// If user has custom slug function, we can't predict slugs at type compilation.
	// Would require parsing all data and evaluating ahead-of-time;
	// We evaluate with lazy imports at dev server runtime
	// to prevent excessive errors
	const slugType = collectionConfig?.slug ? 'string' : JSON.stringify(slug);

	contentTypes[collectionKey][
		entryKey
	] = `{\n  id: ${entryKey},\n  slug: ${slugType},\n  body: string,\n  collection: ${collectionKey},\n  data: ${dataType}\n}`;
}

function removeEntry(contentTypes: ContentTypes, collectionKey: string, entryKey: string) {
	delete contentTypes[collectionKey][entryKey];
}

export function getEntryInfo({
	entryPath,
	contentDir,
}: Pick<ContentPaths, 'contentDir'> & { entryPath: string }): EntryInfo | Error {
	const relativeEntryPath = normalizePath(path.relative(contentDir.pathname, entryPath));
	const collection = path.dirname(relativeEntryPath).split(path.sep).shift();
	if (!collection) return new Error();

	const id = path.relative(collection, relativeEntryPath);
	const slug = id.replace(path.extname(id), '');
	return {
		id,
		slug,
		collection,
	};
}

export function getEntryType(
	entryPath: string,
	paths: ContentPaths
): 'content' | 'config' | 'unknown' {
	const { dir, ext, name } = path.parse(entryPath);
	const { pathname } = new URL(name, appendForwardSlash(pathToFileURL(dir).href));
	if ((contentFileExts as readonly string[]).includes(ext)) {
		return 'content';
	} else if (pathname === paths.config.pathname) {
		return 'config';
	} else {
		return 'unknown';
	}
}

async function writeContentFiles({
	fs,
	paths,
	contentTypes,
	contentTypesBase,
	hasContentConfig,
}: {
	fs: typeof fsMod;
	paths: ContentPaths;
	contentTypes: ContentTypes;
	contentTypesBase: string;
	hasContentConfig: boolean;
}) {
	let contentTypesStr = '';
	const collectionKeys = Object.keys(contentTypes).sort();
	for (const collectionKey of collectionKeys) {
		contentTypesStr += `${collectionKey}: {\n`;
		const entryKeys = Object.keys(contentTypes[collectionKey]).sort();
		for (const entryKey of entryKeys) {
			const entry = contentTypes[collectionKey][entryKey];
			contentTypesStr += `${entryKey}: ${entry},\n`;
		}
		contentTypesStr += `},\n`;
	}

	let configPathRelativeToCacheDir = normalizePath(
		path.relative(paths.cacheDir.pathname, paths.config.pathname)
	);
	if (!isRelativePath(configPathRelativeToCacheDir))
		configPathRelativeToCacheDir = './' + configPathRelativeToCacheDir;

	contentTypesBase = contentTypesBase.replace('// @@ENTRY_MAP@@', contentTypesStr);
	contentTypesBase = contentTypesBase.replace(
		"'@@CONTENT_CONFIG_TYPE@@'",
		hasContentConfig ? `typeof import(${JSON.stringify(configPathRelativeToCacheDir)})` : 'never'
	);

	try {
		await fs.promises.stat(paths.cacheDir);
	} catch {
		await fs.promises.mkdir(paths.cacheDir);
	}

	await fs.promises.writeFile(new URL(CONTENT_TYPES_FILE, paths.cacheDir), contentTypesBase);
}

function warnNonexistentCollections({
	contentConfig,
	contentTypes,
	logging,
}: {
	contentConfig: ContentConfig;
	contentTypes: ContentTypes;
	logging: LogOptions;
}) {
	for (const configuredCollection in contentConfig.collections) {
		if (!contentTypes[JSON.stringify(configuredCollection)]) {
			warn(
				logging,
				'content',
				`${JSON.stringify(
					configuredCollection
				)} is not a collection. Check your content config for typos.`
			);
		}
	}
}
