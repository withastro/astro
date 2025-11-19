import type { Logger } from '../core/logger/core.js';
import type * as vite from 'vite';

export const ASTRO_LOGGER_ID = 'virtual:astro:logger';

let currentLogger: Logger | null = null;

export function setCurrentLogger(logger: Logger) {
	currentLogger = logger;
}

export function vitePluginLogger(): vite.Plugin {
	return {
		name: 'astro:logger',
		applyToEnvironment(environment) {
			return environment.name === 'ssr';
		},
		resolveId(id) {
			if (id === ASTRO_LOGGER_ID) {
				return id;
			}
		},
		load(id) {
			if (id === ASTRO_LOGGER_ID) {
				// Set the global logger when module is loaded
				if (currentLogger && !(globalThis as any).__astroLogger) {
					(globalThis as any).__astroLogger = currentLogger;
				}
				return `
// Get the logger from the global registry set by the plugin
const logger = globalThis.__astroLogger;

if (!logger) {
	throw new Error('Logger not found in global registry. This should not happen.');
}

export { logger };
`;
			}
		},
		configureServer() {
			// Set the logger in global context when server starts
			if (currentLogger) {
				(globalThis as any).__astroLogger = currentLogger;
			}
		},
	};
}
