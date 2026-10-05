import { existsSync, promises as fs } from 'node:fs';
import { relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import pLimit from 'p-limit';
import colors from 'piccolore';
import picomatch from 'picomatch';
import { glob as tinyglobby } from 'tinyglobby';
import * as AstroErrorData from '../../core/errors/errors-data.js';
import { AstroError } from '../../core/errors/index.js';
import type { ContentEntryRenderFunction, ContentEntryType } from '../../types/public/content.js';
import type { RenderedContent } from '../data-store.js';
import { posixRelative } from '../utils.js';
import { isExternalLoaderContext } from './external.js';
import { type GlobOptions, generateIdDefault } from './glob.js';
import type { ExternalLoaderContext, ExternalStorageLoader } from './types.js';

const LOADER_NAME = 'external-glob-loader';

/** A matched file, read and parsed, with the ID and digest of its entry */
interface EntryFile {
	/** The path of the file, relative to the base directory */
	entry: string;
	/** The absolute path of the file */
	filePath: string;
	/** The path of the file, relative to the project root, as saved in the entry */
	relativePath: string;
	id: string;
	digest: string;
	body?: string;
	data: Record<string, unknown>;
	entryType: ContentEntryType;
}

/**
 * Loads multiple entries, using a glob pattern to match files, into a collection defined
 * with `storage: 'external'`. It accepts the same options as `glob()`, and gives entries the
 * same IDs.
 *
 * On each sync, only the files that changed since the previous sync are saved again.
 */
export function externalGlob(globOptions: GlobOptions): ExternalStorageLoader {
	const patterns = Array.isArray(globOptions.pattern) ? globOptions.pattern : [globOptions.pattern];
	if (patterns.some((pattern) => pattern.startsWith('../'))) {
		throw new Error(
			'Glob patterns cannot start with `../`. Set the `base` option to a parent directory instead.',
		);
	}
	if (patterns.some((pattern) => pattern.startsWith('/'))) {
		throw new Error(
			'Glob patterns cannot start with `/`. Set the `base` option to a parent directory or use a relative path instead.',
		);
	}

	const userGenerateId = globOptions.generateId ?? generateIdDefault;
	// Stored IDs are strings, so numeric IDs (e.g. a YAML `slug: 1`) must be too
	const generateId = (options: Parameters<typeof userGenerateId>[0]) =>
		String(userGenerateId(options));

	async function load(context: ExternalLoaderContext) {
		const { config, collection, logger, watcher, parseData, store, generateDigest, entryTypes } =
			context;
		const renderFunctionByContentType = new WeakMap<ContentEntryType, ContentEntryRenderFunction>();
		const fileToIdMap = new Map<string, string>();

		const baseDir = new URL(globOptions.base ?? './', config.root);
		if (!baseDir.pathname.endsWith('/')) {
			baseDir.pathname = `${baseDir.pathname}/`;
		}
		const basePath = fileURLToPath(baseDir);

		const configFiles = new Set(
			['config.js', 'config.ts', 'config.mjs'].map(
				(file) => new URL(file, new URL('content/', config.srcDir)).href,
			),
		);

		/** Reads a matched file. Returns `undefined`, with a warning, when it can't be loaded. */
		async function readEntryFile(entry: string): Promise<EntryFile | undefined> {
			const ext = entry.split('.').at(-1);
			const entryType = ext ? entryTypes.get(`.${ext}`) : undefined;
			if (!entryType) {
				logger.warn(`No entry type found for ${entry}`);
				return;
			}
			const fileUrl = new URL('./' + encodeURI(entry), baseDir);
			const contents = await fs.readFile(fileUrl, 'utf-8').catch((err) => {
				logger.error(`Error reading ${entry}: ${err.message}`);
			});
			if (!contents && contents !== '') {
				logger.warn(`No contents found for ${entry}`);
				return;
			}
			const { body, data } = await entryType.getEntryInfo({ contents, fileUrl });
			const filePath = fileURLToPath(fileUrl);
			return {
				entry,
				filePath,
				relativePath: posixRelative(fileURLToPath(config.root), filePath),
				id: generateId({ entry, base: baseDir, data }),
				digest: generateDigest(contents),
				body,
				data,
				entryType,
			};
		}

		/** Renders the entry of a file, when its type can be rendered, and saves it. */
		async function saveEntry({
			id,
			digest,
			filePath,
			relativePath,
			entry,
			body,
			data,
			entryType,
		}: EntryFile) {
			const parsedData = await parseData({ id, data, filePath });
			const storedBody = globOptions.retainBody === false ? undefined : body;

			if (entryType.getRenderFunction && !globOptions.deferRender) {
				let render = renderFunctionByContentType.get(entryType);
				if (!render) {
					render = await entryType.getRenderFunction(config);
					renderFunctionByContentType.set(entryType, render);
				}
				let rendered: RenderedContent | undefined = undefined;
				try {
					rendered = await render?.({ id, data, body, filePath, digest });
				} catch (error: any) {
					logger.error(`Error rendering ${entry}: ${error.message}`);
				}
				await store.set({
					id,
					data: parsedData,
					body: storedBody,
					filePath: relativePath,
					digest,
					rendered,
					assetImports: rendered?.metadata?.imagePaths,
				});
			} else if (
				(entryType.getRenderFunction && globOptions.deferRender) ||
				'contentModuleTypes' in entryType
			) {
				await store.set({
					id,
					data: parsedData,
					body: storedBody,
					filePath: relativePath,
					digest,
					deferredRender: true,
				});
			} else {
				await store.set({ id, data: parsedData, body: storedBody, filePath: relativePath, digest });
			}
			fileToIdMap.set(filePath, id);
		}

		/** Follows `prerenderConflictBehavior` when two files have entries with the same ID. */
		function reportDuplicateId(id: string, filePath: string, otherFilePath: string) {
			const message = AstroErrorData.DuplicateContentEntrySlugError.message(
				collection,
				id,
				filePath,
				otherFilePath,
			);
			if (config.prerenderConflictBehavior === 'error') {
				throw new AstroError({ ...AstroErrorData.DuplicateContentEntrySlugError, message });
			} else if (config.prerenderConflictBehavior !== 'ignore') {
				logger.warn(message);
			}
		}

		const exists = existsSync(baseDir);
		if (!exists) {
			// The watcher is still set up, in case the directory is created later
			logger.warn(`The base directory "${basePath}" does not exist.`);
		}
		const files = await tinyglobby(globOptions.pattern, {
			cwd: basePath,
			expandDirectories: false,
		});
		if (exists && files.length === 0) {
			logger.warn(
				`No files found matching "${globOptions.pattern}" in directory "${relative(fileURLToPath(config.root), basePath)}"`,
			);
		}

		// The digest and file of each saved entry, read once instead of once per file
		const savedEntries = new Map<string, { digest?: string | number; filePath?: string }>();
		for await (const { id, digest, filePath } of store.values({ content: false })) {
			savedEntries.set(id, { digest, filePath });
		}

		// The IDs of all the files are known before anything is saved, so duplicates and removed
		// entries are found without reading the driver again. Only what's needed to compare
		// entries is kept, so the contents of the whole collection aren't held in memory.
		const limit = pLimit(10);
		const found = await Promise.all(
			files.map((entry) =>
				limit(async () => {
					if (configFiles.has(new URL('./' + encodeURI(entry), baseDir).href)) {
						return;
					}
					const file = await readEntryFile(entry);
					return (
						file && {
							entry,
							id: file.id,
							digest: file.digest,
							filePath: file.filePath,
							relativePath: file.relativePath,
						}
					);
				}),
			),
		);
		const foundById = new Map<string, NonNullable<(typeof found)[number]>>();
		for (const file of found) {
			if (!file) {
				continue;
			}
			const duplicate = foundById.get(file.id);
			if (duplicate) {
				reportDuplicateId(file.id, duplicate.relativePath, file.relativePath);
			}
			foundById.set(file.id, file);
		}

		await Promise.all(
			[...foundById.values()].map(({ entry, id, digest, filePath, relativePath }) =>
				limit(async () => {
					const saved = savedEntries.get(id);
					if (saved?.digest === digest && saved.filePath === relativePath) {
						fileToIdMap.set(filePath, id);
						return;
					}
					const file = await readEntryFile(entry);
					if (file) {
						await saveEntry(file);
					}
				}),
			),
		);

		for (const id of savedEntries.keys()) {
			if (!foundById.has(id)) {
				await store.delete(id);
			}
		}

		if (!watcher) {
			return;
		}

		watcher.add(basePath);

		// Negation patterns are passed as picomatch's `ignore` option, so the watcher matches
		// the same files as tinyglobby
		const positivePatterns = patterns.filter((p) => !p.startsWith('!'));
		const negationPatterns = patterns.filter((p) => p.startsWith('!')).map((p) => p.slice(1));
		const matchesGlob = (entry: string) =>
			!entry.startsWith('../') &&
			picomatch.isMatch(entry, positivePatterns, {
				ignore: negationPatterns.length > 0 ? negationPatterns : undefined,
			});

		async function onChange(changedPath: string) {
			const entry = posixRelative(basePath, changedPath);
			if (!matchesGlob(entry)) {
				return;
			}
			try {
				const file = await readEntryFile(entry);
				if (!file) {
					return;
				}
				const oldId = fileToIdMap.get(file.filePath);
				if (oldId && oldId !== file.id) {
					await store.delete(oldId);
					fileToIdMap.delete(file.filePath);
				}
				const saved = await store.get(file.id, { content: false });
				if (saved?.digest === file.digest && saved.filePath === file.relativePath) {
					return;
				}
				// A file that still exists with another file's ID is a duplicate. Otherwise, the
				// other file was renamed, and its removal just hasn't been reported yet.
				if (
					saved?.filePath &&
					saved.filePath !== file.relativePath &&
					existsSync(new URL(saved.filePath, config.root))
				) {
					reportDuplicateId(file.id, saved.filePath, file.relativePath);
				}
				await saveEntry(file);
				logger.info(`Reloaded data from ${colors.green(entry)}`);
			} catch (error: any) {
				logger.error(`Failed to reload ${entry}: ${error.message}`);
			}
		}

		watcher.on('change', onChange);
		watcher.on('add', onChange);
		watcher.on('unlink', async (deletedPath) => {
			const entry = posixRelative(basePath, deletedPath);
			if (!matchesGlob(entry)) {
				return;
			}
			const id = fileToIdMap.get(deletedPath);
			if (!id) {
				return;
			}
			try {
				await store.delete(id);
				fileToIdMap.delete(deletedPath);
			} catch (error: any) {
				logger.error(`Failed to remove ${entry}: ${error.message}`);
			}
		});
	}

	const loader = {
		name: LOADER_NAME,
		load: async (context) => {
			if (!isExternalLoaderContext(context)) {
				throw new AstroError({
					...AstroErrorData.ContentLoaderRequiresExternalStorage,
					message: AstroErrorData.ContentLoaderRequiresExternalStorage.message(
						context.collection,
						'externalGlob()',
					),
				});
			}
			await load(context);
		},
	} as ExternalStorageLoader;
	// Not enumerable, so a loader created by spreading this one, for example to replace
	// `load()`, doesn't claim to support external storage
	Object.defineProperty(loader, 'supportsExternalStorage', { value: true });
	return loader;
}
