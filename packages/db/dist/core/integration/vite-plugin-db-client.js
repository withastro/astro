import { DB_CLIENTS, VIRTUAL_CLIENT_MODULE_ID } from '../consts.js';
function getRemoteClientModule(mode) {
	switch (mode) {
		case 'web':
			return `export { createClient } from '${DB_CLIENTS.web}';`;
		case 'node':
		default:
			return `export { createClient } from '${DB_CLIENTS.node}';`;
	}
}
function getLocalClientModule(mode) {
	switch (mode) {
		case 'node':
		case 'web':
		default:
			return `export { createClient } from '${DB_CLIENTS.local}';`;
	}
}
const resolved = '\0' + VIRTUAL_CLIENT_MODULE_ID;
function vitePluginDbClient(params) {
	return {
		name: 'virtual:astro:db-client',
		enforce: 'pre',
		resolveId: {
			filter: {
				id: new RegExp(`^${VIRTUAL_CLIENT_MODULE_ID}$`),
			},
			handler() {
				return resolved;
			},
		},
		load: {
			filter: {
				id: new RegExp(`^${resolved}$`),
			},
			handler() {
				switch (params.connectToRemote) {
					case true:
						return getRemoteClientModule(params.mode);
					case false:
					default:
						return getLocalClientModule(params.mode);
				}
			},
		},
	};
}
export { vitePluginDbClient };
