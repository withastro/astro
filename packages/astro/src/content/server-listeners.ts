import { bold, cyan } from 'kleur/colors';
import type fsMod from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import type { ViteDevServer } from 'vite';
import type { AstroSettings } from '../@types/astro.js';
import { loadTSConfig } from '../core/config/tsconfig.js';
import { info, warn, type LogOptions } from '../core/logger/core.js';
import { createCollectionTypesGenerator } from './types-generator.js';
import {
	getContentPaths,
	globalContentConfigObserver,
	type ContentPaths,
	getCollectionDirByUrl,
} from './utils.js';
import { rootRelativePath } from '../core/util.js';

interface ContentServerListenerParams {
	fs: typeof fsMod;
	logging: LogOptions;
	settings: AstroSettings;
	viteServer: ViteDevServer;
}

export async function attachContentServerListeners({
	viteServer,
	fs,
	logging,
	settings,
}: ContentServerListenerParams) {
	const contentPaths = getContentPaths(settings.config, fs);
	const { root } = settings.config;
	const existentDirs = [contentPaths.contentDir, contentPaths.dataDir].filter((p) =>
		fs.existsSync(p)
	);

	if (existentDirs.length) {
		info(
			logging,
			'content',
			`Watching ${bold(
				cyan(existentDirs.map((dir) => rootRelativePath(root, dir, false)).join(' and '))
			)} for changes`
		);
		const maybeTsConfigStats = getTSConfigStatsWhenAllowJsFalse({ contentPaths, settings });
		if (maybeTsConfigStats) warnAllowJsIsFalse({ ...maybeTsConfigStats, logging });
		await attachListeners();
	} else {
		viteServer.watcher.on('addDir', dirListeners);
		// TODO: clean up a bit
		let attached = false;
		let foundContentDir = false;
		let foundDataDir = false;
		async function dirListeners(dir: string) {
			const collectionDir = getCollectionDirByUrl(pathToFileURL(dir), contentPaths);
			if (collectionDir === 'content') foundContentDir = true;
			if (collectionDir === 'data') foundDataDir = true;
			if (collectionDir) {
				info(
					logging,
					'content',
					`Watching ${cyan(
						rootRelativePath(
							collectionDir === 'content' ? contentPaths.contentDir : contentPaths.dataDir,
							root
						)
					)} for changes`
				);
				if (!attached) {
					await attachListeners();
					attached = true;
				}
				if (foundContentDir && foundDataDir) {
					viteServer.watcher.removeListener('addDir', dirListeners);
				}
			}
		}
	}

	async function attachListeners() {
		const typesGenerator = await createCollectionTypesGenerator({
			fs,
			settings,
			logging,
			viteServer,
			contentConfigObserver: globalContentConfigObserver,
		});
		await typesGenerator.init();
		info(logging, 'content', 'Types generated');

		viteServer.watcher.on('add', (entry) => {
			typesGenerator.queueEvent({ name: 'add', entry });
		});
		viteServer.watcher.on('addDir', (entry) =>
			typesGenerator.queueEvent({ name: 'addDir', entry })
		);
		viteServer.watcher.on('change', (entry) =>
			typesGenerator.queueEvent({ name: 'change', entry })
		);
		viteServer.watcher.on('unlink', (entry) => {
			typesGenerator.queueEvent({ name: 'unlink', entry });
		});
		viteServer.watcher.on('unlinkDir', (entry) =>
			typesGenerator.queueEvent({ name: 'unlinkDir', entry })
		);
	}
}

function warnAllowJsIsFalse({
	logging,
	tsConfigFileName,
	contentConfigFileName,
}: {
	logging: LogOptions;
	tsConfigFileName: string;
	contentConfigFileName: string;
}) {
	if (!['info', 'warn'].includes(logging.level))
		warn(
			logging,
			'content',
			`Make sure you have the ${bold('allowJs')} compiler option set to ${bold(
				'true'
			)} in your ${bold(tsConfigFileName)} file to have autocompletion in your ${bold(
				contentConfigFileName
			)} file.
See ${bold('https://www.typescriptlang.org/tsconfig#allowJs')} for more information.
			`
		);
}

function getTSConfigStatsWhenAllowJsFalse({
	contentPaths,
	settings,
}: {
	contentPaths: ContentPaths;
	settings: AstroSettings;
}) {
	const isContentConfigJsFile = ['.js', '.mjs'].some((ext) =>
		contentPaths.config.url.pathname.endsWith(ext)
	);
	if (!isContentConfigJsFile) return;

	const inputConfig = loadTSConfig(fileURLToPath(settings.config.root), false);
	const tsConfigFileName = inputConfig.exists && inputConfig.path.split(path.sep).pop();
	if (!tsConfigFileName) return;

	const contentConfigFileName = contentPaths.config.url.pathname.split(path.sep).pop()!;
	const allowJSOption = inputConfig?.config?.compilerOptions?.allowJs;
	const hasAllowJs =
		allowJSOption === true || (tsConfigFileName === 'jsconfig.json' && allowJSOption !== false);
	if (hasAllowJs) return;

	return { tsConfigFileName, contentConfigFileName };
}
