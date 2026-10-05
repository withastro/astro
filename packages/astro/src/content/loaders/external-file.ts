import { existsSync, promises as fs } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { parseYaml } from '@astrojs/internal-helpers/yaml';
import * as toml from 'smol-toml';
import * as AstroErrorData from '../../core/errors/errors-data.js';
import { AstroError } from '../../core/errors/index.js';
import { posixRelative } from '../utils.js';
import { isExternalLoaderContext } from './external.js';
import type { ExternalLoaderContext, ExternalStorageLoader } from './types.js';

type ParserOutput = Record<string, Record<string, unknown>> | Array<Record<string, unknown>>;

interface ExternalFileOptions {
	/**
	 * the parsing function to use for this data
	 * @default JSON.parse or yaml.load, depending on the extension of the file
	 * */
	parser?: (text: string) => Promise<ParserOutput> | ParserOutput;
}

/**
 * Loads entries from a JSON, YAML or TOML file into a collection defined with
 * `storage: 'external'`. It accepts the same options as `file()`, and gives entries the same IDs.
 *
 * On each sync, only the entries that changed since the previous sync are saved again, and
 * the entries that were removed from the file are removed from the collection.
 *
 * @param fileName The path to the file to load, relative to the project root.
 * @param options Additional options for the file loader
 */
export function externalFile(
	fileName: string,
	options?: ExternalFileOptions,
): ExternalStorageLoader {
	if (fileName.includes('*')) {
		throw new AstroError(AstroErrorData.FileGlobNotSupported);
	}

	let parse: ((text: string) => any) | null = null;
	const ext = fileName.split('.').at(-1);
	if (ext === 'json') {
		parse = JSON.parse;
	} else if (ext === 'yml' || ext === 'yaml') {
		parse = parseYaml;
	} else if (ext === 'toml') {
		parse = toml.parse;
	}
	if (options?.parser) parse = options.parser;

	if (parse === null) {
		throw new AstroError({
			...AstroErrorData.FileParserNotFound,
			message: AstroErrorData.FileParserNotFound.message(fileName),
		});
	}

	/** Returns the items of the file by ID. Returns `undefined`, with an error, when it can't be read. */
	async function readItems(
		filePath: string,
		{ logger, config, collection }: ExternalLoaderContext,
	): Promise<Map<string, Record<string, unknown>> | undefined> {
		let data: ParserOutput;
		try {
			data = await parse!(await fs.readFile(filePath, 'utf-8'));
		} catch (error: any) {
			logger.error(`Error reading data from ${fileName}`);
			logger.debug(error.message);
			return;
		}

		const items = new Map<string, Record<string, unknown>>();
		if (Array.isArray(data)) {
			if (data.length === 0) {
				logger.warn(`No items found in ${fileName}`);
			}
			logger.debug(`Found ${data.length} item array in ${fileName}`);
			for (const rawItem of data) {
				const id = (rawItem.id ?? rawItem.slug)?.toString();
				if (!id) {
					logger.error(`Item in ${fileName} is missing an id or slug field.`);
					continue;
				}
				if (items.has(id)) {
					const message = AstroErrorData.DuplicateContentEntrySlugError.message(
						collection,
						id,
						fileName,
						fileName,
					);
					if (config.prerenderConflictBehavior === 'error') {
						throw new AstroError({ ...AstroErrorData.DuplicateContentEntrySlugError, message });
					} else if (config.prerenderConflictBehavior !== 'ignore') {
						logger.warn(message);
					}
				}
				items.set(id, rawItem);
			}
		} else if (typeof data === 'object') {
			const entries = Object.entries<Record<string, unknown>>(data);
			logger.debug(`Found object with ${entries.length} entries in ${fileName}`);
			for (const [id, rawItem] of entries) {
				// Ignore the JSON schema field
				if (id === '$schema' && typeof rawItem === 'string') {
					continue;
				}
				items.set(id, rawItem);
			}
		} else {
			logger.error(`Invalid data in ${fileName}. Must be an array or object.`);
			return;
		}
		return items;
	}

	/**
	 * Saves the items of the file that changed, and removes the saved entries whose items
	 * were removed from the file. Nothing changes when the file can't be read.
	 */
	async function syncData(filePath: string, context: ExternalLoaderContext) {
		const { config, parseData, store, generateDigest } = context;
		const items = await readItems(filePath, context);
		if (!items) {
			return;
		}
		const savedDigests = new Map<string, string | number | undefined>();
		for await (const { id, digest } of store.values({ content: false })) {
			savedDigests.set(id, digest);
		}
		const normalizedFilePath = posixRelative(fileURLToPath(config.root), filePath);
		for (const [id, rawItem] of items) {
			const digest = generateDigest(rawItem);
			if (savedDigests.get(id) === digest) {
				continue;
			}
			const parsedData = await parseData({ id, data: rawItem, filePath });
			await store.set({ id, data: parsedData, filePath: normalizedFilePath, digest });
		}
		for (const id of savedDigests.keys()) {
			if (!items.has(id)) {
				await store.delete(id);
			}
		}
	}

	const loader = {
		name: 'external-file-loader',
		load: async (context) => {
			if (!isExternalLoaderContext(context)) {
				throw new AstroError({
					...AstroErrorData.ContentLoaderRequiresExternalStorage,
					message: AstroErrorData.ContentLoaderRequiresExternalStorage.message(
						context.collection,
						'externalFile()',
					),
				});
			}
			const { config, logger, watcher } = context;
			logger.debug(`Loading data from ${fileName}`);
			const url = new URL(fileName, config.root);
			if (!existsSync(url)) {
				logger.error(`File not found: ${fileName}`);
				return;
			}
			const filePath = fileURLToPath(url);

			await syncData(filePath, context);

			watcher?.add(filePath);
			watcher?.on('change', async (changedPath) => {
				if (changedPath !== filePath) {
					return;
				}
				logger.info(`Reloading data from ${fileName}`);
				try {
					await syncData(filePath, context);
				} catch (error: any) {
					logger.error(`Failed to reload ${fileName}: ${error.message}`);
				}
			});
		},
	} as ExternalStorageLoader;
	// Not enumerable, so a loader created by spreading this one, for example to replace
	// `load()`, doesn't claim to support external storage
	Object.defineProperty(loader, 'supportsExternalStorage', { value: true });
	return loader;
}
