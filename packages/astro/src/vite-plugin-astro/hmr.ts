import type { HmrContext } from 'vite';
import type { Logger } from '../core/logger/core.js';
import { frontmatterRE } from './utils.js';
import type { CompileMetadata } from './types.js';

export interface HandleHotUpdateOptions {
	logger: Logger;
	astroFileToCompileMetadata: Map<string, CompileMetadata>;
}

export async function handleHotUpdate(
	ctx: HmrContext,
	{ logger, astroFileToCompileMetadata }: HandleHotUpdateOptions
) {
	const compileMetadata = astroFileToCompileMetadata.get(ctx.file);

	// If `ctx.file` is part of a CSS dependency of any Astro file, invalidate its `astroFileToCompileMetadata`
	// so the next transform will re-generate it.
	for (const [astroFile, compileData] of astroFileToCompileMetadata) {
		const isUpdatedFileCssDep = compileData.css.some((css) => css.dependencies?.has(ctx.file));
		if (isUpdatedFileCssDep) {
			astroFileToCompileMetadata.delete(astroFile);
		}
	}

	// Bail if not Astro file, we only handle them below
	if (compileMetadata == null || !ctx.file.endsWith('.astro')) return;

	const oldCode = compileMetadata.originalCode;
	const newCode = await ctx.read();

	// If only the style code has changed, e.g. editing the `color`, then we can directly invalidate
	// the Astro CSS virtual modules only. The main Astro module's JS result will be the same and doesn't
	// need to be invalidated.
	if (isStyleOnlyChanged(oldCode, newCode)) {
		logger.debug('watch', 'style-only change');
		// Invalidate its `astroFileToCompileMetadata` so that its next transform will re-generate it
		astroFileToCompileMetadata.delete(ctx.file);
		// Only return the Astro styles that have changed!
		return ctx.modules.filter((mod) => mod.id?.includes('astro&type=style'));
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
