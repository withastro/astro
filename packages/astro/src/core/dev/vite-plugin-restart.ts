import type { Plugin } from 'vite';

/**
 * Symbol used to store the restart handler on the Vite server object.
 * This allows external code (like the container restart logic) to set
 * a custom restart handler without replacing `viteServer.restart` directly.
 */
export const kSetRestartHandler = Symbol.for('astro.setRestartHandler');

declare module 'vite' {
	interface ViteDevServer {
		[kSetRestartHandler]?: (handler: (() => Promise<void>) | null) => void;
	}
}

/**
 * Vite plugin that wraps `viteServer.restart` with a configurable handler.
 *
 * This plugin must be registered BEFORE integration plugins (like @cloudflare/vite-plugin)
 * so that when those plugins wrap `viteServer.restart` to track restart state, they capture
 * this plugin's wrapper rather than Vite's original restart. This ensures that when Astro
 * performs its own container-based restart (close + recreate), plugins that rely on
 * `viteServer.restart` wrapping (e.g., to set `isRestartingDevServer`) still function correctly.
 *
 * Without this, Astro's direct replacement of `viteServer.restart` in `setupContainer()`
 * would bypass any wrappers installed by plugins during `configureServer`, causing issues
 * like the @cloudflare/vite-plugin disposing miniflare during restarts.
 */
export function vitePluginRestart(): Plugin {
	return {
		name: 'astro:restart',
		configureServer(server) {
			const originalRestart = server.restart.bind(server);
			let customRestartHandler: (() => Promise<void>) | null = null;

			// Expose a way for external code to set the restart handler
			server[kSetRestartHandler] = (handler: (() => Promise<void>) | null) => {
				customRestartHandler = handler;
			};

			// Replace restart with our delegating wrapper.
			// Plugins that run after this (e.g., @cloudflare/vite-plugin) will capture
			// this function when they wrap `viteServer.restart`, ensuring their
			// pre/post hooks (like beginRestartingDevServer/endRestartingDevServer)
			// are called even when Astro uses a custom restart handler.
			server.restart = async () => {
				if (customRestartHandler) {
					await customRestartHandler();
				} else {
					await originalRestart();
				}
			};
		},
	};
}
