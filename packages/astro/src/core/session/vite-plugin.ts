import { type BuiltinDriverName, builtinDrivers } from 'unstorage';
import type { Plugin as VitePlugin } from 'vite';
import type { AstroSettings } from '../../types/astro.js';

export const VIRTUAL_SESSION_DRIVER_ID = 'virtual:astro:session-driver';
const RESOLVED_VIRTUAL_SESSION_DRIVER_ID = '\0' + VIRTUAL_SESSION_DRIVER_ID;

export function vitePluginSessionDriver({ settings }: { settings: AstroSettings }): VitePlugin {
	return {
		name: VIRTUAL_SESSION_DRIVER_ID,
		enforce: 'pre',

		async resolveId(id) {
			if (id === VIRTUAL_SESSION_DRIVER_ID) {
				if (settings.config.session) {
					if (settings.config.session.driver === 'fs') {
						return await this.resolve(builtinDrivers.fsLite);
					}
					if (settings.config.session.driver && settings.config.session.driver in builtinDrivers) {
						return await this.resolve(
							builtinDrivers[settings.config.session.driver as BuiltinDriverName],
						);
					}
				} else {
					return RESOLVED_VIRTUAL_SESSION_DRIVER_ID;
				}
			}
		},

		async load(id) {
			if (id === RESOLVED_VIRTUAL_SESSION_DRIVER_ID) {
				return { code: 'export default null;' };
			}
		},
	};
}
