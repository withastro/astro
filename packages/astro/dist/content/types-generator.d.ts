import type fsMod from 'node:fs';
import { type ViteDevServer } from 'vite';
import type { AstroLogger } from '../core/logger/core.js';
import type { AstroSettings } from '../types/astro.js';
import { type ContentObservable } from './utils.js';
type ChokidarEvent = 'add' | 'addDir' | 'change' | 'unlink' | 'unlinkDir';
type RawContentEvent = {
	name: ChokidarEvent;
	entry: string;
};
type CreateContentGeneratorParams = {
	contentConfigObserver: ContentObservable;
	logger: AstroLogger;
	settings: AstroSettings;
	/** This is required for loading the content config */
	viteServer: ViteDevServer;
	fs: typeof fsMod;
};
export declare function createContentTypesGenerator({
	contentConfigObserver,
	fs,
	logger,
	settings,
	viteServer,
}: CreateContentGeneratorParams): Promise<{
	init: () => Promise<void>;
	queueEvent: (rawEvent: RawContentEvent) => void;
}>;
export {};
