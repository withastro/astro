import { VIRTUAL_PAGE_RESOLVED_MODULE_ID } from '../vite-plugin-pages/const.js';
import { getDevCssModuleNameFromPageVirtualModuleName } from '../vite-plugin-css/util.js';
import { isAstroServerEnvironment } from '../environments.js';
const STYLE_EXT_REGEX = /\.(?:css|scss|sass|less|styl|pcss)$/i;
function isStyleModule(mod) {
	if (mod.file && STYLE_EXT_REGEX.test(mod.file)) return true;
	if (mod.id) {
		const idPath = mod.id.split('?')[0];
		if (STYLE_EXT_REGEX.test(idPath)) return true;
	}
	return false;
}
function hmrReload() {
	return {
		name: 'astro:hmr-reload',
		enforce: 'post',
		hotUpdate: {
			order: 'post',
			handler({ modules, server, timestamp }) {
				if (!isAstroServerEnvironment(this.environment)) return;
				let hasSsrOnlyModules = false;
				let hasSkippedStyleModules = false;
				const invalidatedModules = /* @__PURE__ */ new Set();
				for (const mod of modules) {
					if (mod.id == null) continue;
					if (isStyleModule(mod)) {
						hasSkippedStyleModules = true;
						continue;
					}
					const clientModule = server.environments.client.moduleGraph.getModuleById(mod.id);
					if (clientModule != null) continue;
					this.environment.moduleGraph.invalidateModule(mod, invalidatedModules, timestamp, true);
					hasSsrOnlyModules = true;
				}
				for (const invalidatedModule of invalidatedModules) {
					if (invalidatedModule.id?.startsWith(VIRTUAL_PAGE_RESOLVED_MODULE_ID)) {
						const cssMod = this.environment.moduleGraph.getModuleById(
							getDevCssModuleNameFromPageVirtualModuleName(invalidatedModule.id),
						);
						if (!cssMod || cssMod.id == null) continue;
						this.environment.moduleGraph.invalidateModule(cssMod, void 0, timestamp, true);
					}
				}
				if (hasSsrOnlyModules) {
					server.ws.send({ type: 'full-reload' });
					return [];
				}
				if (hasSkippedStyleModules) {
					return [];
				}
			},
		},
	};
}
export { hmrReload as default };
