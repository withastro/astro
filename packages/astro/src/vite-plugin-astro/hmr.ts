import type { AstroConfig } from '../@types/astro';
import type { ViteDevServer, ModuleNode, HmrContext } from 'vite';
import type { PluginContext as RollupPluginContext, ResolvedId } from 'rollup';
import { invalidateCompilation, isCached } from './compile.js';

interface TrackCSSDependenciesOptions {
	viteDevServer: ViteDevServer | null;
	filename: string;
	id: string;
	deps: Set<string>;
}

export async function trackCSSDependencies(this: RollupPluginContext, opts: TrackCSSDependenciesOptions): Promise<void> {
	const { viteDevServer, filename, deps, id } = opts;
	// Dev, register CSS dependencies for HMR.
	if (viteDevServer) {
		const mod = viteDevServer.moduleGraph.getModuleById(id);
		if (mod) {
			const cssDeps = (
				await Promise.all(
					Array.from(deps).map((spec) => {
						return this.resolve(spec, id);
					})
				)
			)
				.filter(Boolean)
				.map((dep) => (dep as ResolvedId).id);

			const { moduleGraph } = viteDevServer;
			// record deps in the module graph so edits to @import css can trigger
			// main import to hot update
			const depModules = new Set(mod.importedModules);
			for (const dep of cssDeps) {
				depModules.add(moduleGraph.createFileOnlyEntry(dep));
			}

			// Update the module graph, telling it about our CSS deps.
			moduleGraph.updateModuleInfo(mod, depModules, new Set(), true);
			for (const dep of cssDeps) {
				this.addWatchFile(dep);
			}
		}
	}
}

export function handleHotUpdate(ctx: HmrContext, config: AstroConfig) {
	// Invalidate the compilation cache so it recompiles
	invalidateCompilation(config, ctx.file);

	// go through each of these modules importers and invalidate any .astro compilation
	// that needs to be rerun.
	const filtered = new Set<ModuleNode>(ctx.modules);
	const files = new Set<string>();
	for (const mod of ctx.modules) {
		if (mod.file && isCached(config, mod.file)) {
			filtered.add(mod);
			files.add(mod.file);
		}
		for (const imp of mod.importers) {
			if (imp.file && isCached(config, imp.file)) {
				filtered.add(imp);
				files.add(imp.file);
			}
		}
	}

	// Invalidate happens as a separate step because a single .astro file
	// produces multiple CSS modules and we want to return all of those.
	for (const file of files) {
		invalidateCompilation(config, file);
	}

	return Array.from(filtered);
}
