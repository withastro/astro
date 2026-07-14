import { existsSync, promises as fs } from 'node:fs';
import { parseFrontmatter } from '@astrojs/internal-helpers/frontmatter';
import type { MarkdownRenderer } from '@astrojs/internal-helpers/markdown';
import PQueue from 'p-queue';
import type { FSWatcher } from 'vite';
import xxhash from 'xxhash-wasm';
import type * as z from 'zod/v4';
import { AstroError, AstroErrorData } from '../core/errors/index.js';
import type { AstroIntegrationLogger, AstroLogger } from '../core/logger/core.js';
import type { AstroSettings } from '../types/astro.js';
import type { ContentEntryType, RefreshContentOptions } from '../types/public/content.js';
import {
	ASSET_IMPORTS_FILE,
	COLLECTIONS_MANIFEST_FILE,
	CONTENT_LAYER_TYPE,
	DATA_STORE_FILE,
	MODULES_IMPORTS_FILE,
} from './consts.js';
import type { RenderedContent } from './data-store.js';
import type { LoaderContext, RenderMarkdownOptions } from './loaders/types.js';
import type { MutableDataStore } from './mutable-data-store.js';
import { getReferenceCollection } from './reference-schema.js';
import {
	type ContentObservable,
	getEntryConfigByExtMap,
	getEntryData,
	globalContentConfigObserver,
	loaderReturnSchema,
	resolveCollectionSchema,
	safeStringify,
} from './utils.js';
import { createWatcherWrapper, type WrappedWatcher } from './watcher.js';

export interface ContentLayerOptions {
	store: MutableDataStore;
	settings: AstroSettings;
	logger: AstroLogger;
	watcher?: FSWatcher;
	contentConfigObserver?: ContentObservable;
}

type CollectionLoader<TData> = () =>
	| Array<TData>
	| Promise<Array<TData>>
	| Record<string, Record<string, unknown>>
	| Promise<Record<string, Record<string, unknown>>>;

export class ContentLayer {
	#logger: AstroLogger;
	#store: MutableDataStore;
	#settings: AstroSettings;
	#watcher?: WrappedWatcher;
	#lastConfigDigest?: string;
	#unsubscribe?: () => void;
	#markdownRenderer?: MarkdownRenderer;
	#generateDigest?: (data: Record<string, unknown> | string) => string;
	#contentConfigObserver: ContentObservable;

	#queue: PQueue;

	constructor({
		settings,
		logger,
		store,
		watcher,
		contentConfigObserver = globalContentConfigObserver,
	}: ContentLayerOptions) {
		this.#logger = logger;
		this.#store = store;
		this.#settings = settings;
		this.#contentConfigObserver = contentConfigObserver;
		if (watcher) {
			this.#watcher = createWatcherWrapper(watcher);
		}
		this.#queue = new PQueue({ concurrency: 1 });
	}

	/**
	 * Whether the content layer is currently loading content
	 */
	get loading() {
		return this.#queue.size > 0 || this.#queue.pending > 0;
	}

	/**
	 * Watch for changes to the content config and trigger a sync when it changes.
	 */
	watchContentConfig() {
		this.#unsubscribe?.();
		this.#unsubscribe = this.#contentConfigObserver.subscribe(async (ctx) => {
			if (ctx.status === 'loaded' && ctx.config.digest !== this.#lastConfigDigest) {
				this.sync();
			}
		});
	}

	unwatchContentConfig() {
		this.#unsubscribe?.();
	}

	dispose() {
		this.#queue.clear();
		this.#unsubscribe?.();
		this.#watcher?.removeAllTrackedListeners();
	}

	async #getGenerateDigest() {
		if (this.#generateDigest) {
			return this.#generateDigest;
		}
		// xxhash is a very fast non-cryptographic hash function that is used to generate a content digest
		// It uses wasm, so we need to load it asynchronously.
		const { h64ToString } = await xxhash();

		this.#generateDigest = (data: unknown) => {
			const dataString = typeof data === 'string' ? data : JSON.stringify(data);
			return h64ToString(dataString);
		};

		return this.#generateDigest;
	}

	async #getLoaderContext({
		collectionName,
		loaderName = 'content',
		parseData,
		refreshContextData,
	}: {
		collectionName: string;
		loaderName: string;
		parseData: LoaderContext['parseData'];
		refreshContextData?: Record<string, unknown>;
	}): Promise<LoaderContext> {
		return {
			collection: collectionName,
			store: this.#store.scopedStore(collectionName),
			meta: this.#store.metaStore(collectionName),
			logger: this.#logger.forkIntegrationLogger(loaderName),
			config: this.#settings.config,
			parseData,
			renderMarkdown: this.#processMarkdown.bind(this),
			generateDigest: await this.#getGenerateDigest(),
			watcher: this.#watcher,
			refreshContextData,
			entryTypes: getEntryConfigByExtMap([
				...this.#settings.contentEntryTypes,
				...this.#settings.dataEntryTypes,
			] as Array<ContentEntryType>),
		};
	}

	async #processMarkdown(
		content: string,
		options?: RenderMarkdownOptions,
	): Promise<RenderedContent> {
		if (!this.#markdownRenderer) {
			const { markdown, image } = this.#settings.config;
			this.#markdownRenderer = await markdown.processor.createRenderer({
				image,
				syntaxHighlight: markdown.syntaxHighlight,
				shikiConfig: markdown.shikiConfig,
				gfm: markdown.gfm,
				smartypants: markdown.smartypants,
			});
		}
		const { frontmatter, content: body } = parseFrontmatter(content);
		const { code, metadata } = await this.#markdownRenderer.render(body, {
			frontmatter,
			fileURL: options?.fileURL,
		});
		return {
			html: code,
			metadata: {
				...metadata,
				imagePaths: (metadata.localImagePaths ?? []).concat(metadata.remoteImagePaths ?? []),
			},
		};
	}

	/**
	 * Enqueues a sync job that runs the `load()` method of each collection's loader, which will load the data and save it in the data store.
	 * The loader itself is responsible for deciding whether this will clear and reload the full collection, or
	 * perform an incremental update. After the data is loaded, the data store is written to disk. Jobs are queued,
	 * so that only one sync can run at a time. The function returns a promise that resolves when this sync job is complete.
	 */

	sync(options: RefreshContentOptions = {}): Promise<void> {
		return this.#queue.add(() => this.#doSync(options));
	}

	async #doSync(options: RefreshContentOptions) {
		let contentConfig = this.#contentConfigObserver.get();
		const logger = this.#logger.forkIntegrationLogger('content');

		if (contentConfig?.status === 'loading') {
			contentConfig = await Promise.race<ReturnType<ContentObservable['get']>>([
				new Promise((resolve) => {
					const unsub = this.#contentConfigObserver.subscribe((ctx) => {
						unsub();
						resolve(ctx);
					});
				}),
				new Promise((resolve) =>
					setTimeout(
						() =>
							resolve({ status: 'error', error: new Error('Content config loading timed out') }),
						5000,
					),
				),
			]);
		}

		switch (contentConfig?.status) {
			case 'loaded':
				// Proceed with sync
				break;
			case 'error':
				// Log error and skip sync
				logger.error(
					`Error loading content config. Skipping sync.\n${contentConfig.error.message}`,
				);
				return;
			case 'does-not-exist':
				// No content config file exists, skip sync silently
				return;
			case 'init':
			case 'loading':
			case undefined:
				// Should have loaded by now, but didn't
				logger.error(
					`Content config not loaded, skipping sync. Status was ${contentConfig?.status}`,
				);
				return;
		}

		logger.info('Syncing content');
		const {
			vite: _vite,
			integrations: _integrations,
			adapter: _adapter,
			...hashableConfig
		} = this.#settings.config;

		const astroConfigDigest = safeStringify(hashableConfig);

		const { digest: currentConfigDigest } = contentConfig.config;
		this.#lastConfigDigest = currentConfigDigest;

		let shouldClear = false;
		const previousConfigDigest = this.#store.metaStore().get('content-config-digest');
		const previousAstroConfigDigest = this.#store.metaStore().get('astro-config-digest');
		const previousAstroVersion = this.#store.metaStore().get('astro-version');

		if (previousAstroConfigDigest && previousAstroConfigDigest !== astroConfigDigest) {
			logger.info('Astro config changed');
			shouldClear = true;
		}

		if (previousConfigDigest && previousConfigDigest !== currentConfigDigest) {
			logger.info('Content config changed');
			shouldClear = true;
		}
		if (previousAstroVersion && previousAstroVersion !== process.env.ASTRO_VERSION) {
			logger.info('Astro version changed');
			shouldClear = true;
		}
		if (shouldClear) {
			logger.info('Clearing content store');
			this.#store.clearAll();
		}
		if (process.env.ASTRO_VERSION) {
			this.#store.metaStore().set('astro-version', process.env.ASTRO_VERSION);
		}
		if (currentConfigDigest) {
			this.#store.metaStore().set('content-config-digest', currentConfigDigest);
		}
		if (astroConfigDigest) {
			this.#store.metaStore().set('astro-config-digest', astroConfigDigest);
		}

		if (!options?.loaders?.length) {
			// Remove all listeners before syncing, as they will be re-added by the loaders, but not if this is a selective sync
			this.#watcher?.removeAllTrackedListeners();
		}

		const backwardsCompatEnabled =
			this.#settings.config.legacy?.collectionsBackwardsCompat ?? false;

		// Resolved collection schemas, captured so references can be validated against the
		// schema (which survives the persisted-store round-trip) rather than the parsed
		// value, once every collection has finished loading below.
		const resolvedSchemas = new Map<string, z.ZodType>();

		await Promise.all(
			Object.entries(contentConfig.config.collections).map(async ([name, collection]) => {
				// Skip non-content_layer collections unless backwards compat is enabled
				if (collection.type !== CONTENT_LAYER_TYPE && !backwardsCompatEnabled) {
					return;
				}
				// If backwards compat is disabled, skip old-style collections
				if (collection.type !== CONTENT_LAYER_TYPE && !('loader' in collection)) {
					return;
				}

				let { schema } = collection;
				const loaderName = 'loader' in collection ? (collection as any).loader.name : 'content';

				if (!schema && 'loader' in collection && typeof collection.loader === 'object') {
					schema = collection.loader.schema;
					if (!schema && collection.loader.createSchema) {
						({ schema } = await collection.loader.createSchema());
					}
				}

				// If loaders are specified, only sync the specified loaders
				if (
					options?.loaders &&
					'loader' in collection &&
					(typeof collection.loader !== 'object' ||
						!options.loaders.includes((collection as any).loader.name))
				) {
					return;
				}

				if (schema) {
					const resolved = resolveCollectionSchema({ ...collection, schema });
					if (resolved) resolvedSchemas.set(name, resolved);
				}

				const context = await this.#getLoaderContext({
					collectionName: name,
					parseData: ({ id, data, filePath = '' }) =>
						getEntryData(
							{
								id,
								collection: name,
								unvalidatedData: data,
								_internal: {
									rawData: undefined,
									filePath,
								},
							},
							{ ...collection, schema },
							false,
						),
					loaderName,
					refreshContextData: options?.context,
				});

				if ('loader' in collection) {
					if (typeof collection.loader === 'function') {
						return simpleLoader(collection.loader as CollectionLoader<{ id: string }>, context);
					}

					if (!collection.loader?.load) {
						throw new Error(`Collection loader for ${name} does not have a load method`);
					}

					return collection.loader.load(context);
				}
			}),
		);
		await fs.mkdir(this.#settings.config.cacheDir, { recursive: true });
		await fs.mkdir(this.#settings.dotAstroDir, { recursive: true });
		const assetImportsFile = new URL(ASSET_IMPORTS_FILE, this.#settings.dotAstroDir);
		await this.#store.writeAssetImports(assetImportsFile);
		const modulesImportsFile = new URL(MODULES_IMPORTS_FILE, this.#settings.dotAstroDir);
		await this.#store.writeModuleImports(modulesImportsFile);
		await this.#store.waitUntilSaveComplete();
		// Collections load in parallel above, so references can only be validated once
		// every collection has finished loading. Run after the store has flushed to
		// disk so this pass stays off the save/debounce critical path.
		this.#validateReferences(resolvedSchemas, logger);
		logger.info('Synced content');
		if (this.#settings.config.experimental.contentIntellisense) {
			await this.regenerateCollectionFileManifest();
		}
	}

	/**
	 * Warns when a `reference()` field points to an entry that does not exist in an
	 * otherwise-loaded collection. Without this, invalid references silently pass
	 * validation and only fail (or resolve to `undefined`) later at render time.
	 *
	 * Reference fields are located by walking each collection's schema (tagged by
	 * `reference()` — see reference-schema.ts) alongside the entry data, rather than by
	 * sniffing the value shape. Driving off the schema keeps ordinary `{ collection, id }`
	 * lookalike data from being flagged, and — because the schema is rebuilt every sync
	 * while the parsed value is restored from the persisted store — lets validation reach
	 * references on cached entries that were not re-parsed this sync.
	 */
	#validateReferences(schemas: Map<string, z.ZodType>, logger: AstroIntegrationLogger) {
		// The same reference can be reached more than once when the schema walk descends
		// both sides of a `union`/`intersection` with the same data; only warn once per
		// distinct dangling reference.
		const warned = new Set<string>();
		const validateReference = (value: unknown, collection: string, entryId: string) => {
			if (
				!value ||
				typeof value !== 'object' ||
				typeof (value as { collection?: unknown }).collection !== 'string'
			) {
				// e.g. an untransformed `reference().default('...')` string, or a nullish
				// optional reference — nothing to resolve.
				return;
			}
			const ref = value as { collection: string; id?: string; slug?: string };
			const referencedId = ref.id ?? ref.slug;
			if (referencedId == null) return;
			// Only validate against collections that were actually loaded, so that
			// references into skipped/selective-sync collections are not flagged.
			if (
				this.#store.hasCollection(ref.collection) &&
				!this.#store.has(ref.collection, String(referencedId))
			) {
				const key = `${collection}\0${entryId}\0${ref.collection}\0${referencedId}`;
				if (warned.has(key)) return;
				warned.add(key);
				logger.warn(
					`Invalid content reference: entry "${collection}" → "${entryId}" references "${referencedId}" in collection "${ref.collection}", but no such entry exists.`,
				);
			}
		};

		// Walk the schema and the parsed data in lock-step, validating wherever the schema
		// says a `reference()` lives. Unrecognized schema wrappers stop the walk on that
		// branch, so at worst a nested reference is not validated — never a false positive.
		const walk = (schema: unknown, data: unknown, collection: string, entryId: string) => {
			if (data == null || schema == null) return;

			if (getReferenceCollection(schema) !== undefined) {
				validateReference(data, collection, entryId);
				return;
			}

			const def = (schema as { _zod?: { def?: any } })._zod?.def;
			if (!def) return;

			switch (def.type) {
				case 'object': {
					if (typeof data !== 'object') return;
					for (const [key, child] of Object.entries(def.shape as Record<string, unknown>)) {
						walk(child, (data as Record<string, unknown>)[key], collection, entryId);
					}
					return;
				}
				case 'array': {
					if (!Array.isArray(data)) return;
					for (const item of data) walk(def.element, item, collection, entryId);
					return;
				}
				case 'tuple': {
					if (!Array.isArray(data)) return;
					(def.items as unknown[]).forEach((item, i) => walk(item, data[i], collection, entryId));
					if (def.rest) {
						for (const extra of data.slice((def.items as unknown[]).length)) {
							walk(def.rest, extra, collection, entryId);
						}
					}
					return;
				}
				case 'record': {
					if (typeof data !== 'object') return;
					for (const value of Object.values(data as Record<string, unknown>)) {
						walk(def.valueType, value, collection, entryId);
					}
					return;
				}
				case 'union': {
					for (const option of def.options as unknown[]) {
						walk(option, data, collection, entryId);
					}
					return;
				}
				case 'intersection': {
					walk(def.left, data, collection, entryId);
					walk(def.right, data, collection, entryId);
					return;
				}
				case 'optional':
				case 'nullable':
				case 'default':
				case 'prefault':
				case 'catch':
				case 'nonoptional':
				case 'readonly':
					walk(def.innerType, data, collection, entryId);
					return;
				case 'pipe':
					// A non-reference transform/refinement; the stored value matches its input.
					walk(def.in, data, collection, entryId);
					return;
				case 'lazy':
					walk(def.getter(), data, collection, entryId);
					return;
				default:
					return;
			}
		};

		for (const [collection, entries] of this.#store.collections()) {
			const schema = schemas.get(collection);
			if (!schema) continue;
			for (const entry of entries.values()) {
				walk(schema, (entry as { data?: unknown })?.data, collection, (entry as any)?.id ?? '');
			}
		}
	}

	async regenerateCollectionFileManifest() {
		const collectionsManifest = new URL(COLLECTIONS_MANIFEST_FILE, this.#settings.dotAstroDir);
		this.#logger.debug('content', 'Regenerating collection file manifest');
		if (existsSync(collectionsManifest)) {
			try {
				const collections = await fs.readFile(collectionsManifest, 'utf-8');
				const collectionsJson = JSON.parse(collections);
				collectionsJson.entries ??= {};

				for (const { hasSchema, name } of collectionsJson.collections) {
					if (!hasSchema) {
						continue;
					}
					const entries = this.#store.values(name);
					if (!entries?.[0]?.filePath) {
						continue;
					}
					for (const { filePath } of entries) {
						if (!filePath) {
							continue;
						}
						const key = new URL(filePath, this.#settings.config.root).href.toLowerCase();
						collectionsJson.entries[key] = name;
					}
				}
				await fs.writeFile(collectionsManifest, JSON.stringify(collectionsJson, null, 2));
			} catch {
				this.#logger.error('content', 'Failed to regenerate collection file manifest');
			}
		}
		this.#logger.debug('content', 'Regenerated collection file manifest');
	}
}

async function simpleLoader<TData extends { id: string }>(
	handler: CollectionLoader<TData>,
	context: LoaderContext,
) {
	const unsafeData = await handler();
	const parsedData = loaderReturnSchema.safeParse(unsafeData);

	if (!parsedData.success) {
		const issue = parsedData.error.issues[0] as z.core.$ZodIssueInvalidUnion;

		// Due to this being a union, zod will always throw an "Expected array, received object" error along with the other errors.
		// This error is in the second position if the data is an array, and in the first position if the data is an object.
		const parseIssue = Array.isArray(unsafeData) ? issue.errors[0] : issue.errors[1];

		const error = parseIssue[0];
		const firstPathItem = error.path[0];

		const entry = Array.isArray(unsafeData)
			? unsafeData[firstPathItem as number]
			: unsafeData[firstPathItem as string];

		throw new AstroError({
			...AstroErrorData.ContentLoaderReturnsInvalidId,
			message: AstroErrorData.ContentLoaderReturnsInvalidId.message(context.collection, entry),
		});
	}

	const data = parsedData.data;

	context.store.clear();

	if (Array.isArray(data)) {
		for (const raw of data) {
			if (!raw.id) {
				throw new AstroError({
					...AstroErrorData.ContentLoaderInvalidDataError,
					message: AstroErrorData.ContentLoaderInvalidDataError.message(
						context.collection,
						`Entry missing ID:\n${JSON.stringify({ ...raw, id: undefined }, null, 2)}`,
					),
				});
			}
			const item = await context.parseData({ id: raw.id, data: raw });
			context.store.set({ id: raw.id, data: item });
		}
		return;
	}
	if (typeof data === 'object') {
		for (const [id, raw] of Object.entries(data)) {
			if (raw.id && raw.id !== id) {
				throw new AstroError({
					...AstroErrorData.ContentLoaderInvalidDataError,
					message: AstroErrorData.ContentLoaderInvalidDataError.message(
						context.collection,
						`Object key ${JSON.stringify(id)} does not match ID ${JSON.stringify(raw.id)}`,
					),
				});
			}
			const item = await context.parseData({ id, data: raw });
			context.store.set({ id, data: item });
		}
		return;
	}
	throw new AstroError({
		...AstroErrorData.ExpectedImageOptions,
		message: AstroErrorData.ContentLoaderInvalidDataError.message(
			context.collection,
			`Invalid data type: ${typeof data}`,
		),
	});
}
/**
 * Get the path to the data store file.
 * During development, this is in the `.astro` directory so that the Vite watcher can see it.
 * In production, it's in the cache directory so that it's preserved between builds.
 */
export function getDataStoreFile(settings: AstroSettings, isDev: boolean) {
	return new URL(DATA_STORE_FILE, isDev ? settings.dotAstroDir : settings.config.cacheDir);
}
