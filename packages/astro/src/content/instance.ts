import type { FSWatcher } from 'vite';
import { ContentLayer } from './content-layer.js';
import type { Logger } from '../core/logger/core.js';
import type { AstroSettings } from '../types/astro.js';
import type { MutableDataStore } from './mutable-data-store.js';

interface ContentLayerOptions {
	store: MutableDataStore;
	settings: AstroSettings;
	logger: Logger;
	watcher?: FSWatcher;
}

function contentLayerSingleton() {
	let instance: ContentLayer | null = null;
	return {
		init: (options: ContentLayerOptions) => {
			instance?.dispose();
			instance = new ContentLayer(options);
			return instance;
		},
		get: () => instance,
		dispose: () => {
			instance?.dispose();
			instance = null;
		},
	};
}

export const globalContentLayer = contentLayerSingleton();
