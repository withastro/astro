import type fsMod from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import glob from 'fast-glob';
import { bold, cyan } from 'kleur/colors';
import { type ViteDevServer, normalizePath } from 'vite';
import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';
import type { AstroSettings, ContentEntryType } from '../@types/astro.js';
import { AstroError } from '../core/errors/errors.js';
import { AstroErrorData } from '../core/errors/index.js';
import type { Logger } from '../core/logger/core.js';
import { isRelativePath } from '../core/path.js';
import { CONTENT_TYPES_FILE, VIRTUAL_MODULE_ID } from './consts.js';
import {
	type ContentConfig,
	type ContentObservable,
	type ContentPaths,
	getContentEntryIdAndSlug,
	getContentPaths,
	getDataEntryExts,
	getDataEntryId,
	getEntryCollectionName,
	getEntryConfigByExtMap,
	getEntrySlug,
	getEntryType,
	reloadContentConfigObserver,
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
	logger: Logger;
	settings: AstroSettings;
	/** This is required for loading the content config */
	viteServer: ViteDevServer;
	fs: typeof fsMod;
};

export async function createContentTypesGenerator({
	contentConfigObserver,
	fs,
	logger,
	settings,
	viteServer,
}: CreateContentGeneratorParams) {
	const collectionEntryMap: CollectionEntryMap = {};
	const contentPaths = getContentPaths(settings.config, fs);
	const contentEntryConfigByExt = getEntryConfigByExtMap(settings.contentEntryTypes);
	const contentEntryExts = [...contentEntryConfigByExt.keys()];
	const dataEntryExts = getDataEntryExts(settings);

	let events: ContentEvent[] = [];
	let debounceTimeout: NodeJS.Timeout | undefined;

	const typeTemplateContent = await fs.promises.readFile(contentPaths.typesTemplate, 'utf-8');

	async function init(): Promise<
		{ typesGenerated: true } | { typesGenerated: false; reason: 'no-content-dir' }
	> {
		if (!fs.existsSync(contentPaths.contentDir)) {
			return { typesGenerated: false, reason: 'no-content-dir' };
		}

		events.push({ name: 'add', entry: contentPaths.config.url });

		const globResult = await glob('**', {
			cwd: fileURLToPath(contentPaths.contentDir),
			fs: {
				readdir: fs.readdir.bind(fs),
				readdirSync: fs.readdirSync.bind(fs),
			},
			onlyFiles: false,
			objectMode: true,
		});

		for (const entry of globResult) {
			const fullPath = path.join(fileURLToPath(contentPaths.contentDir), entry.path);
			const entryURL = pathToFileURL(fullPath);
			if (entryURL.href.startsWith(contentPaths.config.url.href)) continue;
			if (entry.dirent.isFile()) {
				events.push({ name: 'add', entry: entryURL });
			} else if (entry.dirent.isDirectory()) {
				events.push({ name: 'addDir', entry: entryURL });
			}
		}
		await runEvents();
		return { typesGenerated: true };
	}

	async function handleEvent(event: ContentEvent): Promise<{ shouldGenerateTypes: boolean }> {
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
					collectionEntryMap[JSON.stringify(collection)] = {
						type: 'unknown',
						entries: {},
					};
					logger.debug('content', `${cyan(collection)} collection added`);
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
			dataEntryExts
		);
		if (fileType === 'ignored') {
			return { shouldGenerateTypes: false };
		}
		if (fileType === 'config') {
			await reloadContentConfigObserver({ fs, settings, viteServer });
			return { shouldGenerateTypes: true };
		}

		const { entry } = event;
		const { contentDir } = contentPaths;

		const collection = getEntryCollectionName({ entry, contentDir });
		if (collection === undefined) {
			logger.warn(
				'content',
				`${bold(
					normalizePath(
						path.relative(fileURLToPath(contentPaths.contentDir), fileURLToPath(event.entry))
					)
				)} must live in a ${bold('content/...')} collection subdirectory.`
			);
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
						viteServer.hot.send({
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
		const { id, slug: generatedSlug } = getContentEntryIdAndSlug({
			entry,
			contentDir,
			collection,
		});

		const collectionKey = JSON.stringify(collection);
		if (!(collectionKey in collectionEntryMap)) {
			collectionEntryMap[collectionKey] = { type: 'content', entries: {} };
		}
		const collectionInfo = collectionEntryMap[collectionKey];
		if (collectionInfo.type === 'data') {
			viteServer.hot.send({
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
						entries: {
							...collectionInfo.entries,
							[entryKey]: { slug: addedSlug },
						},
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

	function queueEvent(rawEvent: RawContentEvent) {
		const event = {
			entry: pathToFileURL(rawEvent.entry),
			name: rawEvent.name,
		};
		if (!event.entry.pathname.startsWith(contentPaths.contentDir.pathname)) return;

		events.push(event);

		debounceTimeout && clearTimeout(debounceTimeout);
		const runEventsSafe = async () => {
			try {
				await runEvents();
			} catch {
				// Prevent frontmatter errors from crashing the server. The errors
				// are still reported on page reflects as desired.
				// Errors still crash dev from *starting*.
			}
		};
		debounceTimeout = setTimeout(runEventsSafe, 50 /* debounce to batch chokidar events */);
	}

	async function runEvents() {
		const eventResponses = [];

		for (const event of events) {
			const response = await handleEvent(event);
			eventResponses.push(response);
		}

		events = [];
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
				logger,
				settings,
			});
			invalidateVirtualMod(viteServer);
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

/**
 * Takes the source (`from`) and destination (`to`) of a config path and
 * returns a normalized relative version:
 *  -   If is not relative, it adds `./` to the beginning.
 *  -   If it ends with `.ts`, it replaces it with `.js`.
 *  -   It adds `""` around the string.
 * @param from Config path source.
 * @param to Config path destination.
 * @returns Normalized config path.
 */
function normalizeConfigPath(from: string, to: string) {
	const configPath = path.relative(from, to).replace(/\.ts$/, '.js');
	// on windows `path.relative` will use backslashes, these must be replaced with forward slashes
	const normalizedPath = configPath.replaceAll('\\', '/');

	return `"${isRelativePath(configPath) ? '' : './'}${normalizedPath}"` as const;
}

async function writeContentFiles({
	fs,
	contentPaths,
	collectionEntryMap,
	typeTemplateContent,
	contentEntryTypes,
	contentConfig,
	viteServer,
	logger,
	settings,
}: {
	fs: typeof fsMod;
	contentPaths: ContentPaths;
	collectionEntryMap: CollectionEntryMap;
	typeTemplateContent: string;
	contentEntryTypes: Pick<ContentEntryType, 'contentModuleTypes'>[];
	contentConfig?: ContentConfig;
	viteServer: Pick<ViteDevServer, 'hot'>;
	logger: Logger;
	settings: AstroSettings;
}) {
	let contentTypesStr = '';
	let dataTypesStr = '';

	const collectionSchemasDir = new URL('./collections/', contentPaths.cacheDir);
	if (
		settings.config.experimental.contentCollectionJsonSchema &&
		!fs.existsSync(collectionSchemasDir)
	) {
		fs.mkdirSync(collectionSchemasDir, { recursive: true });
	}

	for (const [collection, config] of Object.entries(contentConfig?.collections ?? {})) {
		collectionEntryMap[JSON.stringify(collection)] ??= {
			type: config.type,
			entries: {},
		};
	}
	for (const collectionKey of Object.keys(collectionEntryMap).sort()) {
		const collectionConfig = contentConfig?.collections[JSON.parse(collectionKey)];
		const collection = collectionEntryMap[collectionKey];
		if (
			collectionConfig?.type &&
			collection.type !== 'unknown' &&
			collection.type !== collectionConfig.type
		) {
			viteServer.hot.send({
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
					location: {
						file: '' /** required for error overlay `hot` messages */,
					},
				}) as any,
			});
			return;
		}
		const resolvedType: 'content' | 'data' =
			collection.type === 'unknown'
				? // Add empty / unknown collections to the data type map by default
					// This ensures `getCollection('empty-collection')` doesn't raise a type error
					collectionConfig?.type ?? 'data'
				: collection.type;

		switch (resolvedType) {
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
				dataTypesStr += `${collectionKey}: {\n`;
				for (const entryKey of Object.keys(collection.entries).sort()) {
					const dataType = collectionConfig?.schema ? `InferEntrySchema<${collectionKey}>` : 'any';
					dataTypesStr += `${entryKey}: {\n	id: ${entryKey};\n  collection: ${collectionKey};\n  data: ${dataType}\n};\n`;
					if (
						settings.config.experimental.contentCollectionJsonSchema &&
						collectionConfig?.schema
					) {
						let zodSchemaForJson =
							typeof collectionConfig.schema === 'function'
								? collectionConfig.schema({ image: () => z.string() })
								: collectionConfig.schema;
						if (zodSchemaForJson instanceof z.ZodObject) {
							zodSchemaForJson = zodSchemaForJson.extend({
								$schema: z.string().optional(),
							});
						}
						try {
							await fs.promises.writeFile(
								new URL(`./${collectionKey.replace(/"/g, '')}.schema.json`, collectionSchemasDir),
								JSON.stringify(
									zodToJsonSchema(zodSchemaForJson, {
										name: collectionKey.replace(/"/g, ''),
										markdownDescription: true,
										errorMessages: true,
									}),
									null,
									2
								)
							);
						} catch (err) {
							logger.warn(
								'content',
								`An error was encountered while creating the JSON schema for the ${entryKey} entry in ${collectionKey} collection. Proceeding without it. Error: ${err}`
							);
						}
					}
				}
				dataTypesStr += `};\n`;
				break;
		}
	}

	if (!fs.existsSync(contentPaths.cacheDir)) {
		fs.mkdirSync(contentPaths.cacheDir, { recursive: true });
	}

	const configPathRelativeToCacheDir = normalizeConfigPath(
		contentPaths.cacheDir.pathname,
		contentPaths.config.url.pathname
	);

	for (const contentEntryType of contentEntryTypes) {
		if (contentEntryType.contentModuleTypes) {
			typeTemplateContent = contentEntryType.contentModuleTypes + '\n' + typeTemplateContent;
		}
	}
	typeTemplateContent = typeTemplateContent.replace('// @@CONTENT_ENTRY_MAP@@', contentTypesStr);
	typeTemplateContent = typeTemplateContent.replace('// @@DATA_ENTRY_MAP@@', dataTypesStr);
	typeTemplateContent = typeTemplateContent.replace(
		"'@@CONTENT_CONFIG_TYPE@@'",
		contentConfig ? `typeof import(${configPathRelativeToCacheDir})` : 'never'
	);

	await fs.promises.writeFile(
		new URL(CONTENT_TYPES_FILE, contentPaths.cacheDir),
		typeTemplateContent
	);
}
