import type { AstroConfig } from 'astro';
import { loadEnv } from 'vite';
import { createRemoteDatabaseClient as runtimeCreateRemoteDatabaseClient } from './utils-runtime.js';

export type VitePlugin = Required<AstroConfig['vite']>['plugins'][number];

export function getAstroStudioEnv(envMode = ''): Record<`ASTRO_STUDIO_${string}`, string> {
	const env = loadEnv(envMode, process.cwd(), 'ASTRO_STUDIO_');
	return env;
}

export function getRemoteDatabaseUrl(): string {
	const env = getAstroStudioEnv();
	return env.ASTRO_STUDIO_REMOTE_DB_URL;
}

export function createRemoteDatabaseClient(appToken: string) {
	return runtimeCreateRemoteDatabaseClient(appToken, getRemoteDatabaseUrl());
}
