import {
	isRunnableDevEnvironment,
	normalizePath,
	type EnvironmentModuleNode,
	type Plugin,
} from 'vite';
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
				// Track SSR-only modules we invalidate for targeted runner cache cleanup.
				const ssrOnlyModules = new Set<EnvironmentModuleNode>();
				for (const mod of modules) {
					if (mod.id == null) continue;
					const clientModule = server.environments.client.moduleGraph.getModuleById(mod.id);
					if (clientModule != null) continue;

					// Invalidate SSR module + importers in the SSR module graph.
					this.environment.moduleGraph.invalidateModule(mod, invalidatedModules, timestamp, true);
					// Keep a list of SSR-only modules for runner cache invalidation.
					ssrOnlyModules.add(mod);
					hasSsrOnlyModules = true;
				}

				if (hasSsrOnlyModules && isRunnableDevEnvironment(this.environment)) {
					// Access the SSR runner cache to invalidate evaluated module state.
					const evaluatedModules = this.environment.runner.evaluatedModules;

					const invalidateRunnerModule = (mod: EnvironmentModuleNode) => {
						// Invalidate by module id when available.
						if (mod.id) {
							const runnerMod = evaluatedModules.getModuleById(mod.id);
							if (runnerMod) evaluatedModules.invalidateModule(runnerMod);
						}

						// Invalidate by module url when available.
						if (mod.url) {
							const runnerMod = evaluatedModules.getModuleByUrl(mod.url);
							if (runnerMod) evaluatedModules.invalidateModule(runnerMod);
						}

						// Invalidate by file path (normalized) when available.
						if (mod.file) {
							const normalizedFile = normalizePath(mod.file);
							const runnerMods =
								evaluatedModules.getModulesByFile(mod.file) ??
								evaluatedModules.getModulesByFile(normalizedFile);
							if (runnerMods) {
								for (const runnerMod of runnerMods) {
									evaluatedModules.invalidateModule(runnerMod);
								}
							}
						}
					};

					// Collect the dependency subtree for SSR-only modules so dependencies re-evaluate.
					const dependenciesToInvalidate = new Set<EnvironmentModuleNode>();
					const collectDependencies = (mod: EnvironmentModuleNode) => {
						if (dependenciesToInvalidate.has(mod)) return;
						dependenciesToInvalidate.add(mod);
						// Walk down the import graph to cover dependency modules.
						for (const importedModule of mod.importedModules) {
							if (!importedModule) continue;
							collectDependencies(importedModule);
						}
					};

					// Seed traversal from the SSR-only changed modules.
					for (const mod of ssrOnlyModules) {
						collectDependencies(mod);
					}

					// Invalidate runner cache entries for all dependencies we collected.
					for (const mod of dependenciesToInvalidate) {
						invalidateRunnerModule(mod);
					}
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
