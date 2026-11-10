import { normalizePath, type Plugin } from 'vite';
import type { RouterRegistry } from '../internal/registry.js';

/** Module whose default export lists the `addClientRouterInit()` functions. */
export const CLIENT_ROUTER_INIT_MODULE_ID = 'virtual:astro:client-router-init';
const RESOLVED_CLIENT_ROUTER_INIT_MODULE_ID = '\0' + CLIENT_ROUTER_INIT_MODULE_ID;

/** Serves `virtual:astro:client-router-init`, imported by `<ClientRouter />`. */
export function clientRouterInitPlugin(registry: RouterRegistry): Plugin {
	return {
		name: '@astrojs/vite-plugin-router:client-router-init',
		resolveId: {
			filter: { id: new RegExp(`^${CLIENT_ROUTER_INIT_MODULE_ID}$`) },
			handler() {
				return RESOLVED_CLIENT_ROUTER_INIT_MODULE_ID;
			},
		},
		load: {
			filter: { id: new RegExp(`^${RESOLVED_CLIENT_ROUTER_INIT_MODULE_ID}$`) },
			handler() {
				registry.freeze();
				const imports = registry.clientRouterInits.map(
					(entrypoint, i) => `import _init${i} from ${JSON.stringify(normalizePath(entrypoint))};`,
				);
				const inits = registry.clientRouterInits.map((_, i) => `_init${i}`);
				return { code: [...imports, `export default [${inits.join(', ')}];`].join('\n') };
			},
		},
	};
}
