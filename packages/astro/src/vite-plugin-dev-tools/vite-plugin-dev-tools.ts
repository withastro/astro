import type * as vite from 'vite';
import type { AstroPluginOptions } from '../@types/astro.js';

const VIRTUAL_MODULE_ID = 'astro:dev-tools';
const resolvedVirtualModuleId = '\0' + VIRTUAL_MODULE_ID;

export default function astroDevTools({ settings }: AstroPluginOptions): vite.Plugin {
	return {
		name: 'astro:dev-tools',
		resolveId(id) {
			if (id === VIRTUAL_MODULE_ID) {
				return resolvedVirtualModuleId;
			}
		},
		load(id) {
			if (id === resolvedVirtualModuleId) {
				return `
					export const loadDevToolsPlugins = async () => {
						return [${settings.config.devTools.plugins.map((p) => `(await import('${p}')).default`).join(',')}];
					};
				`;
			}
		},
		configureServer(server) {
			// Example: wait for a client to connect before sending a message
			server.ws.on('connection', () => {
				server.ws.send('astro-dev-tools', { msg: 'hello' });
			});
		},
	};
}
