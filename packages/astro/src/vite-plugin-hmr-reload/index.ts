import {
	isRunnableDevEnvironment,
	type DevEnvironment,
	type EnvironmentModuleNode,
	type Plugin,
} from 'vite';
import { VIRTUAL_PAGE_RESOLVED_MODULE_ID } from '../vite-plugin-pages/const.js';
import { RESOLVED_MODULE_DEV_CSS_PREFIX } from '../vite-plugin-css/const.js';
import { getDevCssModuleNameFromPageVirtualModuleName } from '../vite-plugin-css/util.js';
import { isAstroServerEnvironment } from '../environments.js';

const STYLE_EXT_REGEX = /\.(?:css|less|sass|scss|styl|stylus|pcss|postcss|sss)$/i;
const STYLE_COMPONENT_EXT_REGEX = /\.(astro|svelte|vue)$/i;
const RAW_QUERY_REGEX = /(?:\?|&)raw(?:&|$)/;

function hasStyleExtension(id: string): boolean {
	// Style module IDs may include Vite query params such as ?used or ?direct.
	return STYLE_EXT_REGEX.test(id.split('?')[0]);
}

function isComponentStyleModule(id: string): boolean {
	const [filename, rawQuery] = id.split('?', 2);
	const extensionMatch = STYLE_COMPONENT_EXT_REGEX.exec(filename);
	if (!rawQuery || !extensionMatch) return false;
	const query = new URLSearchParams(rawQuery);
	return query.get('type') === 'style' && query.has(extensionMatch[1].toLowerCase());
}

// Whether a style module comes from a file (e.g. global.css, styles.scss)
// or from a component request (e.g. *.astro?astro&type=style, *.svelte?svelte&type=style).
type StyleModuleType = 'file' | 'component';

function getStyleModuleType(mod: EnvironmentModuleNode): StyleModuleType | undefined {
	// CSS imported with ?raw is a JS string export, so SSR importers need to be invalidated
	// instead of relying on Vite's client-side CSS HMR handling.
	if (mod.id && RAW_QUERY_REGEX.test(mod.id) && hasStyleExtension(mod.id)) return;
	if (mod.id && isComponentStyleModule(mod.id)) return 'component';
	if (mod.file && hasStyleExtension(mod.file)) return 'file';
	// CSS modules and other style files may have query params in their id (e.g. ?used, ?direct)
	return mod.id && hasStyleExtension(mod.id) ? 'file' : undefined;
}

function hasClientStyleModuleByFile(
	moduleGraph: { getModulesByFile?(file: string): Set<EnvironmentModuleNode> | undefined },
	mod: EnvironmentModuleNode,
	styleType: StyleModuleType,
): boolean {
	if (mod.file == null || moduleGraph.getModulesByFile == null) return false;

	const fileModules = moduleGraph.getModulesByFile(mod.file);
	if (fileModules == null) return false;

	for (const fileMod of fileModules) {
		if (fileMod.id == null) continue;
		if (styleType === 'component') {
			if (isComponentStyleModule(fileMod.id)) return true;
		} else if (!RAW_QUERY_REGEX.test(fileMod.id) && hasStyleExtension(fileMod.id)) {
			return true;
		}
	}
	return false;
}

/**
 * The very last Vite plugin to reload the browser if any SSR-only module are updated
 * which will require a full page reload. This mimics the behaviour of Vite 5 where
 * it used to unconditionally reload for us.
 */
export default function hmrReload(): Plugin {
	const remoteInvalidations = new WeakMap<
		DevEnvironment,
		{ revision: number; modules: Map<EnvironmentModuleNode, number> }
	>();

	function invalidateRemoteModules(
		environment: DevEnvironment,
		modules: Set<EnvironmentModuleNode>,
	) {
		let invalidations = remoteInvalidations.get(environment);
		if (!invalidations) {
			invalidations = { revision: 0, modules: new Map() };
			remoteInvalidations.set(environment, invalidations);
			const pending = invalidations;
			const fetchModule = environment.fetchModule.bind(environment);
			environment.fetchModule = async (url, importer, options) => {
				const revision = pending.revision;
				const result = await fetchModule(url, importer, options);
				// Astro also fetches modules for analysis without evaluating them remotely.
				// Only a runner's explicit cache check may consume its invalidation.
				if (options?.cached === undefined || pending.modules.size === 0) return result;
				const mod =
					'cache' in result
						? await environment.moduleGraph.getModuleByUrl(url)
						: 'id' in result
							? environment.moduleGraph.getModuleById(result.id)
							: undefined;
				const invalidatedAt = mod && pending.modules.get(mod);
				if (!mod || invalidatedAt === undefined) return result;

				const refreshed =
					'cache' in result
						? await fetchModule(url, importer, { ...options, cached: false })
						: result;
				if (!('code' in refreshed)) return refreshed;
				// Do not consume an invalidation from an edit that arrived during this fetch.
				if (invalidatedAt <= revision && pending.modules.get(mod) === invalidatedAt) {
					pending.modules.delete(mod);
				}
				return { ...refreshed, invalidate: true };
			};
		}
		invalidations.revision++;
		for (const mod of modules) invalidations.modules.set(mod, invalidations.revision);
	}

	return {
		name: 'astro:hmr-reload',
		enforce: 'post',
		hotUpdate: {
			order: 'post',
			handler({ modules, server, timestamp }) {
				if (!isAstroServerEnvironment(this.environment)) return;

				let hasSsrOnlyModules = false;
				let hasStyleModules = false;
				let hasSkippedStyleModules = false;

				const invalidatedModules = new Set<EnvironmentModuleNode>();
				for (const mod of modules) {
					if (mod.id == null) continue;
					const styleType = getStyleModuleType(mod);
					const clientModule = server.environments.client.moduleGraph.getModuleById(mod.id);
					if (styleType) {
						hasStyleModules = true;
						// No client module means nothing will apply the CSS update client-side, so force a reload.
						if (
							clientModule == null &&
							!hasClientStyleModuleByFile(server.environments.client.moduleGraph, mod, styleType)
						) {
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
					if (!isRunnableDevEnvironment(this.environment)) {
						// A transform may be revalidated before the remote runner asks for it.
						// Remember affected modules independently of the transform cache so
						// fetchModule also refreshes their evaluated exports.
						invalidateRemoteModules(this.environment, invalidatedModules);
					}
					// Tell the browser to reload the page.
					server.ws.send({ type: 'full-reload' });
					// Remote runners refresh invalidated modules through fetchModule. Sending
					// them a full-reload would also clear unrelated dependencies, allowing an
					// in-flight request to import a second instance of a shared module.
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
