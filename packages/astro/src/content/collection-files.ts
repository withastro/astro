import type fsMod from 'node:fs';
import { fileURLToPath } from 'node:url';
import { normalizePath, type Plugin, type ViteDevServer } from 'vite';
import { isRunnableDevEnvironment } from 'vite';
import type { AstroSettings } from '../types/astro.js';
import { COLLECTION_FILES_FILE } from './consts.js';
import type { DataEntry } from './data-store.js';
import {
	COLLECTION_FILES_PLUGIN_NAME,
	type CollectionFilesApi,
} from '@astrojs/internal-helpers/collections';
import type { CollectionMetadata } from './metadata.js';

/**
 * The collection of each file compiled as a module when it's rendered, such as MDX and
 * `deferRender` entries, keyed by path relative to the project root.
 */
export type CollectionFiles = Record<string, CollectionMetadata>;

/**
 * Maps the files of entries rendered as modules to their collection. A file loaded by more
 * than one collection is left out, because its module is compiled once for all of them.
 */
export function getCollectionFiles(
	collections: CollectionMetadata[],
	entriesOf: (collection: string) => DataEntry[],
): CollectionFiles {
	const files: CollectionFiles = {};
	const ambiguous = new Set<string>();
	for (const collection of collections) {
		for (const { filePath, deferredRender } of entriesOf(collection.name)) {
			if (!filePath || !deferredRender) continue;
			if (filePath in files && files[filePath].name !== collection.name) {
				ambiguous.add(filePath);
			}
			files[filePath] = collection;
		}
	}
	for (const filePath of ambiguous) delete files[filePath];
	return files;
}

/**
 * Exposes the collection of files compiled as modules to Markdown and MDX plugins through its
 * `api`, from the map written by the last sync. In development, modules whose collection
 * changes are invalidated so they are compiled again.
 */
export function astroCollectionFilesPlugin({
	settings,
	fs,
}: {
	settings: AstroSettings;
	fs: typeof fsMod;
}): Plugin<CollectionFilesApi> {
	const file = new URL(COLLECTION_FILES_FILE, settings.dotAstroDir);
	let files: CollectionFiles | undefined;

	function read(): CollectionFiles {
		return fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf-8')) : {};
	}

	return {
		name: COLLECTION_FILES_PLUGIN_NAME,
		api: {
			getCollection(fileId) {
				if (!settings.config.experimental.collectionMetadata) return undefined;
				files ??= read();
				const path = normalizePath(fileId.split('?')[0]);
				const root = normalizePath(fileURLToPath(settings.config.root));
				return path.startsWith(root) ? files[path.slice(root.length)] : undefined;
			},
		},
		configureServer(server) {
			const filePath = normalizePath(fileURLToPath(file));
			server.watcher.add(filePath);
			const onChange = (changedPath: string) => {
				if (normalizePath(changedPath) !== filePath) return;
				const previous = files ?? {};
				files = read();
				for (const path of new Set([...Object.keys(previous), ...Object.keys(files)])) {
					if (JSON.stringify(previous[path]) !== JSON.stringify(files[path])) {
						// The module graph keys files by their normalized path, with forward slashes on Windows
						invalidateModulesOf(
							server,
							normalizePath(fileURLToPath(new URL(path, settings.config.root))),
						);
					}
				}
			};
			server.watcher.on('add', onChange);
			server.watcher.on('change', onChange);
		},
	};
}

function invalidateModulesOf(server: ViteDevServer, filePath: string) {
	const timestamp = Date.now();
	for (const environment of Object.values(server.environments)) {
		for (const module of environment.moduleGraph.getModulesByFile(filePath) ?? []) {
			environment.moduleGraph.invalidateModule(module, undefined, timestamp, true);
		}
		if (isRunnableDevEnvironment(environment)) {
			for (const module of environment.runner.evaluatedModules.getModulesByFile(filePath) ?? []) {
				environment.runner.evaluatedModules.invalidateModule(module);
			}
		}
	}
}
