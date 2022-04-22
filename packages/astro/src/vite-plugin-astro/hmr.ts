import type { AstroConfig } from '../@types/astro';
import type { LogOptions } from '../core/logger/core.js';
import type { ViteDevServer, ModuleNode, HmrContext } from 'vite';
import type { LoadResult, PluginContext as RollupPluginContext, ResolvedId } from 'rollup';
import { invalidateCompilation, isCached } from './compile.js';
import { info } from '../core/logger/core.js';
import * as msg from '../core/messages.js';

interface TrackCSSDependenciesOptions {
	viteDevServer: ViteDevServer | null;
	filename: string;
	id: string;
	deps: Set<string>;
}

export async function trackCSSDependencies(
	this: RollupPluginContext,
	opts: TrackCSSDependenciesOptions
): Promise<void> {
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

const scriptCache = new Map<string, string|null>();

function unwrapLoadResult(result: LoadResult): string|null {
	if (!result) {
		return null;
	} else if (typeof result === 'object') {
		return result.code;
	} else if (typeof result === 'string') {
		return result;
	}
	return null;
}

async function hasBeenUpdated(ctx: HmrContext, mod: ModuleNode) {
	const result = await ctx.server.pluginContainer.load(mod.url, { ssr: false });
	const code = unwrapLoadResult(result);
	// TODO: when we don't have anything cached (the first hmr update), this will always cause a reload
	let updated = true;
	if (scriptCache.has(mod.url)) {
		updated = scriptCache.get(mod.url) !== code;
	}
	scriptCache.set(mod.url, code);
	return updated;
}

export async function handleHotUpdate(ctx: HmrContext, config: AstroConfig, logging: LogOptions) {
	// Invalidate the compilation cache so it recompiles
	invalidateCompilation(config, ctx.file);

	// go through each of these modules importers and invalidate any .astro compilation
	// that needs to be rerun.
	const filtered = new Set<ModuleNode>(ctx.modules);
	const files = new Set<string>();
	
	// Bugfix: sometimes style URLs get normalized and end with `lang.css=`
	// These will cause full reloads, so filter them out here
	const mods = ctx.modules.filter((m) => !m.url.endsWith('='));

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
		if (mod.url.endsWith('.astro')) {
			for (const dep of mod.acceptedHmrDeps) {
				if (!dep.url.includes('astro&type=script')) continue;
				const updated = await hasBeenUpdated(ctx, dep);
				if (updated) {
					mods.push(dep);
				}
			}
		}
	}

	// Invalidate happens as a separate step because a single .astro file
	// produces multiple CSS modules and we want to return all of those.
	for (const file of files) {
		invalidateCompilation(config, file);
	}

	const isSelfAccepting = mods.every((m) => m.isSelfAccepting || m.url.endsWith('.svelte'));
	const file = ctx.file.replace(config.root.pathname, '/');
	if (isSelfAccepting) {
		info(logging, 'astro', msg.hmr({ file }));
	} else {
		info(logging, 'astro', msg.reload({ file }));
	}

	return mods;
}
