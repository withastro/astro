import type fsMod from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import colors from 'piccolore';
import {
	type DevEnvironment,
	isRunnableDevEnvironment,
	normalizePath,
	type RunnableDevEnvironment,
	type ViteDevServer,
} from 'vite';
import type { StandardSchemaV1 } from '@standard-schema/spec';
import * as z from 'zod/v4';
import type { JSONSchemaCapableSchema } from './config.js';
import { AstroError } from '../core/errors/errors.js';
import { AstroErrorData } from '../core/errors/index.js';
import type { AstroLogger } from '../core/logger/core.js';
import { isRelativePath } from '../core/path.js';
import type { AstroSettings } from '../types/astro.js';
import type { ContentEntryType } from '../types/public/content.js';
import type { InjectedType } from '../types/public/integrations.js';
import {
	COLLECTIONS_DIR,
	CONTENT_LAYER_TYPE,
	CONTENT_TYPES_FILE,
	type LIVE_CONTENT_TYPE,
	VIRTUAL_MODULE_ID,
} from './consts.js';
import {
	type CollectionConfig,
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
import { ASTRO_VITE_ENVIRONMENT_NAMES } from '../core/constants.js';

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
				type: 'data' | typeof CONTENT_LAYER_TYPE;
				entries: Record<string, DataEntryMetadata>;
		  }
		| {
				type: typeof LIVE_CONTENT_TYPE;
				entries: Record<string, never>;
		  };
};

type CreateContentGeneratorParams = {
	contentConfigObserver: ContentObservable;
	logger: AstroLogger;
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
	const contentPaths = getContentPaths(
		settings.config,
		fs,
		settings.config.legacy?.collectionsBackwardsCompat,
	);
	const contentEntryConfigByExt = getEntryConfigByExtMap(settings.contentEntryTypes);
	const contentEntryExts = [...contentEntryConfigByExt.keys()];
	const dataEntryExts = getDataEntryExts(settings);

	let events: ContentEvent[] = [];
	let debounceTimeout: NodeJS.Timeout | undefined;

	const typeTemplateContent = await fs.promises.readFile(contentPaths.typesTemplate, 'utf-8');

	async function init(): Promise<void> {
		events.push({ name: 'add', entry: contentPaths.config.url });
		await runEvents();
	}

	async function handleEvent(event: ContentEvent): Promise<{ shouldGenerateTypes: boolean }> {
		if (event.name === 'addDir' || event.name === 'unlinkDir') {
			const collection = normalizePath(
				path.relative(fileURLToPath(contentPaths.contentDir), fileURLToPath(event.entry)),
			);
			const collectionKey = JSON.stringify(collection);
			// If directory is multiple levels deep, it is not a collection. Ignore event.
			const isCollectionEvent = collection.split('/').length === 1;
			if (!isCollectionEvent) return { shouldGenerateTypes: false };

			switch (event.name) {
				case 'addDir':
					collectionEntryMap[collectionKey] = {
						type: 'unknown',
						entries: {},
					};
					logger.debug('content', `${colors.cyan(collection)} collection added`);
					break;
				case 'unlinkDir':
					delete collectionEntryMap[collectionKey];
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
				environment: viteServer.environments[
					ASTRO_VITE_ENVIRONMENT_NAMES.astro
				] as RunnableDevEnvironment,
			});
			return { shouldGenerateTypes: true };
		}

		const { entry } = event;
		const { contentDir } = contentPaths;

		const collection = getEntryCollectionName({ entry, contentDir });
		if (collection === undefined) {
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
						viteServer.environments.client.hot.send({
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
			viteServer.environments.client.hot.send({
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
							...(collectionInfo.entries as Record<string, ContentEntryMetadata>),
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

		if (contentPaths.config.url.pathname !== event.entry.pathname) {
			return;
		}

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
			if (!isRunnableDevEnvironment(viteServer.environments[ASTRO_VITE_ENVIRONMENT_NAMES.ssr])) {
				return;
			}
			invalidateVirtualMod(viteServer.environments[ASTRO_VITE_ENVIRONMENT_NAMES.ssr]);
		}
	}
	return { init, queueEvent };
}

// The virtual module contains a lookup map from slugs to content imports.
// Invalidate whenever content types change.
function invalidateVirtualMod(environment: DevEnvironment) {
	const virtualMod = environment.moduleGraph.getModuleById('\0' + VIRTUAL_MODULE_ID);
	if (!virtualMod) return;

	environment.moduleGraph.invalidateModule(virtualMod);
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

const createSchemaResultCache = new Map<string, { schema: StandardSchemaV1; types: string }>();

async function getCreateSchemaResult<T extends keyof ContentConfig['collections']>(
	collection: ContentConfig['collections'][T],
	collectionKey: T,
) {
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

async function getContentLayerSchema<T extends keyof ContentConfig['collections']>(
	collection: ContentConfig['collections'][T],
	collectionKey: T,
): Promise<StandardSchemaV1 | undefined> {
	if (collection?.type !== CONTENT_LAYER_TYPE || typeof collection.loader === 'function') {
		return;
	}
	if (collection.loader.schema) {
		return collection.loader.schema;
	}
	const result = await getCreateSchemaResult(collection, collectionKey);
	return result?.schema;
}

/**
 * The type of one collection's entries in the generated `DataMap`. Every collection gets a
 * member, so that the collection names are known without resolving the config — see the note on
 * `InferCollectionData` in `astro/types/content.d.ts` — but the type behind each name is
 * inferred from the config rather than written out, in all but two cases:
 *
 * - a collection that exists as a directory under `src/content/` but is missing from the
 *   config, which has no schema to infer from, and
 * - a loader that builds its schema while loading (`createSchema()`), whose types are generated
 *   here and written to a file of their own.
 */
async function typeForCollection<T extends keyof ContentConfig['collections']>(
	collection: ContentConfig['collections'][T] | undefined,
	collectionKey: T,
): Promise<{ type: string; injectedType?: InjectedType }> {
	if (!collection) {
		// Not in the config, so nothing describes its data.
		return { type: 'any' };
	}
	const inferred = { type: `InferCollectionData<ContentConfig, ${collectionKey}>` };
	if (
		collection.schema ||
		!collection.type ||
		typeof collection.loader === 'function' ||
		!collection.loader ||
		collection.loader.schema
	) {
		return inferred;
	}
	const result = await getCreateSchemaResult(collection, collectionKey);
	if (!result) {
		// A loader with no schema of any kind. Inference types it as `any`.
		return inferred;
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
}: {
	fs: typeof fsMod;
	contentPaths: ContentPaths;
	collectionEntryMap: CollectionEntryMap;
	typeTemplateContent: string;
	contentEntryTypes: Pick<ContentEntryType, 'contentModuleTypes'>[];
	contentConfig?: ContentConfig;
	viteServer: ViteDevServer;
	logger: AstroLogger;
	settings: AstroSettings;
}) {
	let dataMapStr = '';

	const collectionSchemasDir = new URL(COLLECTIONS_DIR, settings.dotAstroDir);
	fs.mkdirSync(collectionSchemasDir, { recursive: true });

	for (const [collection, config] of Object.entries(contentConfig?.collections ?? {})) {
		collectionEntryMap[JSON.stringify(collection)] ??= {
			type: config.type ?? 'unknown',
			entries: {},
		};
	}

	let contentCollectionsMap: CollectionEntryMap = {};
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
							: undefined,
					location: {
						file: '' /** required for error overlay `hot` messages */,
					},
				}) as any,
			});
			return;
		}

		const { type, injectedType } = await typeForCollection(collectionConfig, collectionKey);

		if (injectedType) {
			if (settings.injectedTypes.some((t) => t.filename === CONTENT_TYPES_FILE)) {
				// If it's the first time, we inject types the usual way. sync() will handle creating files and references. If it's not the first time, we just override the dts content
				const url = new URL(injectedType.filename, settings.dotAstroDir);
				await fs.promises.mkdir(path.dirname(fileURLToPath(url)), { recursive: true });
				await fs.promises.writeFile(url, injectedType.content, 'utf-8');
			} else {
				settings.injectedTypes.push(injectedType);
			}
		}

		dataMapStr += `\n\t\t${collectionKey}: ${type};`;

		if (
			collectionConfig &&
			(collectionConfig.schema || (await getContentLayerSchema(collectionConfig, collectionKey)))
		) {
			await generateJSONSchema(fs, collectionConfig, collectionKey, collectionSchemasDir, logger);

			contentCollectionsMap[collectionKey] = collection;
		}
	}

	if (settings.config.experimental.contentIntellisense) {
		let contentCollectionManifest: {
			collections: { hasSchema: boolean; name: string }[];
			entries: Record<string, string>;
		} = {
			collections: [],
			entries: {},
		};
		Object.entries(contentCollectionsMap).forEach(([collectionKey, collection]) => {
			const collectionConfig = contentConfig?.collections[JSON.parse(collectionKey)];
			const key = JSON.parse(collectionKey);

			contentCollectionManifest.collections.push({
				hasSchema: Boolean(
					// Is there a user provided schema or
					collectionConfig?.schema ||
						// Is it a loader object and
						(typeof collectionConfig?.loader === 'object' &&
							// Is it a loader static schema or
							(collectionConfig.loader.schema ||
								// is it a loader dynamic schema
								createSchemaResultCache.has(collectionKey))),
				),
				name: key,
			});

			Object.keys(collection.entries).forEach((entryKey) => {
				const entryPath = new URL(
					JSON.parse(entryKey),
					contentPaths.contentDir + `${key}/`,
				).toString();

				// Save entry path in lowercase to avoid case sensitivity issues between Windows and Unix
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
		: undefined;

	for (const contentEntryType of contentEntryTypes) {
		if (contentEntryType.contentModuleTypes) {
			typeTemplateContent = contentEntryType.contentModuleTypes + '\n' + typeTemplateContent;
		}
	}
	typeTemplateContent = typeTemplateContent
		.replace('@@DATA_MAP@@', dataMapStr ? `${dataMapStr}\n\t` : '')
		// Live collections are not read at sync time, so their names cannot be written out the
		// way `DataMap`'s are. Nothing calls into `LiveDataMap` from inside a live config, so
		// inferring the whole map is safe here.
		.replace(
			'@@LIVE_DATA_MAP_BASE@@',
			liveConfigPathRelativeToCacheDir ? ' extends InferLiveData<LiveContentConfig>' : '',
		)
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

	// If it's the first time, we inject types the usual way. sync() will handle creating files and references. If it's not the first time, we just override the dts content
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

const JSON_SCHEMA_TARGET = 'draft-2020-12';

/**
 * Whether a schema can describe itself as JSON Schema (https://standardschema.dev/json-schema).
 * It is an optional part of the spec, so validators that do not implement it simply get no
 * generated `.schema.json`.
 */
function hasJsonSchema(schema: unknown): schema is JSONSchemaCapableSchema {
	return typeof (schema as any)?.['~standard']?.jsonSchema?.input === 'function';
}

/**
 * Per-validator tuning, passed through `libraryOptions`, which the Standard JSON Schema spec
 * reserves for vendor-specific parameters. Two things are worth making consistent across
 * validators, because both are the default everywhere else in Astro:
 *
 * - A type with no JSON representation degrades to `{}` instead of aborting the conversion,
 *   so one such field does not cost the collection its whole `.schema.json`.
 * - A date is described as the ISO string a data file actually holds.
 *
 * A validator with no entry here is converted with its own defaults.
 */
function getLibraryOptions(vendor: string): Record<string, unknown> | undefined {
	switch (vendor) {
		// https://zod.dev/json-schema#ztojsonschema
		case 'zod':
			return {
				// Types with no JSON representation become `{}` instead of throwing.
				unrepresentable: 'any',
				override: (ctx: any) => {
					// Dates are written as strings in data files, so describe them as such.
					if (ctx.zodSchema?._zod?.def?.type === 'date') {
						ctx.jsonSchema.type = 'string';
						ctx.jsonSchema.format = 'date-time';
					}
				},
			};
		// https://github.com/open-circle/valibot/blob/main/packages/to-json-schema/README.md#configurations
		// Valibot converts through a separate package, so a Valibot schema only reaches this
		// point when it has been wrapped in `toStandardJsonSchema()` from
		// `@valibot/to-json-schema`.
		case 'valibot':
			return {
				errorMode: 'ignore',
				overrideSchema: (ctx: any) =>
					ctx.valibotSchema?.type === 'date'
						? { type: 'string', format: 'date-time' }
						: // Anything else keeps Valibot's own conversion.
							undefined,
			};
		// https://arktype.io/docs/configuration#tojsonschema
		case 'arktype':
			return {
				fallback: {
					// `ctx.base` is the schema built so far, so returning it ignores the constraint
					// that could not be represented.
					default: (ctx: any) => ctx.base,
					date: (ctx: any) => ({ ...ctx.base, type: 'string', format: 'date-time' }),
				},
			};
		default:
			return undefined;
	}
}

async function generateJSONSchema(
	fsMod: typeof import('node:fs'),
	collectionConfig: CollectionConfig,
	collectionKey: string,
	collectionSchemasDir: URL,
	logger: AstroLogger,
) {
	let collectionSchema =
		typeof collectionConfig.schema === 'function'
			? collectionConfig.schema({
					// The schema factory is called once per collection to get its shape, not to parse
					// an entry, so there is no file to point at — and nothing reads this, since
					// transforms do not run during conversion. `''` is the same sentinel
					// `parseData()` uses for a loader that provides no path, and `image()` treats a
					// non-absolute path as "nothing to resolve against". Naming a real file here —
					// the content config, say — would be worse than naming none: `image()` resolves
					// sources relative to the *entry*, so it would resolve against the wrong
					// directory.
					filePath: '',
					// Deprecated `({ image })` form. Only the input shape matters here, and an image
					// is referenced by path in a data file.
					image: () => z.string() as any,
				})
			: collectionConfig.schema;

	if (!collectionSchema && collectionConfig.type === CONTENT_LAYER_TYPE) {
		collectionSchema = await getContentLayerSchema(collectionConfig, collectionKey);
	}

	if (!hasJsonSchema(collectionSchema)) {
		logger.debug(
			'content',
			`The schema for the ${collectionKey} collection cannot be converted to JSON Schema, so no \`.schema.json\` file was generated for it. Its validator does not implement https://standardschema.dev/json-schema.`,
		);
		return;
	}

	try {
		// `$schema` names the JSON Schema dialect and `$defs` holds definitions that `$ref`s
		// resolve against the document root, so both have to stay at the top level when the
		// generated schema is wrapped below.
		const {
			$schema: dialect,
			$defs,
			...jsonSchema
		} = collectionSchema['~standard'].jsonSchema.input({
			target: JSON_SCHEMA_TARGET,
			libraryOptions: getLibraryOptions(collectionSchema['~standard'].vendor),
		});

		let schema: Record<string, any>;
		if (
			collectionConfig.type === CONTENT_LAYER_TYPE &&
			collectionConfig.loader.name === 'file-loader'
		) {
			// The `file()` loader uses a schema which applies to every item in the file rather than
			// a schema for the whole file. We special case this to provide the correct JSON schema
			// to users.
			// TODO: it would be nice if loaders could indicate this behavior so it wasn't unique to
			// the built-in loader.
			//
			// `file()` supports both top-level arrays and record objects. Generate an anyOf schema
			// so VS Code validates correctly regardless of which shape the source file uses.
			// `$schema` is injected into the object branch only — top-level array JSON files cannot
			// reference a schema property per the JSON Schema spec.
			schema = {
				anyOf: [
					{ type: 'array', items: jsonSchema },
					{
						type: 'object',
						properties: { $schema: { type: 'string' } },
						additionalProperties: jsonSchema,
					},
				],
			};
		} else {
			schema = jsonSchema;
			// Let the data file point at this schema without failing its own validation.
			if (schema.type === 'object') {
				schema.properties = { ...schema.properties, $schema: { type: 'string' } };
			}
		}

		if ($defs) {
			schema = { $defs, ...schema };
		}
		if (dialect) {
			schema = { $schema: dialect, ...schema };
		}

		const schemaStr = JSON.stringify(schema, null, 2);
		const schemaJsonPath = new URL(
			`./${collectionKey.replace(/"/g, '')}.schema.json`,
			collectionSchemasDir,
		);
		await fsMod.promises.writeFile(schemaJsonPath, schemaStr);
	} catch (err) {
		// This should error gracefully and not crash the dev server
		logger.warn(
			'content',
			`An error was encountered while creating the JSON schema for the ${collectionKey} collection. Proceeding without it. Error: ${err}`,
		);
	}
}
