import { fileURLToPath, pathToFileURL } from 'url';
import type { Loader, LoaderContext } from './loaders.js';
import { promises as fs } from 'fs';
import fastGlob from 'fast-glob';
import pLimit from 'p-limit';
import { getContentEntryIdAndSlug, getEntryConfigByExtMap } from './utils.js';
import type { ContentEntryType, DataEntryType } from '../@types/astro.js';

export interface GlobOptions {
	/** The glob pattern to match files, relative to the base directory */
	pattern: string;
	/** The base directory to resolve the glob pattern from. Relative to the site root. Defaults to the content directory */
	base?: string;
}

function generateSlug(entry: URL, base: URL) {
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
export function glob(patternOrOptions: string | GlobOptions): Loader {
	const globOptions: GlobOptions =
		typeof patternOrOptions === 'string'
			? {
					pattern: patternOrOptions,
				}
			: patternOrOptions;

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
		entryType?: ContentEntryType | DataEntryType
	) {
		if (!entryType) {
			logger.warn(`No entry type found for ${fileUrl.pathname}`);
			return;
		}
		const info = await entryType.getEntryInfo({
			contents: await fs.readFile(fileUrl, 'utf-8'),
			fileUrl,
		});

		const resolvedId = (info as any).id || (info as any).slug || id;
		console.log('setting', resolvedId, info);
		store.set(resolvedId, { ...info, id: resolvedId });
	}

	return {
		name: 'glob-loader',
		load: async (options) => {
			const { settings, logger, watcher } = options;

			const entryConfigByExt = getEntryConfigByExtMap([
				...settings.contentEntryTypes,
				...settings.dataEntryTypes,
			]);

			const contentDir = new URL('./content/', settings.config.srcDir);

			const baseDir = globOptions.base
				? new URL(globOptions.base, settings.config.root)
				: contentDir;

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
						const slug = generateSlug(fileURL, baseDir);
						await syncData(slug, fileURL, options, entryType);
					})
				)
			);

			watcher?.on('change', async (changedPath) => {
				const entryType = configForFile(changedPath);
				const changedFile = pathToFileURL(changedPath);
				const slug = generateSlug(changedFile, baseDir);
				await syncData(slug, changedFile, options, entryType);
			});

			watcher?.on('unlink', async (deletedPath) => {
				const slug = generateSlug(pathToFileURL(deletedPath), baseDir);
				options.store.delete(slug);
			});
		},
	};
}
