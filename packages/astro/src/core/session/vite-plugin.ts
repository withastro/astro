import { type BuiltinDriverName, builtinDrivers } from 'unstorage';
import type { Plugin as VitePlugin } from 'vite';
import type { AstroSettings } from '../../types/astro.js';

export const VIRTUAL_SESSION_DRIVER_ID = 'virtual:astro:session-driver';
export const RESOLVED_VIRTUAL_SESSION_DRIVER_ID = '\0' + VIRTUAL_SESSION_DRIVER_ID;

function resolveSessionDriver(driver: string | undefined): string | null {
	if (!driver) {
		return null;
	}
	try {
		if (driver === 'fs') {
			return import.meta.resolve(builtinDrivers.fsLite, import.meta.url);
		}
		if (driver in builtinDrivers) {
			return import.meta.resolve(builtinDrivers[driver as BuiltinDriverName], import.meta.url);
		}
	} catch {
		return null;
	}

	return driver;
}

export function vitePluginSessionDriver({ settings }: { settings: AstroSettings }): VitePlugin {
	return {
		name: '@astro/plugin-session-driver',
		enforce: 'pre',

		resolveId(id) {
			if (id === VIRTUAL_SESSION_DRIVER_ID) {
				return RESOLVED_VIRTUAL_SESSION_DRIVER_ID;
			}
		},

		load(id) {
			if (id === RESOLVED_VIRTUAL_SESSION_DRIVER_ID) {
				const resolvedDriver = resolveSessionDriver(settings.config.session?.driver);

				if (!resolvedDriver) {
					// No driver configured - export null
					// Will error at runtime when session is created (existing behavior)
					return { code: 'export default null;' };
				}

				// Re-export the driver module
				return { code: `export { default } from ${JSON.stringify(resolvedDriver)};` };
			}
		},
	};
}
