import { pathToFileURL } from 'node:url';
import { isRunnableDevEnvironment } from 'vite';
import loadFallbackPlugin from '../../vite-plugin-load-fallback/index.js';
import { debug } from '../logger/core.js';
import { ASTRO_VITE_ENVIRONMENT_NAMES } from '../constants.js';
import { createMinimalViteDevServer } from '../createMinimalViteDevServer.js';
async function loadConfigWithVite({ configPath, fs, root }) {
	if (/\.[cm]?js$/.test(configPath)) {
		try {
			const config = await import(pathToFileURL(configPath).toString() + '?t=' + Date.now());
			return config.default ?? {};
		} catch (e) {
			if (e && typeof e === 'object' && 'code' in e && e.code === 'ERR_DLOPEN_DISABLED') {
				throw e;
			}
			debug('Failed to load config with Node', e);
		}
	}
	let server;
	try {
		const plugins = loadFallbackPlugin({ fs, root: pathToFileURL(root) });
		server = await createMinimalViteDevServer(plugins);
		if (isRunnableDevEnvironment(server.environments[ASTRO_VITE_ENVIRONMENT_NAMES.ssr])) {
			const environment = server.environments[ASTRO_VITE_ENVIRONMENT_NAMES.ssr];
			const mod = await environment.runner.import(configPath);
			return mod.default ?? {};
		} else {
			return {};
		}
	} finally {
		if (server) {
			await server.close();
		}
	}
}
export { loadConfigWithVite };
