import * as path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import colors from 'piccolore';
import { isRunnableDevEnvironment, normalizePath } from 'vite';
import * as z from 'zod/v4';
import { AstroError } from '../core/errors/errors.js';
import { AstroErrorData } from '../core/errors/index.js';
import { isRelativePath } from '../core/path.js';
import {
	COLLECTIONS_DIR,
	CONTENT_LAYER_TYPE,
	CONTENT_TYPES_FILE,
	VIRTUAL_MODULE_ID,
} from './consts.js';
import {
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
import { ASTRO_VITE_ENVIRONMENT_NAMES } from '../core/constants.js';
async function createContentTypesGenerator({
	contentConfigObserver,
	fs,
	logger,
	settings,
	viteServer,
}) {
	const collectionEntryMap = {};
	const contentPaths = getContentPaths(
		settings.config,
		fs,
		settings.config.legacy?.collectionsBackwardsCompat,
	);
	const contentEntryConfigByExt = getEntryConfigByExtMap(settings.contentEntryTypes);
	const contentEntryExts = [...contentEntryConfigByExt.keys()];
	const dataEntryExts = getDataEntryExts(settings);
	let events = [];
	let debounceTimeout;
	const typeTemplateContent = await fs.promises.readFile(contentPaths.typesTemplate, 'utf-8');
	async function init() {
		events.push({ name: 'add', entry: contentPaths.config.url });
		await runEvents();
	}
	async function handleEvent(event) {
		if (event.name === 'addDir' || event.name === 'unlinkDir') {
			const collection2 = normalizePath(
				path.relative(fileURLToPath(contentPaths.contentDir), fileURLToPath(event.entry)),
			);
			const collectionKey2 = JSON.stringify(collection2);
			const isCollectionEvent = collection2.split('/').length === 1;
			if (!isCollectionEvent) return { shouldGenerateTypes: false };
			switch (event.name) {
				case 'addDir':
					collectionEntryMap[collectionKey2] = {
						type: 'unknown',
						entries: {},
					};
					logger.debug('content', `${colors.cyan(collection2)} collection added`);
					break;
				case 'unlinkDir':
					delete collectionEntryMap[collectionKey2];
					break;
			}
			return { shouldGenerateTypes: true };
		}
		const fileType = getEntryType(
			fileURLToPath(event.entry),
			contentPaths,
			contentEntryExts,
			dataEntryExts,
		);
		if (fileType === 'ignored') {
			return { shouldGenerateTypes: false };
		}
		if (fileType === 'config') {
			await reloadContentConfigObserver({
				fs,
				settings,
				environment: viteServer.environments[ASTRO_VITE_ENVIRONMENT_NAMES.astro],
			});
			return { shouldGenerateTypes: true };
		}
		const { entry } = event;
		const { contentDir } = contentPaths;
		const collection = getEntryCollectionName({ entry, contentDir });
		if (collection === void 0) {
			logger.warn(
				'content',
				`${colors.bold(
					normalizePath(
						path.relative(fileURLToPath(contentPaths.contentDir), fileURLToPath(event.entry)),
					),
				)} must live in a ${colors.bold('content/...')} collection subdirectory.`,
			);
			return { shouldGenerateTypes: false };
		}
		if (fileType === 'data') {
			const id2 = getDataEntryId({ entry, contentDir, collection });
			const collectionKey2 = JSON.stringify(collection);
			const entryKey2 = JSON.stringify(id2);
			switch (event.name) {
				case 'add':
					if (!(collectionKey2 in collectionEntryMap)) {
						collectionEntryMap[collectionKey2] = { type: 'data', entries: {} };
					}
					const collectionInfo2 = collectionEntryMap[collectionKey2];
					if (collectionInfo2.type === 'content') {
						viteServer.environments.client.hot.send({
							type: 'error',
							err: new AstroError({
								...AstroErrorData.MixedContentDataCollectionError,
								message: AstroErrorData.MixedContentDataCollectionError.message(collectionKey2),
								location: { file: entry.pathname },
							}),
						});
						return { shouldGenerateTypes: false };
					}
					if (!(entryKey2 in collectionEntryMap[collectionKey2])) {
						collectionEntryMap[collectionKey2] = {
							type: 'data',
							entries: { ...collectionInfo2.entries, [entryKey2]: {} },
						};
					}
					return { shouldGenerateTypes: true };
				case 'unlink':
					if (
						collectionKey2 in collectionEntryMap &&
						entryKey2 in collectionEntryMap[collectionKey2].entries
					) {
						delete collectionEntryMap[collectionKey2].entries[entryKey2];
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
			viteServer.environments.client.hot.send({
				type: 'error',
				err: new AstroError({
					...AstroErrorData.MixedContentDataCollectionError,
					message: AstroErrorData.MixedContentDataCollectionError.message(collectionKey),
					location: { file: entry.pathname },
				}),
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
	function queueEvent(rawEvent) {
		const event = {
			entry: pathToFileURL(rawEvent.entry),
			name: rawEvent.name,
		};
		if (contentPaths.config.url.pathname !== event.entry.pathname) {
			return;
		}
		events.push(event);
		debounceTimeout && clearTimeout(debounceTimeout);
		const runEventsSafe = async () => {
			try {
				await runEvents();
			} catch {}
		};
		debounceTimeout = setTimeout(
			runEventsSafe,
			50,
			/* debounce to batch chokidar events */
		);
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
				contentConfig: observable.status === 'loaded' ? observable.config : void 0,
				contentEntryTypes: settings.contentEntryTypes,
				viteServer,
				logger,
				settings,
			});
			if (!isRunnableDevEnvironment(viteServer.environments[ASTRO_VITE_ENVIRONMENT_NAMES.ssr])) {
				return;
			}
			invalidateVirtualMod(viteServer.environments[ASTRO_VITE_ENVIRONMENT_NAMES.ssr]);
		}
	}
	return { init, queueEvent };
}
function invalidateVirtualMod(environment) {
	const virtualMod = environment.moduleGraph.getModuleById('\0' + VIRTUAL_MODULE_ID);
	if (!virtualMod) return;
	environment.moduleGraph.invalidateModule(virtualMod);
}
function normalizeConfigPath(from, to) {
	const configPath = path.relative(from, to).replace(/\.ts$/, '.js');
	const normalizedPath = configPath.replaceAll('\\', '/');
	return `"${isRelativePath(configPath) ? '' : './'}${normalizedPath}"`;
}
const createSchemaResultCache = /* @__PURE__ */ new Map();
async function getCreateSchemaResult(collection, collectionKey) {
	const cached = createSchemaResultCache.get(collectionKey);
	if (cached) {
		return cached;
	}
	if (
		collection?.type === CONTENT_LAYER_TYPE &&
		typeof collection.loader === 'object' &&
		!collection.loader.schema &&
		collection.loader.createSchema
	) {
		const result = await collection.loader.createSchema();
		createSchemaResultCache.set(collectionKey, result);
		return result;
	}
}
async function getContentLayerSchema(collection, collectionKey) {
	if (collection?.type !== CONTENT_LAYER_TYPE || typeof collection.loader === 'function') {
		return;
	}
	if (collection.loader.schema) {
		return collection.loader.schema;
	}
	const result = await getCreateSchemaResult(collection, collectionKey);
	return result?.schema;
}
async function typeForCollection(collection, collectionKey) {
	if (collection?.schema) {
		return { type: `InferEntrySchema<${collectionKey}>` };
	}
	if (!collection?.type || typeof collection.loader === 'function' || !collection.loader) {
		return { type: 'any' };
	}
	if (typeof collection.loader === 'object' && collection.loader.schema) {
		return { type: `InferLoaderSchema<${collectionKey}>` };
	}
	const result = await getCreateSchemaResult(collection, collectionKey);
	if (!result) {
		return { type: 'any' };
	}
	const base = `loaders/${collectionKey.slice(1, -1)}`;
	return {
		type: `import("./${base}.js").Entry`,
		injectedType: {
			filename: `${base}.ts`,
			content: result.types,
		},
	};
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
}) {
	let dataTypesStr = '';
	const collectionSchemasDir = new URL(COLLECTIONS_DIR, settings.dotAstroDir);
	fs.mkdirSync(collectionSchemasDir, { recursive: true });
	for (const [collection, config] of Object.entries(contentConfig?.collections ?? {})) {
		collectionEntryMap[JSON.stringify(collection)] ??= {
			type: config.type ?? 'unknown',
			entries: {},
		};
	}
	let contentCollectionsMap = {};
	for (const collectionKey of Object.keys(collectionEntryMap).sort()) {
		const collectionConfig = contentConfig?.collections[JSON.parse(collectionKey)];
		const collection = collectionEntryMap[collectionKey];
		if (
			collectionConfig?.type &&
			collection.type !== 'unknown' &&
			collectionConfig.type !== CONTENT_LAYER_TYPE &&
			collection.type !== collectionConfig.type
		) {
			viteServer.environments.client.hot.send({
				type: 'error',
				err: new AstroError({
					...AstroErrorData.ContentCollectionTypeMismatchError,
					message: AstroErrorData.ContentCollectionTypeMismatchError.message(
						collectionKey,
						collection.type,
						collectionConfig.type,
					),
					hint:
						collection.type === 'data'
							? "Try adding `type: 'data'` to your collection config."
							: void 0,
					location: {
						file: '',
					},
				}),
			});
			return;
		}
		const { type: dataType, injectedType } = await typeForCollection(
			collectionConfig,
			collectionKey,
		);
		if (injectedType) {
			if (settings.injectedTypes.some((t) => t.filename === CONTENT_TYPES_FILE)) {
				const url = new URL(injectedType.filename, settings.dotAstroDir);
				await fs.promises.mkdir(path.dirname(fileURLToPath(url)), { recursive: true });
				await fs.promises.writeFile(url, injectedType.content, 'utf-8');
			} else {
				settings.injectedTypes.push(injectedType);
			}
		}
		dataTypesStr += `${collectionKey}: Record<string, {
  id: string;
  body?: string;
  collection: ${collectionKey};
  data: ${dataType};
  rendered?: RenderedContent;
  filePath?: string;
}>;
`;
		if (
			collectionConfig &&
			(collectionConfig.schema || (await getContentLayerSchema(collectionConfig, collectionKey)))
		) {
			await generateJSONSchema(fs, collectionConfig, collectionKey, collectionSchemasDir, logger);
			contentCollectionsMap[collectionKey] = collection;
		}
	}
	if (settings.config.experimental.contentIntellisense) {
		let contentCollectionManifest = {
			collections: [],
			entries: {},
		};
		Object.entries(contentCollectionsMap).forEach(([collectionKey, collection]) => {
			const collectionConfig = contentConfig?.collections[JSON.parse(collectionKey)];
			const key = JSON.parse(collectionKey);
			contentCollectionManifest.collections.push({
				hasSchema: Boolean(
					// Is there a user provided schema or
					collectionConfig?.schema || // Is it a loader object and
					(typeof collectionConfig?.loader === 'object' && // Is it a loader static schema or
						(collectionConfig.loader.schema || // is it a loader dynamic schema
							createSchemaResultCache.has(collectionKey))),
				),
				name: key,
			});
			Object.keys(collection.entries).forEach((entryKey) => {
				const entryPath = new URL(
					JSON.parse(entryKey),
					contentPaths.contentDir + `${key}/`,
				).toString();
				contentCollectionManifest.entries[entryPath.toLowerCase()] = key;
			});
		});
		await fs.promises.writeFile(
			new URL('./collections.json', collectionSchemasDir),
			JSON.stringify(contentCollectionManifest, null, 2),
		);
	}
	const configPathRelativeToCacheDir = normalizeConfigPath(
		settings.dotAstroDir.pathname,
		contentPaths.config.url.pathname,
	);
	const liveConfigPathRelativeToCacheDir = contentPaths.liveConfig?.exists
		? normalizeConfigPath(settings.dotAstroDir.pathname, contentPaths.liveConfig.url.pathname)
		: void 0;
	for (const contentEntryType of contentEntryTypes) {
		if (contentEntryType.contentModuleTypes) {
			typeTemplateContent = contentEntryType.contentModuleTypes + '\n' + typeTemplateContent;
		}
	}
	typeTemplateContent = typeTemplateContent
		.replace('// @@DATA_ENTRY_MAP@@', dataTypesStr)
		.replace(
			"'@@CONTENT_CONFIG_TYPE@@'",
			contentConfig ? `typeof import(${configPathRelativeToCacheDir})` : 'never',
		)
		.replace(
			"'@@LIVE_CONTENT_CONFIG_TYPE@@'",
			liveConfigPathRelativeToCacheDir
				? `typeof import(${liveConfigPathRelativeToCacheDir})`
				: 'never',
		);
	if (settings.injectedTypes.some((t) => t.filename === CONTENT_TYPES_FILE)) {
		await fs.promises.writeFile(
			new URL(CONTENT_TYPES_FILE, settings.dotAstroDir),
			typeTemplateContent,
			'utf-8',
		);
	} else {
		settings.injectedTypes.push({
			filename: CONTENT_TYPES_FILE,
			content: typeTemplateContent,
		});
	}
}
async function generateJSONSchema(
	fsMod,
	collectionConfig,
	collectionKey,
	collectionSchemasDir,
	logger,
) {
	let zodSchemaForJson =
		typeof collectionConfig.schema === 'function'
			? collectionConfig.schema({ image: () => z.string() })
			: collectionConfig.schema;
	if (!zodSchemaForJson && collectionConfig.type === CONTENT_LAYER_TYPE) {
		zodSchemaForJson = await getContentLayerSchema(collectionConfig, collectionKey);
	}
	if (
		collectionConfig.type === CONTENT_LAYER_TYPE &&
		collectionConfig.loader.name === 'file-loader'
	) {
		zodSchemaForJson = z.object({}).catchall(zodSchemaForJson);
	}
	if (zodSchemaForJson instanceof z.ZodObject) {
		const existingMeta = z.globalRegistry.get(zodSchemaForJson);
		zodSchemaForJson = zodSchemaForJson.extend({
			$schema: z.string().optional(),
		});
		if (existingMeta) {
			z.globalRegistry.add(zodSchemaForJson, existingMeta);
		}
	}
	try {
		const schema = z.toJSONSchema(zodSchemaForJson, {
			unrepresentable: 'any',
			override: (ctx) => {
				const def = ctx.zodSchema._zod.def;
				if (def.type === 'date') {
					ctx.jsonSchema.type = 'string';
					ctx.jsonSchema.format = 'date-time';
				}
			},
			// Collection schemas are used for parsing collection input, so we need to tell Zod to use the
			// input shape when generating a JSON schema.
			io: 'input',
		});
		const schemaStr = JSON.stringify(schema, null, 2);
		const schemaJsonPath = new URL(
			`./${collectionKey.replace(/"/g, '')}.schema.json`,
			collectionSchemasDir,
		);
		await fsMod.promises.writeFile(schemaJsonPath, schemaStr);
	} catch (err) {
		logger.warn(
			'content',
			`An error was encountered while creating the JSON schema for the ${collectionKey} collection. Proceeding without it. Error: ${err}`,
		);
	}
}
export { createContentTypesGenerator };
