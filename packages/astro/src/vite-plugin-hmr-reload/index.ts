import { normalizePath, type EnvironmentModuleNode, type Plugin } from 'vite';

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
			handler({ file, modules, server, timestamp }) {
				const ssrEnv = server.environments?.ssr as any;
				if (!ssrEnv) return;

				let hasSsrOnlyModules = false;

				const invalidatedModules = new Set<EnvironmentModuleNode>();
				const ssrModuleGraph = ssrEnv.moduleGraph;
				const clientModuleGraph = server.environments.client.moduleGraph;
				// Vite's SSR cache isn't typed on the dev environment; cast to access moduleCache.
				const ssrCache = ssrEnv?.ssrModuleLoader?.moduleCache as Map<string, any> | undefined;
				// Also clear ModuleRunner caches so ssrLoadModule re-executes on next request.
				const ssrRunnerCandidates = [
					(server as any)._ssrCompatModuleRunner,
					ssrEnv?._runner,
				].filter(Boolean);

				const invalidateRunnerModuleCache = (runner: any, mod: EnvironmentModuleNode) => {
					const evaluatedModules = runner?.evaluatedModules;
					if (!evaluatedModules) return;

					if (mod.id) {
						const runnerMod = evaluatedModules.getModuleById?.(mod.id);
						if (runnerMod) evaluatedModules.invalidateModule(runnerMod);
					}

					if (mod.url) {
						const runnerMod = evaluatedModules.getModuleByUrl?.(mod.url);
						if (runnerMod) evaluatedModules.invalidateModule(runnerMod);
					}

					if (mod.file) {
						const normalizedFile = normalizePath(mod.file);
						const runnerMods =
							evaluatedModules.getModulesByFile?.(normalizedFile) ??
							evaluatedModules.getModulesByFile?.(mod.file);
						if (runnerMods) {
							for (const runnerMod of runnerMods) {
								evaluatedModules.invalidateModule(runnerMod);
							}
						}
					}
				};

				const invalidateRunnerCaches = (mod: EnvironmentModuleNode) => {
					for (const runner of ssrRunnerCandidates) {
						invalidateRunnerModuleCache(runner, mod);
					}
				};

				const ssrModulesToInvalidate = new Set<EnvironmentModuleNode>();

				const addSsrModulesByFile = (filePath?: string) => {
					if (!filePath) return;
					const ssrModsByFile = ssrModuleGraph.getModulesByFile(filePath);
					if (!ssrModsByFile) return;
					for (const ssrModByFile of ssrModsByFile) {
						ssrModulesToInvalidate.add(ssrModByFile);
					}
				};

				if (file) addSsrModulesByFile(file);

				for (const mod of modules) {
					if (mod.id == null) continue;
					const ssrModById = ssrModuleGraph.getModuleById(mod.id);
					if (ssrModById) {
						ssrModulesToInvalidate.add(ssrModById);
					}
					if (mod.file) addSsrModulesByFile(mod.file);
				}

				for (const ssrMod of ssrModulesToInvalidate) {
					ssrModuleGraph.invalidateModule(ssrMod, invalidatedModules, timestamp, true);
					if (ssrMod.id) ssrCache?.delete(ssrMod.id);
					invalidateRunnerCaches(ssrMod);

					// Also invalidate all SSR importers of this dependency so that
					// pages (and other SSR modules) that import it are re-run.
					for (const importer of ssrMod.importers) {
						ssrModuleGraph.invalidateModule(importer, invalidatedModules, timestamp, true);
						if (importer.id) ssrCache?.delete(importer.id);
						invalidateRunnerCaches(importer);
					}
				}

				// Only trigger a full client reload when a purely SSR module changes.
				for (const mod of modules) {
					if (mod.id == null) continue;
					if (clientModuleGraph.getModuleById(mod.id) == null) {
						hasSsrOnlyModules = true;
						break;
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
