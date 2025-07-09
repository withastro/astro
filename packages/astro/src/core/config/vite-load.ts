import type fsType from 'node:fs';
import { pathToFileURL } from 'node:url';
import { createServer, type ViteDevServer } from 'vite';
import loadFallbackPlugin from '../../vite-plugin-load-fallback/index.js';
import { debug } from '../logger/core.js';

async function createViteServer(root: string, fs: typeof fsType): Promise<ViteDevServer> {
	const viteServer = await createServer({
		configFile: false,
		server: { middlewareMode: true, hmr: false, watch: null, ws: false },
		optimizeDeps: { noDiscovery: true },
		clearScreen: false,
		appType: 'custom',
		ssr: { external: true },
		plugins: [loadFallbackPlugin({ fs, root: pathToFileURL(root) })],
	});

	return viteServer;
}

interface LoadConfigWithViteOptions {
	root: string;
	configPath: string;
	fs: typeof fsType;
}

export async function loadConfigWithVite({
	configPath,
	fs,
	root,
}: LoadConfigWithViteOptions): Promise<Record<string, any>> {
	if (/\.[cm]?js$/.test(configPath)) {
		try {
			const config = await import(pathToFileURL(configPath).toString() + '?t=' + Date.now());
			return config.default ?? {};
		} catch (e) {
			// Normally we silently ignore loading errors here because we'll try loading it again below using Vite
			// However, if the error is because of addons being disabled we rethrow it immediately,
			// because when this happens in Stackblitz, the Vite error below will be uncatchable
			// and we want to provide a more helpful error message.
			if (e && typeof e === 'object' && 'code' in e && e.code === 'ERR_DLOPEN_DISABLED') {
				throw e;
			}
			// We do not need to throw the error here as we have a Vite fallback below
			debug('Failed to load config with Node', e);
		}
	}

	// Try Loading with Vite
	let server: ViteDevServer | undefined;
	try {
		server = await createViteServer(root, fs);
		const mod = await server.ssrLoadModule(configPath, { fixStacktrace: true });
		return mod.default ?? {};
	} finally {
		if (server) {
			await server.close();
		}
	}
}
