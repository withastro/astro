import { fileURLToPath, pathToFileURL } from 'url';
import type { Loader, LoaderContext } from './loaders.js';
import { promises as fs } from 'fs';
import fastGlob from 'fast-glob';
import pLimit from 'p-limit';
import { getContentEntryIdAndSlug, getEntryConfigByExtMap } from './utils.js';
import type { ContentEntryType, DataEntryType } from '../@types/astro.js';
import micromatch from 'micromatch';
import { relative } from 'path/posix';

export interface GlobOptions {
	/** The glob pattern to match files, relative to the base directory */
	pattern: string;
	/** The base directory to resolve the glob pattern from, relative to the root directory. Defaults to `.` */
	base?: string;
}

function generateSlugDefault(entry: URL, base: URL) {
	const { slug } = getContentEntryIdAndSlug({
		entry,
		contentDir: base,
		collection: '',
	});
	return slug.startsWith('/') ? slug : `/${slug}`;
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
	async function syncData(
		id: string,
		fileUrl: URL,
		{ logger, parseData, store }: LoaderContext,
		entryType?: ContentEntryType
	) {
		if (!entryType) {
			logger.warn(`No entry type found for ${fileUrl.pathname}`);
			return;
		}
		const { slug, body, data } = await entryType.getEntryInfo({
			contents: await fs.readFile(fileUrl, 'utf-8'),
			fileUrl,
		});

		const filePath = fileURLToPath(fileUrl);
		const resolvedId = slug || id;

		const parsedData = await parseData({
			id: resolvedId,
			data,
			filePath,
		});

		store.set(resolvedId, parsedData, body, filePath);
	}

	return {
		name: 'glob-loader',
		load: async (options) => {
			const { settings, logger, watcher } = options;

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
			options.store.clear();
			await Promise.all(
				files.map((file) =>
					limit(async () => {
						const entryType = configForFile(file);
						const fileURL = new URL(file, baseDir);
						const slug = generateSlugDefault(fileURL, baseDir);
						await syncData(slug, fileURL, options, entryType);
					})
				)
			);

			const matcher: RegExp = micromatch.makeRe(globOptions.pattern);

			const matchesGlob = (entry: string) => !entry.startsWith('../') && matcher.test(entry);

			const basePath = fileURLToPath(baseDir);

			async function onChange(changedPath: string) {
				const entry = relative(basePath, changedPath);
				if (!matchesGlob(entry)) {
					return;
				}
				const entryType = configForFile(changedPath);
				const changedFile = pathToFileURL(changedPath);
				const slug = generateSlugDefault(changedFile, baseDir);
				await syncData(slug, changedFile, options, entryType);
			}
			watcher?.on('change', onChange);

			watcher?.on('add', onChange);

			watcher?.on('unlink', async (deletedPath) => {
				const entry = relative(basePath, deletedPath);
				if (!matchesGlob(entry)) {
					return;
				}
				const slug = generateSlugDefault(pathToFileURL(deletedPath), baseDir);
				options.store.delete(slug);
			});
		},
	};
}
