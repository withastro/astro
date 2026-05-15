import { createServer } from 'vite';
async function createMinimalViteDevServer(plugins = []) {
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
export { createMinimalViteDevServer };
