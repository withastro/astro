import fs from 'node:fs';
import type { AstroConfig, AstroInlineConfig, AstroUserConfig } from '../../types/public/config.js';
export declare function resolveRoot(cwd?: string | URL): string;
interface ResolveConfigPathOptions {
	root: string;
	configFile?: string | false;
	fs: typeof fs;
}
/**
 * Resolve the file URL of the user's `astro.config.js|mjs|ts` file
 */
export declare function resolveConfigPath(
	options: ResolveConfigPathOptions,
): Promise<string | undefined>;
interface ResolveConfigResult {
	userConfig: AstroUserConfig;
	astroConfig: AstroConfig;
}
/**
 * Resolves the Astro config with a given inline config.
 *
 * @param inlineConfig An inline config that takes highest priority when merging and resolving the final config.
 * @param command The running command that uses this config. Usually 'dev' or 'build'.
 */
export declare function resolveConfig(
	inlineConfig: AstroInlineConfig,
	command: string,
	fsMod?: typeof fs,
): Promise<ResolveConfigResult>;
export {};
