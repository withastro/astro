import type { AstroConfig, AstroIntegration } from 'astro';
import { loadEnv } from 'vite';
import './types.js';

export type VitePlugin = Required<AstroConfig['vite']>['plugins'][number];

export function getAstroEnv(envMode = ''): Record<`ASTRO_${string}`, string> {
	const env = loadEnv(envMode, process.cwd(), 'ASTRO_');
	return env;
}

export type RemoteDatabaseInfo = {
	url: string;
	token: string;
};

export function getRemoteDatabaseInfo(): RemoteDatabaseInfo {
	const astroEnv = getAstroEnv();

	return {
		url: astroEnv.ASTRO_DB_REMOTE_URL,
		token: astroEnv.ASTRO_DB_APP_TOKEN,
	};
}

export function getDbDirectoryUrl(root: URL | string) {
	return new URL('db/', root);
}

export function defineDbIntegration(integration: AstroIntegration): AstroIntegration {
	return integration;
}

/**
 * Map an object's values to a new set of values
 * while preserving types.
 */
export function mapObject<T, U = T>(
	item: Record<string, T>,
	callback: (key: string, value: T) => U,
): Record<string, U> {
	return Object.fromEntries(
		Object.entries(item).map(([key, value]) => [key, callback(key, value)]),
	);
}
