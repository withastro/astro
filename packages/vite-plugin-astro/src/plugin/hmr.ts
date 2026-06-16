import type { HmrContext } from 'vite';
import type { CompileAstroResult } from './compile.js';
import { parseAstroRequest } from './query.js';
import type { CompileMetadata } from './types.js';
import { frontmatterRE } from './utils.js';

interface HandleHotUpdateOptions {
	compile: (code: string, filename: string) => Promise<CompileAstroResult>;
	astroFileToCompileMetadata: Map<string, CompileMetadata>;
}

export async function handleHotUpdate(
	ctx: HmrContext,
	{ compile, astroFileToCompileMetadata }: HandleHotUpdateOptions,
) {
	// HANDLING 1: Invalidate compile metadata if CSS dependency updated
	for (const [astroFile, compileData] of astroFileToCompileMetadata) {
		const isUpdatedFileCssDep = compileData.css.some((css) => css.dependencies?.includes(ctx.file));
		if (isUpdatedFileCssDep) {
			astroFileToCompileMetadata.delete(astroFile);
		}
	}

	// HANDLING 2: Only invalidate Astro style virtual module if only style tags changed
	const oldCode = astroFileToCompileMetadata.get(ctx.file)?.originalCode;
	if (oldCode == null) return;
	const newCode = await ctx.read();

	if (isStyleOnlyChanged(oldCode, newCode)) {
		// Eagerly re-compile to update the metadata with the new CSS.
		try {
			await compile(newCode, ctx.file);
		} catch {
			astroFileToCompileMetadata.delete(ctx.file);
		}
		return ctx.modules.filter((mod) => {
			if (!mod.id) {
				return false;
			}
			const { query } = parseAstroRequest(mod.id);
			return query.astro && query.type === 'style' && !query.inline;
		});
	}
}

// Disable eslint as we're not sure how to improve this regex yet
// eslint-disable-next-line regexp/no-super-linear-backtracking
const scriptRE = /<script(?:\s.*?)?>.*?<\/script>/gs;
// eslint-disable-next-line regexp/no-super-linear-backtracking
const styleRE = /<style(?:\s.*?)?>.*?<\/style>/gs;

export function isStyleOnlyChanged(oldCode: string, newCode: string) {
	if (oldCode === newCode) return false;

	let oldFrontmatter = '';
	let newFrontmatter = '';
	oldCode = oldCode.replace(frontmatterRE, (m) => ((oldFrontmatter = m), ''));
	newCode = newCode.replace(frontmatterRE, (m) => ((newFrontmatter = m), ''));
	if (oldFrontmatter !== newFrontmatter) return false;

	const oldScripts: string[] = [];
	const newScripts: string[] = [];
	oldCode = oldCode.replace(scriptRE, (m) => (oldScripts.push(m), ''));
	newCode = newCode.replace(scriptRE, (m) => (newScripts.push(m), ''));
	if (!isArrayEqual(oldScripts, newScripts)) return false;

	const oldStyles: string[] = [];
	const newStyles: string[] = [];
	oldCode = oldCode.replace(styleRE, (m) => (oldStyles.push(m), ''));
	newCode = newCode.replace(styleRE, (m) => (newStyles.push(m), ''));

	if (oldCode !== newCode) return false;

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
