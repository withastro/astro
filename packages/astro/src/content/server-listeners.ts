import { bold, cyan } from 'kleur/colors';
import type fsMod from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import type { ViteDevServer } from 'vite';
import type { AstroSettings } from '../@types/astro.js';
import { loadTSConfig } from '../core/config/tsconfig.js';
import type { Logger } from '../core/logger/core.js';
import { appendForwardSlash } from '../core/path.js';
import { createContentTypesGenerator } from './types-generator.js';
import { getContentPaths, globalContentConfigObserver, type ContentPaths } from './utils.js';

interface ContentServerListenerParams {
	fs: typeof fsMod;
	logger: Logger;
	settings: AstroSettings;
	viteServer: ViteDevServer;
}

export async function attachContentServerListeners({
	viteServer,
	fs,
	logger,
	settings,
}: ContentServerListenerParams) {
	const contentPaths = getContentPaths(settings.config, fs);

	if (fs.existsSync(contentPaths.contentDir)) {
		logger.info(
			'content',
			`Watching ${cyan(
				contentPaths.contentDir.href.replace(settings.config.root.href, '')
			)} for changes`
		);
		const maybeTsConfigStats = getTSConfigStatsWhenAllowJsFalse({ contentPaths, settings });
		if (maybeTsConfigStats) warnAllowJsIsFalse({ ...maybeTsConfigStats, logger });
		await attachListeners();
	} else {
		viteServer.watcher.on('addDir', contentDirListener);
		async function contentDirListener(dir: string) {
			if (appendForwardSlash(pathToFileURL(dir).href) === contentPaths.contentDir.href) {
				logger.info('content', `Content dir found. Watching for changes`);
				await attachListeners();
				viteServer.watcher.removeListener('addDir', contentDirListener);
			}
		}
	}

	async function attachListeners() {
		const contentGenerator = await createContentTypesGenerator({
			fs,
			settings,
			logger,
			viteServer,
			contentConfigObserver: globalContentConfigObserver,
		});
		await contentGenerator.init();
		logger.info('content', 'Types generated');

		viteServer.watcher.on('add', (entry) => {
			contentGenerator.queueEvent({ name: 'add', entry });
		});
		viteServer.watcher.on('addDir', (entry) =>
			contentGenerator.queueEvent({ name: 'addDir', entry })
		);
		viteServer.watcher.on('change', (entry) =>
			contentGenerator.queueEvent({ name: 'change', entry })
		);
		viteServer.watcher.on('unlink', (entry) => {
			contentGenerator.queueEvent({ name: 'unlink', entry });
		});
		viteServer.watcher.on('unlinkDir', (entry) =>
			contentGenerator.queueEvent({ name: 'unlinkDir', entry })
		);
	}
}

function warnAllowJsIsFalse({
	logger,
	tsConfigFileName,
	contentConfigFileName,
}: {
	logger: Logger;
	tsConfigFileName: string;
	contentConfigFileName: string;
}) {
	logger.warn(
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
