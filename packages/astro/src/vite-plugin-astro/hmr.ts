import type { HmrContext, ModuleNode } from 'vite';
import type { AstroConfig } from '../@types/astro.js';
import type { cachedCompilation } from '../core/compile/index.js';
import { invalidateCompilation, isCached, type CompileResult } from '../core/compile/index.js';
import type { Logger } from '../core/logger/core.js';
import { isAstroSrcFile } from '../core/logger/vite.js';
import { isAstroScript } from './query.js';

export interface HandleHotUpdateOptions {
	config: AstroConfig;
	logger: Logger;

	compile: () => ReturnType<typeof cachedCompilation>;
	source: string;
}

export async function handleHotUpdate(
	ctx: HmrContext,
	{ config, logger, compile, source }: HandleHotUpdateOptions
) {
	let isStyleOnlyChange = false;
	if (ctx.file.endsWith('.astro') && isCached(config, ctx.file)) {
		// Get the compiled result from the cache
		const oldResult = await compile();
		// Skip HMR if source isn't changed
		if (oldResult.source === source) return [];
		// Invalidate to get fresh, uncached result to compare it to
		invalidateCompilation(config, ctx.file);
		const newResult = await compile();
		if (isStyleOnlyChanged(oldResult, newResult)) {
			isStyleOnlyChange = true;
		}
	} else {
		invalidateCompilation(config, ctx.file);
	}

	// Skip monorepo files to avoid console spam
	if (isAstroSrcFile(ctx.file)) {
		return;
	}

	// go through each of these modules importers and invalidate any .astro compilation
	// that needs to be rerun.
	const filtered = new Set<ModuleNode>(ctx.modules);
	const files = new Set<string>();
	for (const mod of ctx.modules) {
		// Skip monorepo files to avoid console spam
		if (isAstroSrcFile(mod.id ?? mod.file)) {
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
		if (isStyleOnlyChange && file === ctx.file) continue;
		invalidateCompilation(config, file);
		// If `ctx.file` is depended by an .astro file, e.g. via `this.addWatchFile`,
		// Vite doesn't trigger updating that .astro file by default. See:
		// https://github.com/vitejs/vite/issues/3216
		// For now, we trigger the change manually here.
		if (file.endsWith('.astro')) {
			ctx.server.moduleGraph.onFileChange(file);
		}
	}

	// Bugfix: sometimes style URLs get normalized and end with `lang.css=`
	// These will cause full reloads, so filter them out here
	const mods = [...filtered].filter((m) => !m.url.endsWith('='));

	// If only styles are changed, remove the component file from the update list
	if (isStyleOnlyChange) {
		logger.debug('watch', 'style-only change');
		// Only return the Astro styles that have changed!
		return mods.filter((mod) => mod.id?.includes('astro&type=style'));
	}

	// Add hoisted scripts so these get invalidated
	for (const mod of mods) {
		for (const imp of mod.importedModules) {
			if (imp.id && isAstroScript(imp.id)) {
				mods.push(imp);
			}
		}
	}

	return mods;
}

function isStyleOnlyChanged(oldResult: CompileResult, newResult: CompileResult) {
	return (
		normalizeCode(oldResult.code) === normalizeCode(newResult.code) &&
		!isArrayEqual(oldResult.css, newResult.css)
	);
}

const astroStyleImportRE = /import\s*"[^"]+astro&type=style[^"]+";/g;
const sourceMappingUrlRE = /\/\/# sourceMappingURL=[^ ]+$/gm;

/**
 * Remove style-related code and sourcemap from the final astro output so they
 * can be compared between non-style code
 */
function normalizeCode(code: string) {
	return code.replace(astroStyleImportRE, '').replace(sourceMappingUrlRE, '').trim();
}

function isArrayEqual(a: any[], b: any[]) {
	if (a.length !== b.length) {
		return false;
	}
	for (let i = 0; i < a.length; i++) {
		if (a[i] !== b[i]) {
			return false;
		}
	}
	return true;
}
