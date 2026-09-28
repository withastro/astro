import type fsMod from 'node:fs';
import type { ViteDevServer } from 'vite';
import type { AstroLogger } from '../core/logger/core.js';
import type { AstroSettings } from '../types/astro.js';
import { attachDataStoreInvalidation } from './vite-plugin-content-virtual-mod.js';
import { globalContentLayer } from './instance.js';
import { MutableDataStore } from './mutable-data-store.js';
import { getDataStoreChunkSize, getDataStoreDir, getDataStoreFile } from './paths.js';
import { attachContentServerListeners } from './server-listeners.js';
import { globalContentConfigObserver } from './utils.js';

/**
 * Sets up content collections on a dev server: opens the data store, generates content
 * types and keeps them updated from the watcher, then runs the content layer loaders.
 * Resolves once the initial sync is done.
 */
export async function setupDevContent({
	settings,
	logger,
	fs,
	viteServer,
}: {
	settings: AstroSettings;
	logger: AstroLogger;
	fs: typeof fsMod;
	viteServer: ViteDevServer;
}): Promise<void> {
	let store: MutableDataStore | undefined;
	try {
		const chunkSize = getDataStoreChunkSize(settings);
		if (chunkSize !== undefined) {
			const dataStoreDir = getDataStoreDir(settings, true);
			store = await MutableDataStore.fromDir(dataStoreDir, chunkSize, logger);
		} else {
			const dataStoreFile = getDataStoreFile(settings, true);
			store = await MutableDataStore.fromFile(dataStoreFile);
		}
	} catch (err: any) {
		logger.error('content', err.message);
	}

	if (!store) {
		logger.error('content', 'Failed to create data store');
	} else {
		// Invalidate the content virtual modules directly when the store is
		// written, rather than relying on the file watcher to observe the write.
		// On Windows the watcher can miss it, leaving dev serving stale content.
		attachDataStoreInvalidation(store, viteServer, settings);
	}
	await attachContentServerListeners({ viteServer, fs, logger, settings });

	const config = globalContentConfigObserver.get();
	if (config.status === 'error') {
		logger.error('content', config.error.message);
	}
	if (config.status === 'loaded' && store) {
		const contentLayer = globalContentLayer.init({
			settings,
			logger,
			watcher: viteServer.watcher,
			store,
		});
		contentLayer.watchContentConfig();
		await contentLayer.sync();
	} else if (config.status !== 'does-not-exist') {
		logger.warn('content', 'Content config not loaded');
	}
}
