import { promises as fs } from 'fs';
import { fileURLToPath, pathToFileURL } from 'url';
import fastGlob from 'fast-glob';
import { green } from 'kleur/colors';
import micromatch from 'micromatch';
import pLimit from 'p-limit';
import { relative } from 'path/posix';
import type { ContentEntryType, RenderFunction } from '../../@types/astro.js';
import { getContentEntryIdAndSlug, getEntryConfigByExtMap } from '../utils.js';
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
			'Glob patterns cannot start with `../`. Set the `base` option to a parent directory instead.'
		);
	}
	if (globOptions.pattern.startsWith('/')) {
		throw new Error(
			'Glob patterns cannot start with `/`. Set the `base` option to a parent directory or use a relative path instead.'
		);
	}

	const generateId = globOptions?.generateId ?? generateIdDefault;

	const fileToIdMap = new Map<string, string>();

	return {
		name: 'glob-loader',
		load: async ({ settings, logger, watcher, parseData, store, generateDigest }) => {
			const renderFunctionByContentType = new WeakMap<ContentEntryType, RenderFunction>();

			const untouchedEntries = new Set(store.keys());

			async function syncData(entry: string, base: URL, entryType?: ContentEntryType) {
				if (!entryType) {
					logger.warn(`No entry type found for ${entry}`);
					return;
				}
				const fileUrl = new URL(entry, base);
				const contents = await fs.readFile(fileUrl, 'utf-8');

				const { body, data } = await entryType.getEntryInfo({
					contents,
					fileUrl,
				});

				const id = generateId({ entry, base, data });
				untouchedEntries.delete(id);

				const existingEntry = store.get(id);

				const digest = generateDigest(contents);

				if (existingEntry && existingEntry.digest === digest) {
					return;
				}

				const filePath = fileURLToPath(fileUrl);

				const parsedData = await parseData({
					id,
					data,
					filePath,
				});

				if (entryType.getRenderFunction) {
					let render = renderFunctionByContentType.get(entryType);
					if (!render) {
						render = await entryType.getRenderFunction(settings);
						// Cache the render function for this content type, so it can re-use parsers and other expensive setup
						renderFunctionByContentType.set(entryType, render);
					}
					const rendered = await render({
						id,
						data: parsedData,
						body,
						filePath,
						digest,
					});
					store.set({
						id,
						data: parsedData,
						body,
						filePath,
						digest,
						rendered,
					});
					if (rendered.metadata?.imagePaths?.length) {
						store.addAssetImports(rendered.metadata.imagePaths, filePath);
					}
				} else {
					store.set({ id, data: parsedData, body, filePath, digest });
				}

				fileToIdMap.set(filePath, id);
			}

			const entryConfigByExt = getEntryConfigByExtMap([
				...settings.contentEntryTypes,
				...settings.dataEntryTypes,
			] as Array<ContentEntryType>);

			const baseDir = globOptions.base
				? new URL(globOptions.base, settings.config.root)
				: settings.config.root;

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
				return entryConfigByExt.get(`.${ext}`);
			}

			const limit = pLimit(10);
			await Promise.all(
				files.map((entry) =>
					limit(async () => {
						const entryType = configForFile(entry);
						await syncData(entry, baseDir, entryType);
					})
				)
			);
			// Remove entries that were not found this time
			untouchedEntries.forEach((id) => store.delete(id));

			if (!watcher) {
				return;
			}

			const matcher: RegExp = micromatch.makeRe(globOptions.pattern);

			const matchesGlob = (entry: string) => !entry.startsWith('../') && matcher.test(entry);

			const basePath = fileURLToPath(baseDir);

			async function onChange(changedPath: string) {
				const entry = relative(basePath, changedPath);
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
				const entry = relative(basePath, deletedPath);
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
