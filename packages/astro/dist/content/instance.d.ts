import type { FSWatcher } from 'vite';
import { ContentLayer } from './content-layer.js';
import type { AstroLogger } from '../core/logger/core.js';
import type { AstroSettings } from '../types/astro.js';
import type { MutableDataStore } from './mutable-data-store.js';
interface ContentLayerOptions {
	store: MutableDataStore;
	settings: AstroSettings;
	logger: AstroLogger;
	watcher?: FSWatcher;
}
export declare const globalContentLayer: {
	init: (options: ContentLayerOptions) => ContentLayer;
	get: () => ContentLayer | null;
	dispose: () => void;
};
export {};
