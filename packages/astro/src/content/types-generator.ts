import glob from 'fast-glob';
import { cyan } from 'kleur/colors';
import type fsMod from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { normalizePath, type ViteDevServer } from 'vite';
import type { AstroSettings, ContentEntryType } from '../@types/astro.js';
import { AstroErrorData } from '../core/errors/errors-data.js';
import { AstroError } from '../core/errors/errors.js';
import { info, warn, type LogOptions } from '../core/logger/core.js';
import { isRelativePath } from '../core/path.js';
import { CONTENT_TYPES_FILE, VIRTUAL_MODULE_ID } from './consts.js';
import {
	getContentEntryConfigByExtMap,
	getContentEntryIdAndSlug,
	getContentPaths,
	getDataEntryExts,
	getDataEntryId,
	getEntryCollectionName,
	getEntrySlug,
	getEntryType,
	reloadContentConfigObserver,
	type ContentConfig,
	type ContentObservable,
	type ContentPaths,
} from './utils.js';

type ChokidarEvent = 'add' | 'addDir' | 'change' | 'unlink' | 'unlinkDir';
type RawContentEvent = { name: ChokidarEvent; entry: string };
type ContentEvent = { name: ChokidarEvent; entry: URL };

type DataEntryMetadata = Record<string, never>;
type ContentEntryMetadata = { slug: string };
type CollectionEntryMap = {
	[collection: string]:
		| {
				type: 'unknown';
				entries: Record<string, never>;
		  }
		| {
				type: 'content';
				entries: Record<string, ContentEntryMetadata>;
		  }
		| {
				type: 'data';
				entries: Record<string, DataEntryMetadata>;
		  };
};

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
	const collectionEntryMap: CollectionEntryMap = {};
	const contentPaths = getContentPaths(settings.config, fs);
	const contentEntryConfigByExt = getContentEntryConfigByExtMap(settings);
	const contentEntryExts = [...contentEntryConfigByExt.keys()];
	const dataEntryExts = getDataEntryExts(settings);

	let events: EventWithOptions[] = [];
	let debounceTimeout: NodeJS.Timeout | undefined;

	const typeTemplateContent = await fs.promises.readFile(contentPaths.typesTemplate, 'utf-8');

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
			const collectionKey = JSON.stringify(collection);
			// If directory is multiple levels deep, it is not a collection. Ignore event.
			const isCollectionEvent = collection.split('/').length === 1;
			if (!isCollectionEvent) return { shouldGenerateTypes: false };

			switch (event.name) {
				case 'addDir':
					collectionEntryMap[JSON.stringify(collection)] = { type: 'unknown', entries: {} };
					if (logLevel === 'info') {
						info(logging, 'content', `${cyan(collection)} collection added`);
					}
					break;
				case 'unlinkDir':
					if (collectionKey in collectionEntryMap) {
						delete collectionEntryMap[JSON.stringify(collection)];
					}
					break;
			}
			return { shouldGenerateTypes: true };
		}
		const fileType = getEntryType(
			fileURLToPath(event.entry),
			contentPaths,
			contentEntryExts,
			dataEntryExts,
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
		const { contentDir } = contentPaths;

		const collection = getEntryCollectionName({ entry, contentDir });
		if (collection === undefined) {
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

		if (fileType === 'data') {
			const id = getDataEntryId({ entry, contentDir, collection });
			const collectionKey = JSON.stringify(collection);
			const entryKey = JSON.stringify(id);

			switch (event.name) {
				case 'add':
					if (!(collectionKey in collectionEntryMap)) {
						collectionEntryMap[collectionKey] = { type: 'data', entries: {} };
					}
					const collectionInfo = collectionEntryMap[collectionKey];
					if (collectionInfo.type === 'content') {
						viteServer.ws.send({
							type: 'error',
							err: new AstroError({
								...AstroErrorData.MixedContentDataCollectionError,
								message: AstroErrorData.MixedContentDataCollectionError.message(collectionKey),
								location: { file: entry.pathname },
							}) as any,
						});
						return { shouldGenerateTypes: false };
					}
					if (!(entryKey in collectionEntryMap[collectionKey])) {
						collectionEntryMap[collectionKey] = {
							type: 'data',
							entries: { ...collectionInfo.entries, [entryKey]: {} },
						};
					}
					return { shouldGenerateTypes: true };
				case 'unlink':
					if (
						collectionKey in collectionEntryMap &&
						entryKey in collectionEntryMap[collectionKey].entries
					) {
						delete collectionEntryMap[collectionKey].entries[entryKey];
					}
					return { shouldGenerateTypes: true };
				case 'change':
					return { shouldGenerateTypes: false };
			}
		}

		const contentEntryType = contentEntryConfigByExt.get(path.extname(event.entry.pathname));
		if (!contentEntryType) return { shouldGenerateTypes: false };
		const { id, slug: generatedSlug } = getContentEntryIdAndSlug({ entry, contentDir, collection });

		const collectionKey = JSON.stringify(collection);
		if (!(collectionKey in collectionEntryMap)) {
			collectionEntryMap[collectionKey] = { type: 'content', entries: {} };
		}
		const collectionInfo = collectionEntryMap[collectionKey];
		if (collectionInfo.type === 'data') {
			viteServer.ws.send({
				type: 'error',
				err: new AstroError({
					...AstroErrorData.MixedContentDataCollectionError,
					message: AstroErrorData.MixedContentDataCollectionError.message(collectionKey),
					location: { file: entry.pathname },
				}) as any,
			});
			return { shouldGenerateTypes: false };
		}
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
				if (!(entryKey in collectionEntryMap[collectionKey].entries)) {
					collectionEntryMap[collectionKey] = {
						type: 'content',
						entries: { ...collectionInfo.entries, [entryKey]: { slug: addedSlug } },
					};
				}
				return { shouldGenerateTypes: true };
			case 'unlink':
				if (
					collectionKey in collectionEntryMap &&
					entryKey in collectionEntryMap[collectionKey].entries
				) {
					delete collectionEntryMap[collectionKey].entries[entryKey];
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
				const entryMetadata = collectionInfo.entries[entryKey];
				if (entryMetadata?.slug !== changedSlug) {
					collectionInfo.entries[entryKey].slug = changedSlug;
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
				collectionEntryMap,
				contentPaths,
				typeTemplateContent,
				contentConfig: observable.status === 'loaded' ? observable.config : undefined,
				contentEntryTypes: settings.contentEntryTypes,
				viteServer,
			});
			invalidateVirtualMod(viteServer);
			if (observable.status === 'loaded' && ['info', 'warn'].includes(logLevel)) {
				warnNonexistentCollections({
					logging,
					contentConfig: observable.config,
					collectionEntryMap,
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

async function writeContentFiles({
	fs,
	contentPaths,
	collectionEntryMap,
	typeTemplateContent,
	contentEntryTypes,
	contentConfig,
	viteServer,
}: {
	fs: typeof fsMod;
	contentPaths: ContentPaths;
	collectionEntryMap: CollectionEntryMap;
	typeTemplateContent: string;
	contentEntryTypes: Pick<ContentEntryType, 'contentModuleTypes'>[];
	contentConfig?: ContentConfig;
	viteServer: Pick<ViteDevServer, 'ws'>;
}) {
	let contentTypesStr = '';
	let dataTypesStr = '';
	for (const collectionKey of Object.keys(collectionEntryMap).sort()) {
		const collectionConfig = contentConfig?.collections[JSON.parse(collectionKey)];
		const collection = collectionEntryMap[collectionKey];
		if (collectionConfig?.type && collection.type !== collectionConfig.type) {
			viteServer.ws.send({
				type: 'error',
				err: new AstroError({
					...AstroErrorData.ContentCollectionTypeMismatchError,
					message: AstroErrorData.ContentCollectionTypeMismatchError.message(
						collectionKey,
						collection.type,
						collectionConfig.type
					),
					hint:
						collection.type === 'data'
							? "Try adding `type: 'data'` to your collection config."
							: undefined,
					location: { file: '' /** required for error overlay `ws` messages */ },
				}) as any,
			});
			return;
		}
		switch (collection.type) {
			case 'content':
				contentTypesStr += `${collectionKey}: {\n`;
				for (const entryKey of Object.keys(collection.entries).sort()) {
					const entryMetadata = collection.entries[entryKey];
					const dataType = collectionConfig?.schema ? `InferEntrySchema<${collectionKey}>` : 'any';
					const renderType = `{ render(): Render[${JSON.stringify(
						path.extname(JSON.parse(entryKey))
					)}] }`;

					const slugType = JSON.stringify(entryMetadata.slug);
					contentTypesStr += `${entryKey}: {\n	id: ${entryKey};\n  slug: ${slugType};\n  body: string;\n  collection: ${collectionKey};\n  data: ${dataType}\n} & ${renderType};\n`;
				}
				contentTypesStr += `};\n`;
				break;
			case 'data':
			// Add empty / unknown collections to the data type map by default
			// This ensures `getCollection('empty-collection')` doesn't raise a type error
			case 'unknown':
				dataTypesStr += `${collectionKey}: {\n`;
				for (const entryKey of Object.keys(collection.entries).sort()) {
					const dataType = collectionConfig?.schema ? `InferEntrySchema<${collectionKey}>` : 'any';
					dataTypesStr += `${entryKey}: {\n	id: ${entryKey};\n  collection: ${collectionKey};\n  data: ${dataType}\n};\n`;
				}
				dataTypesStr += `};\n`;
				break;
		}
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
	collectionEntryMap,
	logging,
}: {
	contentConfig: ContentConfig;
	collectionEntryMap: CollectionEntryMap;
	logging: LogOptions;
}) {
	for (const configuredCollection in contentConfig.collections) {
		if (!collectionEntryMap[JSON.stringify(configuredCollection)]) {
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
