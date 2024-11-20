import { promises as fs } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import fastGlob from 'fast-glob';
import { bold, green } from 'kleur/colors';
import micromatch from 'micromatch';
import pLimit from 'p-limit';
import type { ContentEntryRenderFuction, ContentEntryType } from '../../@types/astro.js';
import type { RenderedContent } from '../data-store.js';
import { getContentEntryIdAndSlug, posixRelative } from '../utils.js';
import type { Loader } from './types.js';

export interface GenerateIdOptions {
	/** The path to the entry file, relative to the base directory. */
	entry: string;

	/** The base directory URL. */
	base: URL;
	/** The parsed, unvalidated data of the entry. */
	data: Record<string, unknown>;
}

export interface GlobOptions {
	/** The glob pattern to match files, relative to the base directory */
	pattern: string;
	/** The base directory to resolve the glob pattern from. Relative to the root directory, or an absolute file URL. Defaults to `.` */
	base?: string | URL;
	/**
	 * Function that generates an ID for an entry. Default implementation generates a slug from the entry path.
	 * @returns The ID of the entry. Must be unique per collection.
	 **/
	generateId?: (options: GenerateIdOptions) => string;
}

function generateIdDefault({ entry, base, data }: GenerateIdOptions): string {
	if (data.slug) {
		return data.slug as string;
	}
	const entryURL = new URL(entry, base);
	const { slug } = getContentEntryIdAndSlug({
		entry: entryURL,
		contentDir: base,
		collection: '',
	});
	return slug;
}

/**
 * Loads multiple entries, using a glob pattern to match files.
 * @param pattern A glob pattern to match files, relative to the content directory.
 */
export function glob(globOptions: GlobOptions): Loader {
	if (globOptions.pattern.startsWith('../')) {
		throw new Error(
			'Glob patterns cannot start with `../`. Set the `base` option to a parent directory instead.',
		);
	}
	if (globOptions.pattern.startsWith('/')) {
		throw new Error(
			'Glob patterns cannot start with `/`. Set the `base` option to a parent directory or use a relative path instead.',
		);
	}

	const generateId = globOptions?.generateId ?? generateIdDefault;

	const fileToIdMap = new Map<string, string>();

	return {
		name: 'glob-loader',
		load: async ({ config, logger, watcher, parseData, store, generateDigest, entryTypes }) => {
			const renderFunctionByContentType = new WeakMap<
				ContentEntryType,
				ContentEntryRenderFuction
			>();

			const untouchedEntries = new Set(store.keys());

			async function syncData(entry: string, base: URL, entryType?: ContentEntryType) {
				if (!entryType) {
					logger.warn(`No entry type found for ${entry}`);
					return;
				}
				const fileUrl = new URL(entry, base);
				const contents = await fs.readFile(fileUrl, 'utf-8').catch((err) => {
					logger.error(`Error reading ${entry}: ${err.message}`);
					return;
				});

				if (!contents) {
					logger.warn(`No contents found for ${entry}`);
					return;
				}

				const { body, data } = await entryType.getEntryInfo({
					contents,
					fileUrl,
				});

				const id = generateId({ entry, base, data });
				untouchedEntries.delete(id);

				const existingEntry = store.get(id);

				const digest = generateDigest(contents);
				const filePath = fileURLToPath(fileUrl);

				if (existingEntry && existingEntry.digest === digest && existingEntry.filePath) {
					if (existingEntry.deferredRender) {
						store.addModuleImport(existingEntry.filePath);
					}

					if (existingEntry.assetImports?.length) {
						// Add asset imports for existing entries
						store.addAssetImports(existingEntry.assetImports, existingEntry.filePath);
					}

					fileToIdMap.set(filePath, id);
					return;
				}

				const relativePath = posixRelative(fileURLToPath(config.root), filePath);

				const parsedData = await parseData({
					id,
					data,
					filePath,
				});
				if (entryType.getRenderFunction) {
					let render = renderFunctionByContentType.get(entryType);
					if (!render) {
						render = await entryType.getRenderFunction(config);
						// Cache the render function for this content type, so it can re-use parsers and other expensive setup
						renderFunctionByContentType.set(entryType, render);
					}
					let rendered: RenderedContent | undefined = undefined;

					try {
						rendered = await render?.({
							id,
							data: parsedData,
							body,
							filePath,
							digest,
						});
					} catch (error: any) {
						logger.error(`Error rendering ${entry}: ${error.message}`);
					}

					store.set({
						id,
						data: parsedData,
						body,
						filePath: relativePath,
						digest,
						rendered,
						assetImports: rendered?.metadata?.imagePaths,
					});

					// todo: add an explicit way to opt in to deferred rendering
				} else if ('contentModuleTypes' in entryType) {
					store.set({
						id,
						data: parsedData,
						body,
						filePath: relativePath,
						digest,
						deferredRender: true,
					});
				} else {
					store.set({ id, data: parsedData, body, filePath: relativePath, digest });
				}

				fileToIdMap.set(filePath, id);
			}

			const baseDir = globOptions.base ? new URL(globOptions.base, config.root) : config.root;

			if (!baseDir.pathname.endsWith('/')) {
				baseDir.pathname = `${baseDir.pathname}/`;
			}

			const files = await fastGlob(globOptions.pattern, {
				cwd: fileURLToPath(baseDir),
			});

			function configForFile(file: string) {
				const ext = file.split('.').at(-1);
				if (!ext) {
					logger.warn(`No extension found for ${file}`);
					return;
				}
				return entryTypes.get(`.${ext}`);
			}

			const limit = pLimit(10);
			const skippedFiles: Array<string> = [];

			const contentDir = new URL('content/', config.srcDir);

			function isInContentDir(file: string) {
				const fileUrl = new URL(file, baseDir);
				return fileUrl.href.startsWith(contentDir.href);
			}

			const configFiles = new Set(
				['config.js', 'config.ts', 'config.mjs'].map((file) => new URL(file, contentDir).href),
			);

			function isConfigFile(file: string) {
				const fileUrl = new URL(file, baseDir);
				return configFiles.has(fileUrl.href);
			}

			await Promise.all(
				files.map((entry) => {
					if (isConfigFile(entry)) {
						return;
					}
					if (isInContentDir(entry)) {
						skippedFiles.push(entry);
						return;
					}
					return limit(async () => {
						const entryType = configForFile(entry);
						await syncData(entry, baseDir, entryType);
					});
				}),
			);

			const skipCount = skippedFiles.length;

			if (skipCount > 0) {
				logger.warn(`The glob() loader cannot be used for files in ${bold('src/content')}.`);
				if (skipCount > 10) {
					logger.warn(
						`Skipped ${green(skippedFiles.length)} files that matched ${green(globOptions.pattern)}.`,
					);
				} else {
					logger.warn(`Skipped the following files that matched ${green(globOptions.pattern)}:`);
					skippedFiles.forEach((file) => logger.warn(`• ${green(file)}`));
				}
			}

			// Remove entries that were not found this time
			untouchedEntries.forEach((id) => store.delete(id));

			if (!watcher) {
				return;
			}

			const matcher: RegExp = micromatch.makeRe(globOptions.pattern);

			const matchesGlob = (entry: string) => !entry.startsWith('../') && matcher.test(entry);

			const basePath = fileURLToPath(baseDir);

			async function onChange(changedPath: string) {
				const entry = posixRelative(basePath, changedPath);
				if (!matchesGlob(entry)) {
					return;
				}
				const entryType = configForFile(changedPath);
				const baseUrl = pathToFileURL(basePath);
				await syncData(entry, baseUrl, entryType);
				logger.info(`Reloaded data from ${green(entry)}`);
			}

			watcher.on('change', onChange);

			watcher.on('add', onChange);

			watcher.on('unlink', async (deletedPath) => {
				const entry = posixRelative(basePath, deletedPath);
				if (!matchesGlob(entry)) {
					return;
				}
				const id = fileToIdMap.get(deletedPath);
				if (id) {
					store.delete(id);
					fileToIdMap.delete(deletedPath);
				}
			});
		},
	};
}
