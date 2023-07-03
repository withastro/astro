import { fileURLToPath } from 'node:url';
import type { HmrContext, ModuleNode } from 'vite';
import type { AstroConfig } from '../@types/astro';
import {
	cachedCompilation,
	invalidateCompilation,
	isCached,
	type CompileResult,
} from '../core/compile/index.js';
import type { LogOptions } from '../core/logger/core.js';
import { info } from '../core/logger/core.js';
import * as msg from '../core/messages.js';
import { isAstroScript } from './query.js';

const PKG_PREFIX = fileURLToPath(new URL('../../', import.meta.url));
const E2E_PREFIX = fileURLToPath(new URL('../../e2e', import.meta.url));
const isPkgFile = (id: string | null) => {
	return id?.startsWith(PKG_PREFIX) && !id.startsWith(E2E_PREFIX);
};

export interface HandleHotUpdateOptions {
	config: AstroConfig;
	logging: LogOptions;
	compile: () => ReturnType<typeof cachedCompilation>;
	source: string;
}

export async function handleHotUpdate(
	ctx: HmrContext,
	{ config, logging, compile, source }: HandleHotUpdateOptions
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
	if (isPkgFile(ctx.file)) {
		return;
	}

	// go through each of these modules importers and invalidate any .astro compilation
	// that needs to be rerun.
	const filtered = new Set<ModuleNode>(ctx.modules);
	const files = new Set<string>();
	for (const mod of ctx.modules) {
		// Skip monorepo files to avoid console spam
		if (isPkgFile(mod.id ?? mod.file)) {
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
	const mods = ctx.modules.filter((m) => !m.url.endsWith('='));
	const file = ctx.file.replace(config.root.pathname, '/');

	// If only styles are changed, remove the component file from the update list
	if (isStyleOnlyChange) {
		info(logging, 'astro', msg.hmr({ file, style: true }));
		// remove base file and hoisted scripts
		return mods.filter((mod) => mod.id !== ctx.file && !mod.id?.endsWith('.ts'));
	}

	// Add hoisted scripts so these get invalidated
	for (const mod of mods) {
		for (const imp of mod.importedModules) {
			if (imp.id && isAstroScript(imp.id)) {
				mods.push(imp);
			}
		}
	}

	// If this is a module that is imported from a <script>, invalidate the Astro
	// component so that it is cached by the time the script gets transformed.
	for (const mod of filtered) {
		if (mod.id && isAstroScript(mod.id) && mod.file) {
			const astroMod = ctx.server.moduleGraph.getModuleById(mod.file);
			if (astroMod) {
				mods.unshift(astroMod);
			}
		}
	}

	// TODO: Svelte files should be marked as `isSelfAccepting` but they don't appear to be
	const isSelfAccepting = mods.every((m) => m.isSelfAccepting || m.url.endsWith('.svelte'));
	if (isSelfAccepting) {
		if (/astro\.config\.[cm][jt]s$/.test(file)) return mods;
		info(logging, 'astro', msg.hmr({ file }));
	} else {
		info(logging, 'astro', msg.reload({ file }));
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
