import { fileURLToPath } from 'node:url';
import { builtinDrivers } from 'unstorage';
import type { Plugin as VitePlugin } from 'vite';
import type { AstroSettings } from '../types/astro.js';

const SESSION_DRIVER_ID = '@astro-session-driver';
const RESOLVED_SESSION_DRIVER_ID = `\0${SESSION_DRIVER_ID}`;

export default function vitePluginSessions({ settings }: { settings: AstroSettings }): VitePlugin {
	return {
		name: 'astro:vite-plugin-sessions',
		enforce: 'pre',
		async resolveId(source) {
			if (source === SESSION_DRIVER_ID) {
				return RESOLVED_SESSION_DRIVER_ID;
			}
			// Resolve the driver entrypoint so that we bundle it
			if (source.startsWith('unstorage/drivers/')) {
				return fileURLToPath(import.meta.resolve(source));
			}
		},
		async load(id) {
			if (id === RESOLVED_SESSION_DRIVER_ID) {
				let driver = settings.config.experimental?.session?.driver;
				if (driver && driver in builtinDrivers) {
					if (driver === 'fs') {
						// fs tries to bundle chokidar (and therefore fsevents), which is a binary
						driver = 'fsLite';
					}
					driver = builtinDrivers[driver as keyof typeof builtinDrivers];
				}
				if (!driver) {
					return `export default function driver() { return null }`;
				}
				const resolved = await this.resolve(driver, undefined, { skipSelf: false });
				if (!resolved) {
					throw new Error(`Could not resolve session driver ${driver}`);
				}
				return `export { default } from ${JSON.stringify(resolved?.id)};`;
			}
		},
	};
}
