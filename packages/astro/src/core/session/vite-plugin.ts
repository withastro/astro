import { fileURLToPath } from 'node:url';
import type { Plugin as VitePlugin } from 'vite';
import type { AstroSettings } from '../../types/astro.js';
import { SessionStorageInitError } from '../errors/errors-data.js';
import { AstroError } from '../errors/index.js';
import { normalizeSessionDriverConfig } from './utils.js';

export const VIRTUAL_SESSION_DRIVER_ID = 'virtual:astro:session-driver';
const RESOLVED_VIRTUAL_SESSION_DRIVER_ID = '\0' + VIRTUAL_SESSION_DRIVER_ID;

export function vitePluginSessionDriver({ settings }: { settings: AstroSettings }): VitePlugin {
	return {
		name: VIRTUAL_SESSION_DRIVER_ID,
		enforce: 'pre',

		resolveId: {
			filter: {
				id: new RegExp(`^${VIRTUAL_SESSION_DRIVER_ID}$`),
			},
			handler() {
				return RESOLVED_VIRTUAL_SESSION_DRIVER_ID;
			},
		},

		load: {
			filter: {
				id: new RegExp(`^${RESOLVED_VIRTUAL_SESSION_DRIVER_ID}$`),
			},
			async handler() {
				if (!settings.config.session) {
					return { code: 'export default null;' };
				}

				const driver = normalizeSessionDriverConfig(
					settings.config.session.driver,
					settings.config.session.options,
				);
				const importerPath = fileURLToPath(import.meta.url);
				const resolved = await this.resolve(
					driver.entrypoint instanceof URL ? fileURLToPath(driver.entrypoint) : driver.entrypoint,
					importerPath,
				);
				if (!resolved) {
					throw new AstroError({
						...SessionStorageInitError,
						message: SessionStorageInitError.message(
							`Failed to resolve session driver: ${driver.name}`,
							driver.name,
						),
					});
				}
				return {
					code: `import { default as _default } from '${resolved.id}';\nexport * from '${resolved.id}';\nexport default _default;`,
				};
			},
		},
	};
}
