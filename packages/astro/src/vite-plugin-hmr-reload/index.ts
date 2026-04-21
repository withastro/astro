import type { EnvironmentModuleNode, Plugin } from 'vite';
import { VIRTUAL_PAGE_RESOLVED_MODULE_ID } from '../vite-plugin-pages/const.js';
import { getDevCssModuleNameFromPageVirtualModuleName } from '../vite-plugin-css/util.js';
import { isAstroServerEnvironment } from '../environments.js';

const STYLE_EXT_REGEX = /\.(?:css|scss|sass|less|styl|pcss)$/i;

function isStyleModule(mod: EnvironmentModuleNode): boolean {
	if (mod.file && STYLE_EXT_REGEX.test(mod.file)) return true;
	// CSS modules and other style files may have query params in their id (e.g. ?used, ?direct)
	if (mod.id) {
		const idPath = mod.id.split('?')[0];
		if (STYLE_EXT_REGEX.test(idPath)) return true;
	}
	return false;
}

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
				if (!isAstroServerEnvironment(this.environment)) return;

				let hasSsrOnlyModules = false;
				let hasSkippedStyleModules = false;

				const invalidatedModules = new Set<EnvironmentModuleNode>();
				for (const mod of modules) {
					if (mod.id == null) continue;
					// Style modules must be checked first: CSS/SCSS files imported by client
					// components exist in both the client and SSR module graphs. If we checked
					// the client module graph first, we'd skip them and never set
					// hasSkippedStyleModules, causing Vite to trigger a full page reload.
					if (isStyleModule(mod)) {
						hasSkippedStyleModules = true;
						continue;
					}
					// .astro files always have a client stub injected by the astro:build plugin
					// to prevent them from being bundled for the browser. That stub is not a
					// real client module, so we must not skip main .astro module entries even
					// if a client module entry exists for them. Virtual sub-modules (e.g.
					// CSS virtual modules with query params) do have real client counterparts
					// and should still be checked.
					const isMainAstroModule = mod.id.endsWith('.astro');
					if (!isMainAstroModule) {
						const clientModule = server.environments.client.moduleGraph.getModuleById(mod.id);
						if (clientModule != null) continue;
					}

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
					server.environments.client.hot.send({
						type: 'full-reload',
						path: '*',
					});
					return [];
				}

				// When style modules were skipped, return an empty array to prevent Vite's
				// default SSR HMR propagation. Without this, Vite would propagate through the
				// module graph to .astro importers, find no HMR acceptor, and trigger a
				// full page reload. The client environment handles CSS HMR natively via
				// Vite's built-in style update mechanism, which works for all pages
				// (with or without framework components).
				// When style modules were skipped, return an empty array to prevent Vite's
				// default SSR HMR propagation. Without this, Vite would propagate through the
				// module graph to .astro importers, find no HMR acceptor, and trigger a
				// full page reload. The client environment handles CSS HMR natively via
				// Vite's built-in style update mechanism, which works for all pages
				// (with or without framework components).
				if (hasSkippedStyleModules) {
					return [];
				}
			},
		},
	};
}
