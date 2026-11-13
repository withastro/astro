import { createServer, type ViteDevServer, type Plugin } from 'vite';

/**
 * Creates a minimal dev server with a list of plugins. Use this instance for a one-shot usage.
 *
 * NOTE: This is intentionally in its own module to avoid pulling `vite`'s heavy `createServer`
 * (and transitively Rollup) into every file that imports from `viteUtils.ts`.
 */
export async function createMinimalViteDevServer(
	plugins: Plugin[] = [],
	root?: string,
): Promise<ViteDevServer> {
	return await createServer({
		root,
		configFile: false,
		server: { middlewareMode: true, hmr: false, watch: null, ws: false },
		optimizeDeps: { noDiscovery: true },
		clearScreen: false,
		appType: 'custom',
		ssr: { external: true },
		resolve: { tsconfigPaths: true },
		plugins,
	});
}
