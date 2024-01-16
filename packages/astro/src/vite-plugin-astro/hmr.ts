import path from 'node:path';
import { appendForwardSlash } from '@astrojs/internal-helpers/path';
import type { HmrContext } from 'vite';
import type { AstroConfig } from '../@types/astro.js';
import type { cachedCompilation } from '../core/compile/index.js';
import { invalidateCompilation, isCached, type CompileResult } from '../core/compile/index.js';
import type { Logger } from '../core/logger/core.js';

export interface HandleHotUpdateOptions {
	config: AstroConfig;
	logger: Logger;
	astroFileToCssAstroDeps: Map<string, Set<string>>;

	compile: () => ReturnType<typeof cachedCompilation>;
	source: string;
}

export async function handleHotUpdate(
	ctx: HmrContext,
	{ config, logger, astroFileToCssAstroDeps, compile, source }: HandleHotUpdateOptions
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

	if (isStyleOnlyChange) {
		logger.debug('watch', 'style-only change');
		// Only return the Astro styles that have changed!
		return ctx.modules.filter((mod) => mod.id?.includes('astro&type=style'));
	}

	// Edge case handling usually caused by Tailwind creating circular dependencies
	//
	// TODO: we can also workaround this with better CSS dependency management for Astro files,
	// so that changes within style tags are scoped to itself. But it'll take a bit of work.
	// https://github.com/withastro/astro/issues/9370#issuecomment-1850160421
	for (const [astroFile, cssAstroDeps] of astroFileToCssAstroDeps) {
		// If the `astroFile` has a CSS dependency on `ctx.file`, there's a good chance this causes a
		// circular dependency, which Vite doesn't issue a full page reload. Workaround it by forcing a
		// full page reload ourselves. (Vite bug)
		// https://github.com/vitejs/vite/pull/15585
		if (cssAstroDeps.has(ctx.file)) {
			// Mimic the HMR log as if this file is updated
			logger.info('watch', getShortName(ctx.file, ctx.server.config.root));
			// Invalidate the modules of `astroFile` explicitly as Vite may incorrectly soft-invalidate
			// the parent if the parent actually imported `ctx.file`, but `this.addWatchFile` was also called
			// on `ctx.file`. Vite should do a hard-invalidation instead. (Vite bug)
			const parentModules = ctx.server.moduleGraph.getModulesByFile(astroFile);
			if (parentModules) {
				for (const mod of parentModules) {
					ctx.server.moduleGraph.invalidateModule(mod);
				}
			}
			ctx.server.ws.send({ type: 'full-reload', path: '*' });
		}
	}
}

function isStyleOnlyChanged(oldResult: CompileResult, newResult: CompileResult) {
	return (
		normalizeCode(oldResult.code) === normalizeCode(newResult.code) &&
		// If style tags are added/removed, we need to regenerate the main Astro file
		// so that its CSS imports are also added/removed
		oldResult.css.length === newResult.css.length &&
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

function getShortName(file: string, root: string): string {
	return file.startsWith(appendForwardSlash(root)) ? path.posix.relative(root, file) : file;
}
