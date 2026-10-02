import { fileURLToPath } from 'node:url';
import type { Plugin as VitePlugin } from 'vite';
import { AstroError, AstroErrorData } from '../core/errors/index.js';
import type { AstroSettings } from '../types/astro.js';
import {
	CONTENT_STORAGE_DRIVER_VIRTUAL_ID,
	RESOLVED_CONTENT_STORAGE_DRIVER_VIRTUAL_ID,
} from './consts.js';

/**
 * Provides the virtual module whose default export returns the driver configured in
 * `experimental.collectionStorage`, or is `undefined` when no driver is configured.
 * The driver is created on the first call and shared by later calls.
 */
export function vitePluginContentStorageDriver({
	settings,
}: {
	settings: AstroSettings;
}): VitePlugin {
	return {
		name: CONTENT_STORAGE_DRIVER_VIRTUAL_ID,
		enforce: 'pre',

		resolveId: {
			filter: {
				id: new RegExp(`^${CONTENT_STORAGE_DRIVER_VIRTUAL_ID}$`),
			},
			handler() {
				return RESOLVED_CONTENT_STORAGE_DRIVER_VIRTUAL_ID;
			},
		},

		load: {
			filter: {
				id: new RegExp(`^${RESOLVED_CONTENT_STORAGE_DRIVER_VIRTUAL_ID}$`),
			},
			async handler() {
				const storage = settings.config.experimental.collectionStorage;
				if (typeof storage !== 'object' || storage.type !== 'external' || !storage.driver) {
					return { code: 'export default undefined;' };
				}
				const { entrypoint, config } = storage.driver;
				const specifier = entrypoint instanceof URL ? fileURLToPath(entrypoint) : entrypoint;
				// Use the project root as the importer so that drivers resolve from the project's
				// node_modules, not from astro core's location.
				const importerPath = fileURLToPath(new URL('package.json', settings.config.root));
				let resolved;
				try {
					resolved = await this.resolve(specifier, importerPath);
				} catch {
					// Resolution can throw for invalid package specifiers
				}
				if (!resolved) {
					throw new AstroError({
						...AstroErrorData.ContentStorageDriverNotFound,
						message: AstroErrorData.ContentStorageDriverNotFound.message(specifier),
					});
				}
				// This module isn't invalidated when content changes in dev, unlike the data store
				// module that imports it, so the driver is created once per server.
				return {
					code: [
						`import createDriver from ${JSON.stringify(resolved.id)};`,
						'let driver;',
						'export default function getContentStorageDriver() {',
						`\treturn (driver ??= Promise.resolve(createDriver(${JSON.stringify(config) ?? 'undefined'})));`,
						'}',
					].join('\n'),
				};
			},
		},
	};
}
