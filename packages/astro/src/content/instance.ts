import type { FSWatcher } from 'vite';
import { ContentLayer } from './content-layer.js';
import type { AstroLogger } from '../core/logger/core.js';
import type { AstroSettings } from '../types/astro.js';
import type { ExternalDataStore } from './external-data-store.js';
import type { MutableDataStore } from './mutable-data-store.js';

interface ContentLayerOptions {
	store: MutableDataStore;
	externalStore?: ExternalDataStore;
	settings: AstroSettings;
	logger: AstroLogger;
	watcher?: FSWatcher;
	force?: boolean;
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
