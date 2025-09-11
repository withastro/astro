import { DB_CLIENTS, VIRTUAL_CLIENT_MODULE_ID } from '../consts.js';
import type { VitePlugin } from '../utils.js';

type VitePluginDBClientParams = {
	connectToRemote: boolean;
	mode: 'node' | 'web';
};

function getRemoteClientModule(mode: 'node' | 'web') {
	switch (mode) {
		case 'web':
			return `export { createClient } from '${DB_CLIENTS.web}';`;
		case 'node':
		default:
			return `export { createClient } from '${DB_CLIENTS.node}';`;
	}
}

function getLocalClientModule(mode: 'node' | 'web') {
	switch (mode) {
		case 'node':
		case 'web':
		default:
			return `export { createClient } from '${DB_CLIENTS.local}';`;
	}
}

const resolved = '\0' + VIRTUAL_CLIENT_MODULE_ID;

export function vitePluginDbClient(params: VitePluginDBClientParams): VitePlugin {
	return {
		name: 'virtual:astro:db-client',
		enforce: 'pre',
		async resolveId(id) {
			if (id !== VIRTUAL_CLIENT_MODULE_ID) return;
			return resolved;
		},
		async load(id) {
			if (id !== resolved) return;

			switch (params.connectToRemote) {
				case true:
					return getRemoteClientModule(params.mode);
				case false:
				default:
					// Local client is always available, even if not used.
					return getLocalClientModule(params.mode);
			}
		},
	};
}
