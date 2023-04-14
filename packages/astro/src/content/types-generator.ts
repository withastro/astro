import glob from 'fast-glob';
import { cyan } from 'kleur/colors';
import type fsMod from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { normalizePath, type ViteDevServer } from 'vite';
import type { AstroSettings, ContentEntryType } from '../@types/astro.js';
import { AstroError, AstroErrorData } from '../core/errors/index.js';
import { info, warn, type LogOptions } from '../core/logger/core.js';
import { isRelativePath } from '../core/path.js';
import { CONTENT_TYPES_FILE, VIRTUAL_MODULE_ID } from './consts.js';
import {
	getContentPaths,
	getEntryType,
	loadContentConfig,
	getContentEntryIdAndSlug,
	getEntrySlug,
	type ContentConfig,
	type ContentObservable,
	type ContentPaths,
	getContentEntryConfigByExtMap,
	getEntryCollectionName,
	getDataEntryExts,
	getDataEntryId,
	getCollectionDirByUrl,
	reloadContentConfigObserver,
} from './utils.js';
import { rootRelativePath } from '../core/util.js';

type ChokidarEvent = 'add' | 'addDir' | 'change' | 'unlink' | 'unlinkDir';
type RawContentEvent = { name: ChokidarEvent; entry: string };
type ContentEvent = { name: ChokidarEvent; entry: URL; collectionDir: 'content' | 'data' };

type DataEntryMetadata = {};
type ContentEntryMetadata = { slug: string };
type ContentCollectionEntryMap = Record<string, Record<string, ContentEntryMetadata>>;
type DataCollectionEntryMap = Record<string, Record<string, DataEntryMetadata>>;

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
	event: ContentEvent;
	opts: EventOpts | undefined;
};

class UnsupportedFileTypeError extends Error {}

export async function createCollectionTypesGenerator({
	contentConfigObserver,
	fs,
	logging,
	settings,
	viteServer,
}: CreateContentGeneratorParams) {
	const contentCollectionEntryMap: ContentCollectionEntryMap = {};
	const dataCollectionEntryMap: DataCollectionEntryMap = {};
	const contentPaths = getContentPaths(settings.config, fs);
	const contentEntryConfigByExt = getContentEntryConfigByExtMap(settings);
	const contentEntryExts = [...contentEntryConfigByExt.keys()];
	const dataEntryExts = getDataEntryExts(settings);

	let events: EventWithOptions[] = [];
	let debounceTimeout: NodeJS.Timeout | undefined;

	const typeTemplateContent = await fs.promises.readFile(contentPaths.typesTemplate, 'utf-8');

	async function init(): Promise<
		{ typesGenerated: true } | { typesGenerated: false; reason: 'no-dirs' }
	> {
		if (!fs.existsSync(contentPaths.contentDir) && !fs.existsSync(contentPaths.dataDir)) {
			return { typesGenerated: false, reason: 'no-dirs' };
		}

		events.push({
			event: { name: 'add', entry: contentPaths.config.url, collectionDir: 'content' },
			opts: { logLevel: 'warn' },
		});

		const relContentDir = rootRelativePath(settings.config.root, contentPaths.contentDir, false);
		const relDataDir = rootRelativePath(settings.config.root, contentPaths.dataDir, false);

		const globResult = await glob([relContentDir + '**', relDataDir + '**'], {
			absolute: true,
			cwd: fileURLToPath(settings.config.root),
			fs: {
				readdir: fs.readdir.bind(fs),
				readdirSync: fs.readdirSync.bind(fs),
			},
		});
		const entries = globResult
			.map((e) => pathToFileURL(e))
			.filter(
				// Config loading handled first. Avoid running twice.
				(e) => !e.href.startsWith(contentPaths.config.url.href)
			);
		for (const entry of entries) {
			events.push({
				event: { name: 'add', entry, collectionDir: getCollectionDirByUrl(entry, contentPaths)! },
				opts: { logLevel: 'warn' },
			});
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

			const collectionEntryMap =
				event.collectionDir === 'content' ? contentCollectionEntryMap : dataCollectionEntryMap;
			switch (event.name) {
				case 'addDir':
					addCollection(collectionEntryMap, JSON.stringify(collection));
					if (logLevel === 'info') {
						info(logging, 'content', `${cyan(collection)} collection added`);
					}
					break;
				case 'unlinkDir':
					removeCollection(collectionEntryMap, JSON.stringify(collection));
					break;
			}
			return { shouldGenerateTypes: true };
		}
		const fileType = getEntryType(
			fileURLToPath(event.entry),
			contentPaths,
			contentEntryExts,
			dataEntryExts,
			event.collectionDir,
			settings.config.experimental.assets
		);
		if (fileType === 'ignored') {
			return { shouldGenerateTypes: false };
		}
		if (fileType === 'config') {
			await reloadContentConfigObserver({ fs, settings, viteServer });
			return { shouldGenerateTypes: true };
		}
		if (fileType === 'unsupported') {
			// Avoid warning if file was deleted.
			if (event.name === 'unlink') {
				return { shouldGenerateTypes: false };
			}
			const { id } = getContentEntryIdAndSlug({
				entry: event.entry,
				contentDir: contentPaths.contentDir,
				collection: '',
			});
			return {
				shouldGenerateTypes: false,
				error: new UnsupportedFileTypeError(id),
			};
		}

		const { entry } = event;
		const collectionDir =
			event.collectionDir === 'content' ? contentPaths.contentDir : contentPaths.dataDir;

		const collection = getEntryCollectionName({
			entry,
			dir: collectionDir,
		});
		if (collection === undefined) {
			if (['info', 'warn'].includes(logLevel)) {
				warn(
					logging,
					'content',
					`${cyan(
						normalizePath(path.relative(fileURLToPath(collectionDir), fileURLToPath(event.entry)))
					)} must be nested in a collection directory. Skipping.`
				);
			}
			return { shouldGenerateTypes: false };
		}

		if (fileType === 'data') {
			const id = getDataEntryId({ entry, dataDir: contentPaths.dataDir, collection });
			const collectionKey = JSON.stringify(collection);
			const entryKey = JSON.stringify(id);

			switch (event.name) {
				case 'add':
					if (!(collectionKey in dataCollectionEntryMap)) {
						addCollection(dataCollectionEntryMap, collectionKey);
					}
					if (!(entryKey in dataCollectionEntryMap[collectionKey])) {
						setEntry(dataCollectionEntryMap, collectionKey, entryKey, { type: 'data' });
					}
					return { shouldGenerateTypes: true };
				case 'unlink':
					if (
						collectionKey in dataCollectionEntryMap &&
						entryKey in dataCollectionEntryMap[collectionKey]
					) {
						removeEntry(dataCollectionEntryMap, collectionKey, entryKey);
					}
					return { shouldGenerateTypes: true };
				case 'change':
					return { shouldGenerateTypes: false };
			}
		}

		const contentEntryType = contentEntryConfigByExt.get(path.extname(event.entry.pathname));
		if (!contentEntryType) return { shouldGenerateTypes: false };
		const { id, slug: generatedSlug } = getContentEntryIdAndSlug({
			entry,
			contentDir: contentPaths.contentDir,
			collection,
		});

		const collectionKey = JSON.stringify(collection);
		const entryKey = JSON.stringify(id);

		switch (event.name) {
			case 'add':
				const addedSlug = await getEntrySlug({
					generatedSlug,
					id,
					collection,
					fileUrl: event.entry,
					contentEntryType,
					fs,
				});
				if (!(collectionKey in contentCollectionEntryMap)) {
					addCollection(contentCollectionEntryMap, collectionKey);
				}
				if (!(entryKey in contentCollectionEntryMap[collectionKey])) {
					setEntry(contentCollectionEntryMap, collectionKey, entryKey, {
						slug: addedSlug,
					});
				}
				return { shouldGenerateTypes: true };
			case 'unlink':
				if (
					collectionKey in contentCollectionEntryMap &&
					entryKey in contentCollectionEntryMap[collectionKey]
				) {
					removeEntry(contentCollectionEntryMap, collectionKey, entryKey);
				}
				return { shouldGenerateTypes: true };
			case 'change':
				// User may modify `slug` in their frontmatter.
				// Only regen types if this change is detected.
				const changedSlug = await getEntrySlug({
					generatedSlug,
					id,
					collection,
					fileUrl: event.entry,
					contentEntryType,
					fs,
				});
				const entryMetadata = contentCollectionEntryMap[collectionKey]?.[entryKey];
				if (entryMetadata?.slug !== changedSlug) {
					setEntry(contentCollectionEntryMap, collectionKey, entryKey, {
						slug: changedSlug,
					});
					return { shouldGenerateTypes: true };
				}
				return { shouldGenerateTypes: false };
		}
	}

	function queueEvent(rawEvent: RawContentEvent, opts?: EventOpts) {
		const entryUrl = pathToFileURL(rawEvent.entry);
		const collectionDir = getCollectionDirByUrl(entryUrl, contentPaths);
		if (!collectionDir) return;

		events.push({
			event: { name: rawEvent.name, entry: entryUrl, collectionDir: collectionDir },
			opts,
		});

		debounceTimeout && clearTimeout(debounceTimeout);
		const runEventsSafe = async () => {
			try {
				await runEvents(opts);
			} catch {
				// Prevent frontmatter errors from crashing the server. The errors
				// are still reported on page reflects as desired.
				// Errors still crash dev from *starting*.
			}
		};
		debounceTimeout = setTimeout(runEventsSafe, 50 /* debounce to batch chokidar events */);
	}

	async function runEvents(opts?: EventOpts) {
		const logLevel = opts?.logLevel ?? 'info';
		const eventResponses = [];

		for (const event of events) {
			const response = await handleEvent(event.event, event.opts);
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
				contentCollectionEntryMap,
				dataCollectionEntryMap,
				contentPaths,
				typeTemplateContent,
				contentConfig: observable.status === 'loaded' ? observable.config : undefined,
				contentEntryTypes: settings.contentEntryTypes,
			});
			invalidateVirtualMod(viteServer);
			if (observable.status === 'loaded' && ['info', 'warn'].includes(logLevel)) {
				warnNonexistentCollections({
					logging,
					contentConfig: observable.config,
					contentCollectionEntryMap,
					dataCollectionEntryMap,
				});
			}
		}
	}
	return { init, queueEvent };
}

// The virtual module contains a lookup map from slugs to content imports.
// Invalidate whenever content types change.
function invalidateVirtualMod(viteServer: ViteDevServer) {
	const virtualMod = viteServer.moduleGraph.getModuleById('\0' + VIRTUAL_MODULE_ID);
	if (!virtualMod) return;

	viteServer.moduleGraph.invalidateModule(virtualMod);
}

function addCollection(
	map: ContentCollectionEntryMap | DataCollectionEntryMap,
	collectionKey: string
) {
	map[collectionKey] = {};
}

function removeCollection(
	map: ContentCollectionEntryMap | DataCollectionEntryMap,
	collectionKey: string
) {
	delete map[collectionKey];
}

function setEntry<C extends ContentCollectionEntryMap | DataCollectionEntryMap>(
	map: C,
	collectionKey: string,
	entryKey: string,
	metadata: C[keyof C][string]
) {
	map[collectionKey][entryKey] = metadata;
}

function removeEntry(
	map: ContentCollectionEntryMap | DataCollectionEntryMap,
	collectionKey: string,
	entryKey: string
) {
	delete map[collectionKey][entryKey];
}

async function writeContentFiles({
	fs,
	contentPaths,
	contentCollectionEntryMap,
	dataCollectionEntryMap,
	typeTemplateContent,
	contentEntryTypes,
	contentConfig,
}: {
	fs: typeof fsMod;
	contentPaths: ContentPaths;
	contentCollectionEntryMap: ContentCollectionEntryMap;
	dataCollectionEntryMap: DataCollectionEntryMap;
	typeTemplateContent: string;
	contentEntryTypes: ContentEntryType[];
	contentConfig?: ContentConfig;
}) {
	let contentTypesStr = '';
	for (const collectionKey of Object.keys(contentCollectionEntryMap).sort()) {
		const collectionConfig = contentConfig?.collections[JSON.parse(collectionKey)];
		contentTypesStr += `${collectionKey}: {\n`;
		const entryKeys = Object.keys(contentCollectionEntryMap[collectionKey]).sort();
		for (const entryKey of entryKeys) {
			const entryMetadata = contentCollectionEntryMap[collectionKey][entryKey];
			const dataType = collectionConfig?.schema ? `InferEntrySchema<${collectionKey}>` : 'any';
			const renderType = `{ render(): Render[${JSON.stringify(
				path.extname(JSON.parse(entryKey))
			)}] }`;

			const slugType = JSON.stringify(entryMetadata.slug);
			contentTypesStr += `${entryKey}: {\n	id: ${entryKey};\n  slug: ${slugType};\n  body: string;\n  collection: ${collectionKey};\n  data: ${dataType}\n} & ${renderType};\n`;
		}
		contentTypesStr += `};\n`;
	}

	let dataTypesStr = '';
	for (const collectionKey of Object.keys(dataCollectionEntryMap).sort()) {
		const collectionConfig = contentConfig?.collections[JSON.parse(collectionKey)];
		dataTypesStr += `${collectionKey}: {\n`;
		const entryKeys = Object.keys(dataCollectionEntryMap[collectionKey]).sort();
		for (const entryKey of entryKeys) {
			const dataType = collectionConfig?.schema ? `InferEntrySchema<${collectionKey}>` : 'any';
			dataTypesStr += `${entryKey}: {\n	id: ${entryKey};\n  collection: ${collectionKey};\n  data: ${dataType}\n};\n`;
		}
		dataTypesStr += `};\n`;
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

	for (const contentEntryType of contentEntryTypes) {
		if (contentEntryType.contentModuleTypes) {
			typeTemplateContent = contentEntryType.contentModuleTypes + '\n' + typeTemplateContent;
		}
	}
	typeTemplateContent = typeTemplateContent.replace('// @@CONTENT_ENTRY_MAP@@', contentTypesStr);
	typeTemplateContent = typeTemplateContent.replace('// @@DATA_ENTRY_MAP@@', dataTypesStr);
	typeTemplateContent = typeTemplateContent.replace(
		"'@@CONTENT_CONFIG_TYPE@@'",
		contentConfig ? `typeof import(${JSON.stringify(configPathRelativeToCacheDir)})` : 'never'
	);

	await fs.promises.writeFile(
		new URL(CONTENT_TYPES_FILE, contentPaths.cacheDir),
		typeTemplateContent
	);
}

function warnNonexistentCollections({
	contentConfig,
	contentCollectionEntryMap,
	dataCollectionEntryMap,
	logging,
}: {
	contentConfig: ContentConfig;
	contentCollectionEntryMap: ContentCollectionEntryMap;
	dataCollectionEntryMap: DataCollectionEntryMap;
	logging: LogOptions;
}) {
	for (const configuredCollection in contentConfig.collections) {
		const collectionType = contentConfig.collections[configuredCollection].type;
		if (
			(collectionType === 'content' &&
				!contentCollectionEntryMap[JSON.stringify(configuredCollection)]) ||
			(collectionType === 'data' && !dataCollectionEntryMap[JSON.stringify(configuredCollection)])
		) {
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
