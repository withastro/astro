import { cyan } from 'kleur/colors';
import type fsMod from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import type { ViteDevServer } from 'vite';
import type { AstroSettings } from '../@types/astro.js';
import { info, LogOptions, warn } from '../core/logger/core.js';
import { appendForwardSlash } from '../core/path.js';
import { createContentTypesGenerator } from './types-generator.js';
import { ContentPaths, getContentPaths, globalContentConfigObserver } from './utils.js';
import { loadTSConfig } from '../core/config/tsconfig.js';

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

	const isContentConfigJsFile = ['.js', '.mjs'].some((ext) =>
		contentPaths.config.url.pathname.endsWith(ext)
	);
	if (isContentConfigJsFile && ['info', 'warn'].includes(logging.level))
		warnDisabledAllowJs({ contentPaths, logging, settings });

	if (fs.existsSync(contentPaths.contentDir)) {
		info(
			logging,
			'content',
			`Watching ${cyan(
				contentPaths.contentDir.href.replace(settings.config.root.href, '')
			)} for changes`
		);
		await attachListeners();
	} else {
		viteServer.watcher.on('addDir', contentDirListener);
		async function contentDirListener(dir: string) {
			if (appendForwardSlash(pathToFileURL(dir).href) === contentPaths.contentDir.href) {
				info(logging, 'content', `Content dir found. Watching for changes`);
				await attachListeners();
				viteServer.watcher.removeListener('addDir', contentDirListener);
			}
		}
	}

	async function attachListeners() {
		const contentGenerator = await createContentTypesGenerator({
			fs,
			settings,
			logging,
			viteServer,
			contentConfigObserver: globalContentConfigObserver,
		});
		await contentGenerator.init();
		info(logging, 'content', 'Types generated');

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

function warnDisabledAllowJs({
	contentPaths,
	logging,
	settings,
}: {
	contentPaths: ContentPaths;
	logging: LogOptions;
	settings: AstroSettings;
}) {
	const inputConfig = loadTSConfig(fileURLToPath(settings.config.root), false);
	const TSConfigFileName = inputConfig.exists && inputConfig.path.split('/').pop();

	if (!TSConfigFileName) return;

	const contentConfigFileName = contentPaths.config.url.pathname.split('/').pop();
	const allowJSOption = inputConfig?.config?.compilerOptions?.allowJs;
	const hasAllowJs =
		allowJSOption === true || (TSConfigFileName === 'jsconfig.json' && allowJSOption !== false);

	if (!hasAllowJs) {
		warn(
			logging,
			'content',
			`You need to have allowJs enabled in your ${TSConfigFileName} to use have autocompletion in your \`${contentConfigFileName}\` file.`
		);
	}
}
