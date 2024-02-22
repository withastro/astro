import path from 'node:path';
import { appendForwardSlash } from '@astrojs/internal-helpers/path';
import type { HmrContext } from 'vite';
import type { Logger } from '../core/logger/core.js';
import type { CompileAstroResult } from './compile.js';
import type { CompileMetadata } from './types.js';
import { frontmatterRE } from './utils.js';

export interface HandleHotUpdateOptions {
	logger: Logger;
	compile: (code: string, filename: string) => Promise<CompileAstroResult>;
	astroFileToCssAstroDeps: Map<string, Set<string>>;
	astroFileToCompileMetadata: Map<string, CompileMetadata>;
}

export async function handleHotUpdate(
	ctx: HmrContext,
	{ logger, compile, astroFileToCssAstroDeps, astroFileToCompileMetadata }: HandleHotUpdateOptions
) {
	const oldCode = astroFileToCompileMetadata.get(ctx.file)?.originalCode;
	const newCode = await ctx.read();
	// If only the style code has changed, e.g. editing the `color`, then we can directly invalidate
	// the Astro CSS virtual modules only. The main Astro module's JS result will be the same and doesn't
	// need to be invalidated.
	if (oldCode && isStyleOnlyChanged(oldCode, newCode)) {
		logger.debug('watch', 'style-only change');
		// Re-compile the main Astro component (even though we know its JS result will be the same)
		// so that `astroFileToCompileMetadata` gets a fresh set of compile metadata to be used
		// by the virtual modules later in the `load()` hook.
		await compile(newCode, ctx.file);
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
			ctx.server.hot.send({ type: 'full-reload', path: '*' });
		}
	}
}

// Disable eslint as we're not sure how to improve this regex yet
// eslint-disable-next-line regexp/no-super-linear-backtracking
const scriptRE = /<script(?:\s.*?)?>.*?<\/script>/gs;
// eslint-disable-next-line regexp/no-super-linear-backtracking
const styleRE = /<style(?:\s.*?)?>.*?<\/style>/gs;

export function isStyleOnlyChanged(oldCode: string, newCode: string) {
	if (oldCode === newCode) return false;

	// Before we can regex-capture style tags, we remove the frontmatter and scripts
	// first as they could contain false-positive style tag matches. At the same time,
	// we can also compare if they have changed and early out.

	// Strip off and compare frontmatter
	let oldFrontmatter = '';
	let newFrontmatter = '';
	oldCode = oldCode.replace(frontmatterRE, (m) => ((oldFrontmatter = m), ''));
	newCode = newCode.replace(frontmatterRE, (m) => ((newFrontmatter = m), ''));
	if (oldFrontmatter !== newFrontmatter) return false;

	// Strip off and compare scripts
	const oldScripts: string[] = [];
	const newScripts: string[] = [];
	oldCode = oldCode.replace(scriptRE, (m) => (oldScripts.push(m), ''));
	newCode = newCode.replace(scriptRE, (m) => (newScripts.push(m), ''));
	if (!isArrayEqual(oldScripts, newScripts)) return false;

	// Finally, we can compare styles
	const oldStyles: string[] = [];
	const newStyles: string[] = [];
	oldCode = oldCode.replace(styleRE, (m) => (oldStyles.push(m), ''));
	newCode = newCode.replace(styleRE, (m) => (newStyles.push(m), ''));

	// Remaining of `oldCode` and `newCode` is the markup, return false if they're different
	if (oldCode !== newCode) return false;

	// Finally, check if only the style changed.
	// The length must also be the same for style only change. If style tags are added/removed,
	// we need to regenerate the main Astro file so that its CSS imports are also added/removed
	return oldStyles.length === newStyles.length && !isArrayEqual(oldStyles, newStyles);
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
