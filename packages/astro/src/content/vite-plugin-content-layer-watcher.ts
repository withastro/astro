import type { Plugin } from 'vite';
import { collectErrorMetadata } from '../core/errors/dev/utils.js';
import { createSafeError } from '../core/errors/index.js';
import type { AstroLogger } from '../core/logger/core.js';
import { formatErrorMessage } from '../core/messages/runtime.js';
import type { AstroSettings } from '../types/astro.js';
import { globalContentLayer } from './instance.js';

interface AstroContentLayerWatcherPluginParams {
	settings: AstroSettings;
	logger: AstroLogger;
}

/**
 * Keeps the content layer subscribed to the dev server's file watcher across restarts.
 *
 * Every Vite restart (config changes, `server.restart()` calls from plugins or integrations,
 * Vite's own restarts) closes the old watcher and creates a new server with a new one.
 * Loaders still subscribed to the old watcher would silently stop seeing file changes.
 */
export function astroContentLayerWatcherPlugin({
	settings,
	logger,
}: AstroContentLayerWatcherPluginParams): Plugin {
	return {
		name: 'astro:content-layer-watcher',
		async configureServer(server) {
			// A failing sync must not abort the restart,
			// which would leave the old server running.
			try {
				// On the initial startup there is no content layer yet;
				// `dev()` creates it after the server.
				await globalContentLayer.get()?.rewatch({ settings, watcher: server.watcher });
			} catch (err) {
				const error = createSafeError(err);
				logger.error(
					'content',
					formatErrorMessage(collectErrorMetadata(error), logger.level() === 'debug') + '\n',
				);
			}
		},
	};
}
