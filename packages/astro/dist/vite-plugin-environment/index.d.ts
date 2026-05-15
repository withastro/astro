import type * as vite from 'vite';
import type { AstroSettings } from '../types/astro.js';
import type { CrawlFrameworkPkgsResult } from 'vitefu';
interface Payload {
	command: 'dev' | 'build';
	settings: AstroSettings;
	astroPkgsConfig: CrawlFrameworkPkgsResult;
}
/**
 * This plugin is responsible of setting up the environments of the vite server, such as
 * dependencies, SSR, etc.
 *
 */
export declare function vitePluginEnvironment({
	command,
	settings,
	astroPkgsConfig,
}: Payload): vite.Plugin;
export {};
