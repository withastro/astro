import type { AstroConfig } from '../@types/astro';
import type { LogOptions } from '../core/logger/core.js';
import type { ViteDevServer, ModuleNode, HmrContext } from 'vite';
import type { PluginContext as RollupPluginContext, ResolvedId } from 'rollup';
import { invalidateCompilation, isCached } from './compile.js';
import { info } from '../core/logger/core.js';
import * as msg from '../core/messages.js';

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

export async function handleHotUpdate(ctx: HmrContext, config: AstroConfig, logging: LogOptions) {
	// Invalidate the compilation cache so it recompiles
	invalidateCompilation(config, ctx.file);

	// go through each of these modules importers and invalidate any .astro compilation
	// that needs to be rerun.
	const filtered = new Set<ModuleNode>(ctx.modules);
	const files = new Set<string>();
	for (const mod of ctx.modules) {
		// This is always the HMR script, we skip it to avoid spamming
		// the browser console with HMR updates about this file
		if (mod.id?.endsWith('.astro?html-proxy&index=0.js')) {
			filtered.delete(mod);
			continue;
		}
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

	const mod = ctx.modules.find((m) => m.file === ctx.file);
	const file = ctx.file.replace(config.projectRoot.pathname, '/');
	if (ctx.file.endsWith('.astro')) {
		ctx.server.ws.send({ type: 'custom', event: 'astro:update', data: { file } });
	}
	if (mod?.isSelfAccepting) {
		info(logging, 'astro', msg.hmr({ file }));
	} else {
		info(logging, 'astro', msg.reload({ file }));
	}
	return Array.from(filtered);
}
