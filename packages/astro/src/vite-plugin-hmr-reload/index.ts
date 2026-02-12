import type { EnvironmentModuleNode, Plugin } from 'vite';
import { ASTRO_VITE_ENVIRONMENT_NAMES } from '../core/constants.js';
import { VIRTUAL_PAGE_RESOLVED_MODULE_ID } from '../vite-plugin-pages/const.js';
import { getDevCssModuleNameFromPageVirtualModuleName } from '../vite-plugin-css/util.js';

/**
 * The very last Vite plugin to reload the browser if any SSR-only module are updated
 * which will require a full page reload. This mimics the behaviour of Vite 5 where
 * it used to unconditionally reload for us.
 */
export default function hmrReload(): Plugin {
	return {
		name: 'astro:hmr-reload',
		enforce: 'post',
		hotUpdate: {
			order: 'post',
			handler({ modules, server, timestamp }) {
				if (this.environment.name !== ASTRO_VITE_ENVIRONMENT_NAMES.ssr) return;

				let hasSsrOnlyModules = false;

				const invalidatedModules = new Set<EnvironmentModuleNode>();
				for (const mod of modules) {
					if (mod.id == null) continue;
					const clientModule = server.environments.client.moduleGraph.getModuleById(mod.id);
					if (clientModule != null) continue;

					this.environment.moduleGraph.invalidateModule(mod, invalidatedModules, timestamp, true);
					hasSsrOnlyModules = true;
				}

				// If any invalidated modules are virtual modules for pages, also invalidate their
				// associated dev CSS modules, if any.
				for (const invalidatedModule of invalidatedModules) {
					if (invalidatedModule.id?.startsWith(VIRTUAL_PAGE_RESOLVED_MODULE_ID)) {
						const cssMod = this.environment.moduleGraph.getModuleById(
							getDevCssModuleNameFromPageVirtualModuleName(invalidatedModule.id),
						);
						if (!cssMod || cssMod.id == null) continue;
						this.environment.moduleGraph.invalidateModule(cssMod, undefined, timestamp, true);
					}
				}

				if (hasSsrOnlyModules) {
					server.ws.send({ type: 'full-reload' });
					return [];
				}
			},
		},
	};
}
