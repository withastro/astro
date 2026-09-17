import type { Plugin } from 'vite';
import type { SqliteDriver } from './drivers/types.js';
import { LOCAL_CLIENT_PROVIDER_KEY } from './runtime/types.js';

const VIRTUAL_ID = 'virtual:@astrojs/sqlite/client';
const RESOLVED_VIRTUAL_ID = `\0${VIRTUAL_ID}`;

interface PluginOptions {
	driver: SqliteDriver;
	tablePrefix: string;
	command: 'dev' | 'build' | 'preview' | 'sync';
}

/**
 * Provides `virtual:@astrojs/sqlite/client`, which the loader uses to get a
 * database client. While the integration is running (dev, and prerendering
 * during build) the client is the local database it keeps in sync. In the
 * deployed server bundle it is the driver's runtime client.
 */
export function vitePlugin({ driver, tablePrefix, command }: PluginOptions): Plugin {
	return {
		name: '@astrojs/sqlite:client',
		resolveId(id) {
			if (id === VIRTUAL_ID) return RESOLVED_VIRTUAL_ID;
		},
		load(id) {
			if (id !== RESOLVED_VIRTUAL_ID) return;
			const key = `Symbol.for(${JSON.stringify(LOCAL_CLIENT_PROVIDER_KEY.description)})`;
			if (command !== 'build') {
				return `
export const tablePrefix = ${JSON.stringify(tablePrefix)};
export async function getClient() {
	const provider = globalThis[${key}];
	if (!provider) {
		throw new Error('[@astrojs/sqlite] The local database is not available. Make sure the @astrojs/sqlite integration is added to your Astro config.');
	}
	return provider.get();
}
`;
			}
			return `
import { createClient } from ${JSON.stringify(driver.runtime.entrypoint)};
export const tablePrefix = ${JSON.stringify(tablePrefix)};
const options = ${JSON.stringify(driver.runtime.options)};
let client;
export async function getClient() {
	// Set by the integration while prerendering, so build-time reads never touch the deployed database.
	const provider = globalThis[${key}];
	if (provider) return provider.get();
	client ??= createClient(options, { moduleUrl: import.meta.url });
	return client;
}
`;
		},
	};
}
