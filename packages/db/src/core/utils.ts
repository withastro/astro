import type { AstroConfig, AstroIntegration } from 'astro';
import { loadEnv } from 'vite';
import type { AstroDbIntegration } from './types.js';

export type VitePlugin = Required<AstroConfig['vite']>['plugins'][number];

export function getAstroStudioEnv(envMode = ''): Record<`ASTRO_STUDIO_${string}`, string> {
	const env = loadEnv(envMode, process.cwd(), 'ASTRO_STUDIO_');
	return env;
}

export function getRemoteDatabaseUrl(): string {
	const env = getAstroStudioEnv();
	return env.ASTRO_STUDIO_REMOTE_DB_URL || 'https://db.services.astro.build';
}

export function getAstroStudioUrl(): string {
	const env = getAstroStudioEnv();
	return env.ASTRO_STUDIO_URL || 'https://studio.astro.build';
}

export function getDbDirectoryUrl(root: URL | string) {
	return new URL('db/', root);
}

export function defineDbIntegration(integration: AstroDbIntegration): AstroIntegration {
	return integration;
}

export type Result<T> = { success: true; data: T } | { success: false; data: unknown };
