import fsMod from 'node:fs';
import { type FSWatcher } from 'vite';
import type { AstroSettings } from '../../types/astro.js';
import type { AstroInlineConfig } from '../../types/public/config.js';
import type { AstroLogger } from '../logger/core.js';
type SyncOptions = {
	mode: string;
	logger: AstroLogger;
	settings: AstroSettings;
	force?: boolean;
	skip?: {
		content?: boolean;
		cleanup?: boolean;
	};
	command: 'build' | 'dev' | 'sync';
	watcher?: FSWatcher;
};
export default function sync(
	inlineConfig: AstroInlineConfig,
	{
		fs,
		telemetry: _telemetry,
	}?: {
		fs?: typeof fsMod;
		telemetry?: boolean;
	},
): Promise<void>;
/**
 * Clears the content layer and content collection cache, forcing a full rebuild.
 */
export declare function clearContentLayerCache({
	settings,
	logger,
	fs,
	isDev,
}: {
	settings: AstroSettings;
	logger: AstroLogger;
	fs?: typeof fsMod;
	isDev: boolean;
}): Promise<void>;
/**
 * Generates TypeScript types for all Astro modules. This sets up a `src/env.d.ts` file for type inferencing,
 * and defines the `astro:content` module for the Content Collections API.
 *
 * @experimental The JavaScript API is experimental
 */
export declare function syncInternal({
	mode,
	logger,
	fs,
	settings,
	skip,
	force,
	command,
	watcher,
}: SyncOptions): Promise<void>;
export {};
