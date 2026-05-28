import { createServer, type ViteDevServer, type Plugin } from 'vite';

/**
 * Creates a minimal dev server with a list of plugins. Use this instance for a one-shot usage.
 *
 * NOTE: This is intentionally in its own module to avoid pulling `vite`'s heavy `createServer`
 * (and transitively Rollup) into every file that imports from `viteUtils.ts`.
 */
export async function createMinimalViteDevServer(plugins: Plugin[] = []): Promise<ViteDevServer> {
	return await createServer({
		configFile: false,
		server: { middlewareMode: true, hmr: false, watch: null, ws: false },
		optimizeDeps: { noDiscovery: true },
		clearScreen: false,
		appType: 'custom',
		ssr: { external: true },
		plugins,
	});
}
