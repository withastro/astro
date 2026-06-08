import { isRunnableDevEnvironment, type EnvironmentModuleNode, type Plugin } from 'vite';
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
			handler({ modules, server, timestamp, file }) {
				if (!isAstroServerEnvironment(this.environment)) return;

				let hasSsrOnlyModules = false;
				let hasSkippedStyleModules = false;

				const invalidatedModules = new Set<EnvironmentModuleNode>();
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
					// Invalidate all recursively-invalidated modules (importers) in the
					// runner cache, not just the directly changed files. Without this,
					// barrel files like index.ts stay cached and dynamic import() calls
					// return stale exports.
					if (isRunnableDevEnvironment(this.environment)) {
						for (const invalidated of invalidatedModules) {
							if (invalidated.id == null) continue;
							const runnerModule = this.environment.runner.evaluatedModules.getModuleById(
								invalidated.id,
							);
							if (runnerModule) {
								this.environment.runner.evaluatedModules.invalidateModule(runnerModule);
							}
						}
					}
					// Tell the browser to reload the page.
					server.ws.send({ type: 'full-reload' });
					// For non-runnable environments (e.g. Cloudflare's workerd), we can't
					// directly access the module runner. Send a full-reload through the
					// environment's hot channel so the remote runner clears its cache.
					if (!isRunnableDevEnvironment(this.environment)) {
						this.environment.hot.send({
							type: 'full-reload',
							triggeredBy: file,
							path: '*',
						});
					}
					return [];
				}

				// When style modules were skipped, return an empty array to prevent Vite's
				// default SSR HMR propagation. Without this, Vite would propagate through the
				// module graph to .astro importers, find no HMR acceptor, and trigger a
				// full page reload. The client environment handles CSS HMR natively via
				// Vite's built-in style update mechanism, which works for all pages
				// (with or without framework components).
				if (hasSkippedStyleModules) {
					return [];
				}

				// If we processed modules but none were SSR-only (all were found in the
				// client module graph), return an empty array to prevent Vite's default
				// HMR propagation. Without this, Vite would propagate through the SSR
				// module graph, find no HMR boundary (e.g. .astro files), and trigger
				// a full-reload that causes unnecessary program reloads for the module
				// runner. The client environment handles HMR for these modules natively.
				if (modules.length > 0) {
					return [];
				}
			},
		},
	};
}
