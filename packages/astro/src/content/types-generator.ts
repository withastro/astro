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

type ContentTypesEntryMetadata = { slug: string };
type ContentTypes = Record<string, Record<string, ContentTypesEntryMetadata>>;

type CreateContentGeneratorParams = {
	contentPaths: ContentPaths;
	contentConfigObserver: ContentObservable;
	logging: LogOptions;
	settings: AstroSettings;
	fs: typeof fsMod;
};

type EventOpts = { logLevel: 'info' | 'warn' };

class UnsupportedFileTypeError extends Error {}

export async function createContentTypesGenerator({
	contentPaths,
	contentConfigObserver,
	fs,
	logging,
	settings,
}: CreateContentGeneratorParams): Promise<GenerateContentTypes> {
	const contentTypes: ContentTypes = {};

	let events: Promise<{ shouldGenerateTypes: boolean; error?: Error }>[] = [];
	let debounceTimeout: NodeJS.Timeout | undefined;

	const contentTypesBase = await fsMod.promises.readFile(
		new URL(CONTENT_TYPES_FILE, contentPaths.generatedInputDir),
		'utf-8'
	);

	async function init() {
		await handleEvent({ name: 'add', entry: contentPaths.config.pathname }, { logLevel: 'warn' });
		const entries = await glob(new URL('./**/', contentPaths.contentDir).pathname + `*.*`, {
			fs: {
				readdir: fs.readdir.bind(fs),
				readdirSync: fs.readdirSync.bind(fs),
			},
		});
		for (const entry of entries.filter(
			// Config loading handled first. Avoid running twice.
			(e) => !e.startsWith(contentPaths.config.pathname)
		)) {
			events.push(handleEvent({ name: 'add', entry }, { logLevel: 'warn' }));
		}
		runEventsDebounced();
	}

	async function handleEvent(
		event: ContentEvent,
		opts?: EventOpts
	): Promise<{ shouldGenerateTypes: boolean; error?: Error }> {
		const logLevel = opts?.logLevel ?? 'info';

		if (event.name === 'addDir' || event.name === 'unlinkDir') {
			const collection = path.relative(contentPaths.contentDir.pathname, event.entry);
			// If directory is multiple levels deep, it is not a collection. Ignore event.
			const isCollectionEvent = collection.split(path.sep).length === 1;
			if (!isCollectionEvent) return { shouldGenerateTypes: false };
			switch (event.name) {
				case 'addDir':
					addCollection(contentTypes, JSON.stringify(collection));
					if (logLevel === 'info') {
						info(logging, 'content', `${cyan(collection)} collection added`);
					}
					break;
				case 'unlinkDir':
					removeCollection(contentTypes, JSON.stringify(collection));
					break;
			}
			return { shouldGenerateTypes: true };
		}
		const fileType = getEntryType(event.entry, contentPaths);
		if (fileType === 'generated-types') {
			return { shouldGenerateTypes: false };
		}
		if (fileType === 'config') {
			contentConfigObserver.set({ status: 'loading' });
			const config = await loadContentConfig({ fs, settings });
			if (config instanceof Error) {
				contentConfigObserver.set({ status: 'error', error: config });
			} else {
				contentConfigObserver.set({ status: 'loaded', config });
			}

			return { shouldGenerateTypes: true };
		}
		const entryInfo = getEntryInfo({
			entryPath: event.entry,
			contentDir: contentPaths.contentDir,
		});
		// Not a valid `src/content/` entry. Silently return.
		if (entryInfo instanceof Error) return { shouldGenerateTypes: false };
		if (fileType === 'unknown') {
			if (entryInfo.id.startsWith('_') && (event.name === 'add' || event.name === 'change')) {
				// Silently ignore `_` files.
				return { shouldGenerateTypes: false };
			} else {
				return {
					shouldGenerateTypes: false,
					error: new UnsupportedFileTypeError(entryInfo.id),
				};
			}
		}
		if (entryInfo.collection === '.') {
			if (['info', 'warn'].includes(logLevel)) {
				warn(
					logging,
					'content',
					`${cyan(
						path.relative(contentPaths.contentDir.pathname, event.entry)
					)} must be nested in a collection directory. Skipping.`
				);
			}
			return { shouldGenerateTypes: false };
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
					addEntry(contentTypes, collectionKey, entryKey, slug);
				}
				return { shouldGenerateTypes: true };
			case 'unlink':
				if (collectionKey in contentTypes && entryKey in contentTypes[collectionKey]) {
					removeEntry(contentTypes, collectionKey, entryKey);
				}
				return { shouldGenerateTypes: true };
			case 'change':
				// noop. Frontmatter types are inferred from collection schema import, so they won't change!
				return { shouldGenerateTypes: false };
		}
	}

	function queueEvent(event: ContentEvent, opts?: EventOpts) {
		if (!event.entry.startsWith(contentPaths.contentDir.pathname)) return;

		events.push(handleEvent(event, opts));
		runEventsDebounced(opts);
	}

	function runEventsDebounced(opts?: EventOpts) {
		const logLevel = opts?.logLevel ?? 'info';
		debounceTimeout && clearTimeout(debounceTimeout);
		debounceTimeout = setTimeout(async () => {
			const eventResponses = await Promise.all(events);
			events = [];
			let unsupportedFiles = [];
			for (const response of eventResponses) {
				if (response.error instanceof UnsupportedFileTypeError) {
					unsupportedFiles.push(response.error.message);
				}
			}
			if (unsupportedFiles.length > 0 && ['info', 'warn'].includes(logLevel)) {
				warn(
					logging,
					'content',
					`Unsupported file types found. Prefix with an underscore (\`_\`) to ignore:\n- ${unsupportedFiles.join(
						'\n'
					)}`
				);
			}
			const observable = contentConfigObserver.get();
			if (eventResponses.some((r) => r.shouldGenerateTypes)) {
				await writeContentFiles({
					fs,
					contentTypes,
					paths: contentPaths,
					contentTypesBase,
					contentConfig: observable.status === 'loaded' ? observable.config : undefined,
				});
				if (observable.status === 'loaded' && ['info', 'warn'].includes(logLevel)) {
					warnNonexistentCollections({
						logging,
						contentConfig: observable.config,
						contentTypes,
					});
				}
			}
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
	slug: string
) {
	contentTypes[collectionKey][entryKey] = { slug };
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
): 'content' | 'config' | 'unknown' | 'generated-types' {
	const { dir: unresolvedDir, ext, name, base } = path.parse(entryPath);
	const dir = appendForwardSlash(pathToFileURL(unresolvedDir).href);
	if ((contentFileExts as readonly string[]).includes(ext)) {
		return 'content';
	} else if (new URL(name, dir).pathname === paths.config.pathname) {
		return 'config';
	} else if (new URL(base, dir).pathname === new URL(CONTENT_TYPES_FILE, paths.cacheDir).pathname) {
		return 'generated-types';
	} else {
		return 'unknown';
	}
}

async function writeContentFiles({
	fs,
	paths,
	contentTypes,
	contentTypesBase,
	contentConfig,
}: {
	fs: typeof fsMod;
	paths: ContentPaths;
	contentTypes: ContentTypes;
	contentTypesBase: string;
	contentConfig?: ContentConfig;
}) {
	let contentTypesStr = '';
	const collectionKeys = Object.keys(contentTypes).sort();
	for (const collectionKey of collectionKeys) {
		const collectionConfig = contentConfig?.collections[JSON.parse(collectionKey)];
		contentTypesStr += `${collectionKey}: {\n`;
		const entryKeys = Object.keys(contentTypes[collectionKey]).sort();
		for (const entryKey of entryKeys) {
			const entryMetadata = contentTypes[collectionKey][entryKey];
			const dataType = collectionConfig?.schema ? `InferEntrySchema<${collectionKey}>` : 'any';
			// If user has custom slug function, we can't predict slugs at type compilation.
			// Would require parsing all data and evaluating ahead-of-time;
			// We evaluate with lazy imports at dev server runtime
			// to prevent excessive errors
			const slugType = collectionConfig?.slug ? 'string' : JSON.stringify(entryMetadata.slug);
			contentTypesStr += `${entryKey}: {\n  id: ${entryKey},\n  slug: ${slugType},\n  body: string,\n  collection: ${collectionKey},\n  data: ${dataType}\n},\n`;
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
		contentConfig ? `typeof import(${JSON.stringify(configPathRelativeToCacheDir)})` : 'never'
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
