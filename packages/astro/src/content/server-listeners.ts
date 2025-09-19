import type fsMod from 'node:fs';
import type { ViteDevServer } from 'vite';
import type { Logger } from '../core/logger/core.js';
import type { AstroSettings } from '../types/astro.js';
import { createContentTypesGenerator } from './types-generator.js';
import { globalContentConfigObserver } from './utils.js';

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
		const contentGenerator = await createContentTypesGenerator({
			fs,
			settings,
			logger,
			viteServer,
			contentConfigObserver: globalContentConfigObserver,
		});
		await contentGenerator.init();
		logger.debug('content', 'Types generated');

		viteServer.watcher.on('add', (entry) => {
			contentGenerator.queueEvent({ name: 'add', entry });
		});
		viteServer.watcher.on('addDir', (entry) =>
			contentGenerator.queueEvent({ name: 'addDir', entry }),
		);
		viteServer.watcher.on('change', (entry) => {
			contentGenerator.queueEvent({ name: 'change', entry });
		});
		viteServer.watcher.on('unlink', (entry) => {
			contentGenerator.queueEvent({ name: 'unlink', entry });
		});
		viteServer.watcher.on('unlinkDir', (entry) =>
			contentGenerator.queueEvent({ name: 'unlinkDir', entry }),
		);

}
