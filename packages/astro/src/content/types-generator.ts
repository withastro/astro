import glob from 'fast-glob';
import { cyan } from 'kleur/colors';
import type fsMod from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { normalizePath, ViteDevServer } from 'vite';
import type { AstroSettings } from '../@types/astro.js';
import { AstroError, AstroErrorData } from '../core/errors/index.js';
import { info, LogOptions, warn } from '../core/logger/core.js';
import { isRelativePath } from '../core/path.js';
import { CONTENT_TYPES_FILE } from './consts.js';
import {
	ContentConfig,
	ContentObservable,
	ContentPaths,
	EntryInfo,
	getContentPaths,
	getEntryInfo,
	getEntrySlug,
	getEntryType,
	loadContentConfig,
	NoCollectionError,
	parseFrontmatter,
} from './utils.js';

type ChokidarEvent = 'add' | 'addDir' | 'change' | 'unlink' | 'unlinkDir';
type RawContentEvent = { name: ChokidarEvent; entry: string };
type ContentEvent = { name: ChokidarEvent; entry: URL };

type ContentTypesEntryMetadata = { slug: string };
type ContentTypes = Record<string, Record<string, ContentTypesEntryMetadata>>;

type CreateContentGeneratorParams = {
	contentConfigObserver: ContentObservable;
	logging: LogOptions;
	settings: AstroSettings;
	/** This is required for loading the content config */
	viteServer: ViteDevServer;
	fs: typeof fsMod;
};

type EventOpts = { logLevel: 'info' | 'warn' };

type EventWithOptions = {
	type: ContentEvent;
	opts: EventOpts | undefined;
};

class UnsupportedFileTypeError extends Error {}

export async function createContentTypesGenerator({
	contentConfigObserver,
	fs,
	logging,
	settings,
	viteServer,
}: CreateContentGeneratorParams) {
	const contentTypes: ContentTypes = {};
	const contentPaths = getContentPaths(settings.config, fs);

	let events: EventWithOptions[] = [];
	let debounceTimeout: NodeJS.Timeout | undefined;

	const contentTypesBase = await fs.promises.readFile(contentPaths.typesTemplate, 'utf-8');

	async function init(): Promise<
		{ typesGenerated: true } | { typesGenerated: false; reason: 'no-content-dir' }
	> {
		if (!fs.existsSync(contentPaths.contentDir)) {
			return { typesGenerated: false, reason: 'no-content-dir' };
		}

		events.push({
			type: { name: 'add', entry: contentPaths.config.url },
			opts: { logLevel: 'warn' },
		});

		const globResult = await glob('**', {
			cwd: fileURLToPath(contentPaths.contentDir),
			fs: {
				readdir: fs.readdir.bind(fs),
				readdirSync: fs.readdirSync.bind(fs),
			},
		});
		const entries = globResult
			.map((e) => new URL(e, contentPaths.contentDir))
			.filter(
				// Config loading handled first. Avoid running twice.
				(e) => !e.href.startsWith(contentPaths.config.url.href)
			);
		for (const entry of entries) {
			events.push({ type: { name: 'add', entry }, opts: { logLevel: 'warn' } });
		}
		await runEvents();
		return { typesGenerated: true };
	}

	async function handleEvent(
		event: ContentEvent,
		opts?: EventOpts
	): Promise<{ shouldGenerateTypes: boolean; error?: Error }> {
		const logLevel = opts?.logLevel ?? 'info';

		if (event.name === 'addDir' || event.name === 'unlinkDir') {
			const collection = normalizePath(
				path.relative(fileURLToPath(contentPaths.contentDir), fileURLToPath(event.entry))
			);
			// If directory is multiple levels deep, it is not a collection. Ignore event.
			const isCollectionEvent = collection.split('/').length === 1;
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
		const fileType = getEntryType(fileURLToPath(event.entry), contentPaths);
		if (fileType === 'ignored') {
			return { shouldGenerateTypes: false };
		}
		if (fileType === 'config') {
			contentConfigObserver.set({ status: 'loading' });
			try {
				const config = await loadContentConfig({ fs, settings, viteServer });
				if (config) {
					contentConfigObserver.set({ status: 'loaded', config });
				} else {
					contentConfigObserver.set({ status: 'does-not-exist' });
				}
			} catch (e) {
				contentConfigObserver.set({
					status: 'error',
					error:
						e instanceof Error ? e : new AstroError(AstroErrorData.UnknownContentCollectionError),
				});
			}

			return { shouldGenerateTypes: true };
		}
		if (fileType === 'unsupported') {
			// Avoid warning if file was deleted.
			if (event.name === 'unlink') {
				return { shouldGenerateTypes: false };
			}
			const entryInfo = getEntryInfo({
				entry: event.entry,
				contentDir: contentPaths.contentDir,
				// Skip invalid file check. We already know it’s invalid.
				allowFilesOutsideCollection: true,
			});
			return {
				shouldGenerateTypes: false,
				error: new UnsupportedFileTypeError(entryInfo.id),
			};
		}
		const entryInfo = getEntryInfo({
			entry: event.entry,
			contentDir: contentPaths.contentDir,
		});
		if (entryInfo instanceof NoCollectionError) {
			if (['info', 'warn'].includes(logLevel)) {
				warn(
					logging,
					'content',
					`${cyan(
						normalizePath(
							path.relative(fileURLToPath(contentPaths.contentDir), fileURLToPath(event.entry))
						)
					)} must be nested in a collection directory. Skipping.`
				);
			}
			return { shouldGenerateTypes: false };
		}

		const { id, collection } = entryInfo;

		const collectionKey = JSON.stringify(collection);
		const entryKey = JSON.stringify(id);

		switch (event.name) {
			case 'add':
				const addedSlug = await parseSlug({ fs, event, entryInfo });
				if (!(collectionKey in contentTypes)) {
					addCollection(contentTypes, collectionKey);
				}
				if (!(entryKey in contentTypes[collectionKey])) {
					setEntry(contentTypes, collectionKey, entryKey, addedSlug);
				}
				return { shouldGenerateTypes: true };
			case 'unlink':
				if (collectionKey in contentTypes && entryKey in contentTypes[collectionKey]) {
					removeEntry(contentTypes, collectionKey, entryKey);
				}
				return { shouldGenerateTypes: true };
			case 'change':
				// User may modify `slug` in their frontmatter.
				// Only regen types if this change is detected.
				const changedSlug = await parseSlug({ fs, event, entryInfo });
				if (contentTypes[collectionKey]?.[entryKey]?.slug !== changedSlug) {
					setEntry(contentTypes, collectionKey, entryKey, changedSlug);
					return { shouldGenerateTypes: true };
				}
				return { shouldGenerateTypes: false };
		}
	}

	function queueEvent(rawEvent: RawContentEvent, opts?: EventOpts) {
		const event = {
			type: {
				entry: pathToFileURL(rawEvent.entry),
				name: rawEvent.name,
			},
			opts,
		};
		if (!event.type.entry.pathname.startsWith(contentPaths.contentDir.pathname)) return;

		events.push(event);

		debounceTimeout && clearTimeout(debounceTimeout);
		debounceTimeout = setTimeout(
			async () => runEvents(opts),
			50 /* debounce to batch chokidar events */
		);
	}

	async function runEvents(opts?: EventOpts) {
		const logLevel = opts?.logLevel ?? 'info';
		const eventResponses = [];

		for (const event of events) {
			const response = await handleEvent(event.type, event.opts);
			eventResponses.push(response);
		}

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
				contentPaths,
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
	}
	return { init, queueEvent };
}

function addCollection(contentMap: ContentTypes, collectionKey: string) {
	contentMap[collectionKey] = {};
}

function removeCollection(contentMap: ContentTypes, collectionKey: string) {
	delete contentMap[collectionKey];
}

async function parseSlug({
	fs,
	event,
	entryInfo,
}: {
	fs: typeof fsMod;
	event: ContentEvent;
	entryInfo: EntryInfo;
}) {
	// `slug` may be present in entry frontmatter.
	// This should be respected by the generated `slug` type!
	// Parse frontmatter and retrieve `slug` value for this.
	// Note: will raise any YAML exceptions and `slug` parse errors (i.e. `slug` is a boolean)
	// on dev server startup or production build init.
	const rawContents = await fs.promises.readFile(event.entry, 'utf-8');
	const { data: frontmatter } = parseFrontmatter(rawContents, fileURLToPath(event.entry));
	return getEntrySlug({ ...entryInfo, data: frontmatter });
}

function setEntry(
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

async function writeContentFiles({
	fs,
	contentPaths,
	contentTypes,
	contentTypesBase,
	contentConfig,
}: {
	fs: typeof fsMod;
	contentPaths: ContentPaths;
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
			const slugType = JSON.stringify(entryMetadata.slug);
			contentTypesStr += `${entryKey}: {\n  id: ${entryKey},\n  slug: ${slugType},\n  body: string,\n  collection: ${collectionKey},\n  data: ${dataType}\n},\n`;
		}
		contentTypesStr += `},\n`;
	}

	if (!fs.existsSync(contentPaths.cacheDir)) {
		fs.mkdirSync(contentPaths.cacheDir, { recursive: true });
	}

	let configPathRelativeToCacheDir = normalizePath(
		path.relative(contentPaths.cacheDir.pathname, contentPaths.config.url.pathname)
	);
	if (!isRelativePath(configPathRelativeToCacheDir))
		configPathRelativeToCacheDir = './' + configPathRelativeToCacheDir;

	// Remove `.ts` from import path
	if (configPathRelativeToCacheDir.endsWith('.ts')) {
		configPathRelativeToCacheDir = configPathRelativeToCacheDir.replace(/\.ts$/, '');
	}

	contentTypesBase = contentTypesBase.replace('// @@ENTRY_MAP@@', contentTypesStr);
	contentTypesBase = contentTypesBase.replace(
		"'@@CONTENT_CONFIG_TYPE@@'",
		contentConfig ? `typeof import(${JSON.stringify(configPathRelativeToCacheDir)})` : 'never'
	);

	await fs.promises.writeFile(new URL(CONTENT_TYPES_FILE, contentPaths.cacheDir), contentTypesBase);
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
