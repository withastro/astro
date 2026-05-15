import type { AstroConfig, AstroIntegration } from 'astro';
import type { Arguments } from 'yargs-parser';
import './types.js';
export type VitePlugin = Required<AstroConfig['vite']>['plugins'][number];
export declare function getAstroEnv(envMode?: string): Record<`ASTRO_${string}`, string>;
export type RemoteDatabaseInfo = {
	url: string;
	token: string;
};
export declare function getRemoteDatabaseInfo(): RemoteDatabaseInfo;
export declare function resolveDbAppToken(flags: Arguments, envToken: string): string;
export declare function resolveDbAppToken(
	flags: Arguments,
	envToken: string | undefined,
): string | undefined;
export declare function getDbDirectoryUrl(root: URL | string): URL;
export declare function defineDbIntegration(integration: AstroIntegration): AstroIntegration;
/**
 * Map an object's values to a new set of values
 * while preserving types.
 */
export declare function mapObject<T, U = T>(
	item: Record<string, T>,
	callback: (key: string, value: T) => U,
): Record<string, U>;
