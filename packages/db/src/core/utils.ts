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

/**
 * Small wrapper around fetch that throws an error if the response is not OK. Allows for custom error handling as well through the onNotOK callback.
 */
export async function safeFetch(
	url: Parameters<typeof fetch>[0],
	options: Parameters<typeof fetch>[1] = {},
	onNotOK: (response: Response) => void | Promise<void> = () => {
		throw new Error(`Request to ${url} returned a non-OK status code.`);
	}
): Promise<Response> {
	const response = await fetch(url, options);

	if (!response.ok) {
		await onNotOK(response);
	}

	return response;
}

export type Result<T> = { success: true; data: T } | { success: false; data: unknown };
