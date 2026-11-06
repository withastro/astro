import { isRunnableDevEnvironment, type EnvironmentModuleNode, type Plugin } from 'vite';
import { inlineRE, rawRE } from '../vite-plugin-astro-server/util.js';
import { VIRTUAL_PAGE_RESOLVED_MODULE_ID } from '../vite-plugin-pages/const.js';
import { RESOLVED_MODULE_DEV_CSS_PREFIX } from '../vite-plugin-css/const.js';
import { getDevCssModuleNameFromPageVirtualModuleName } from '../vite-plugin-css/util.js';
import { isAstroServerEnvironment } from '../environments.js';

const STYLE_EXT_REGEX = /\.(?:css|less|sass|scss|styl|stylus|pcss|postcss|sss)$/i;
const STYLE_COMPONENT_EXT_REGEX = /\.(astro|svelte|vue)$/i;

function hasStyleExtension(id: string): boolean {
	return STYLE_EXT_REGEX.test(id.split('?')[0]);
}

function isComponentStyleModule(id: string): boolean {
	const [filename, rawQuery] = id.split('?', 2);
	const extensionMatch = STYLE_COMPONENT_EXT_REGEX.exec(filename);
	if (!rawQuery || !extensionMatch) return false;
	const query = new URLSearchParams(rawQuery);
	return query.get('type') === 'style' && query.has(extensionMatch[1].toLowerCase());
}

function isCssStringModule(id: string): boolean {
	return hasStyleExtension(id) && (rawRE.test(id) || inlineRE.test(id));
}

type StyleModuleType = 'file' | 'component';

function getStyleModuleType(mod: EnvironmentModuleNode): StyleModuleType | undefined {
	if (mod.id && isComponentStyleModule(mod.id)) return 'component';
	if (mod.file && hasStyleExtension(mod.file)) return 'file';
	return mod.id && hasStyleExtension(mod.id) ? 'file' : undefined;
}

function getClientStyleModuleId(id: string, styleType: StyleModuleType): string {
	if (styleType === 'file') return id;

	// SSR CSS collection may add `inline`, while client CSS HMR uses the remaining request ID.
	const [filename, rawQuery] = id.split('?', 2);
	const clientQuery = rawQuery
		.split('&')
		.filter((parameter) => parameter !== 'inline')
		.join('&');
	return clientQuery ? `${filename}?${clientQuery}` : filename;
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
				let hasStyleModules = false;
				let hasSkippedStyleModules = false;

				const invalidatedModules = new Set<EnvironmentModuleNode>();
				for (const mod of modules) {
					if (mod.id == null) continue;
					const isCssString = isCssStringModule(mod.id);
					const styleType = isCssString ? undefined : getStyleModuleType(mod);
					// CSS string exports need SSR invalidation rather than client-side CSS HMR.
					const clientModule = isCssString
						? null
						: server.environments.client.moduleGraph.getModuleById(
								styleType ? getClientStyleModuleId(mod.id, styleType) : mod.id,
							);
					if (styleType) {
						hasStyleModules = true;
						// No client module means nothing will apply the CSS update client-side, so force a reload.
						if (clientModule == null) {
							this.environment.moduleGraph.invalidateModule(
								mod,
								invalidatedModules,
								timestamp,
								true,
							);
							hasSsrOnlyModules = true;
							continue;
						}
						hasSkippedStyleModules = true;
						continue;
					}

					if (clientModule != null) continue;

					this.environment.moduleGraph.invalidateModule(mod, invalidatedModules, timestamp, true);
					hasSsrOnlyModules = true;
				}

				const invalidateDevCssModules = () => {
					for (const [id, mod] of this.environment.moduleGraph.idToModuleMap) {
						if (id.startsWith(RESOLVED_MODULE_DEV_CSS_PREFIX)) {
							this.environment.moduleGraph.invalidateModule(mod, undefined, timestamp, true);
							if (isRunnableDevEnvironment(this.environment)) {
								const runnerMod = this.environment.runner.evaluatedModules.getModuleById(id);
								if (runnerMod) {
									this.environment.runner.evaluatedModules.invalidateModule(runnerMod);
								}
							}
						}
					}
				};

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
					if (hasStyleModules) {
						invalidateDevCssModules();
					}
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
					// Invalidate all per-route dev CSS virtual modules so the next SSR request
					// re-collects CSS with updated content. Without this, the inline <style>
					// tags injected for anti-FOUC would serve stale CSS after HMR updates.
					invalidateDevCssModules();
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
