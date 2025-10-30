import { fileURLToPath } from 'node:url';
import { type BuiltinDriverName, builtinDrivers } from 'unstorage';
import type { Plugin as VitePlugin } from 'vite';
import type { AstroSettings } from '../../types/astro.js';

const VIRTUAL_SESSION_DRIVER_ID = 'virtual:astro:session-driver';
const RESOLVED_VIRTUAL_SESSION_DRIVER_ID = '\0' + VIRTUAL_SESSION_DRIVER_ID;

export function vitePluginSessionDriver({ settings }: { settings: AstroSettings }): VitePlugin {
	return {
		name: VIRTUAL_SESSION_DRIVER_ID,
		enforce: 'pre',

		async resolveId(id) {
			if (id === VIRTUAL_SESSION_DRIVER_ID) {
				return RESOLVED_VIRTUAL_SESSION_DRIVER_ID;
			}
		},

		async load(id) {
			if (id === RESOLVED_VIRTUAL_SESSION_DRIVER_ID) {
				if (settings.config.session) {
					let sessionDriver: string;
					if (settings.config.session.driver === 'fs') {
						sessionDriver = builtinDrivers.fsLite;
					} else if (settings.config.session.driver && settings.config.session.driver in builtinDrivers) {
						sessionDriver = builtinDrivers[settings.config.session.driver as BuiltinDriverName];
					} else {
						return { code: 'export default null;' };
					}
					const importerPath = fileURLToPath(import.meta.url);
					const resolved = await this.resolve(sessionDriver, importerPath);
					if (!resolved) {
						throw new Error(`Failed to resolve session driver: ${sessionDriver}`);
					}
					return {
						code: `import { default as _default } from '${resolved.id}';\nexport * from '${resolved.id}';\nexport default _default;`,
					};
				} else {
					return { code: 'export default null;' };
				}
			}
		},
	};
}
