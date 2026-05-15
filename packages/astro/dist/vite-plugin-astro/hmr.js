import { parseAstroRequest } from './query.js';
import { frontmatterRE } from './utils.js';
async function handleHotUpdate(ctx, { logger, compile, astroFileToCompileMetadata }) {
	for (const [astroFile, compileData] of astroFileToCompileMetadata) {
		const isUpdatedFileCssDep = compileData.css.some((css) => css.dependencies?.includes(ctx.file));
		if (isUpdatedFileCssDep) {
			astroFileToCompileMetadata.delete(astroFile);
		}
	}
	const oldCode = astroFileToCompileMetadata.get(ctx.file)?.originalCode;
	if (oldCode == null) return;
	const newCode = await ctx.read();
	if (isStyleOnlyChanged(oldCode, newCode)) {
		logger.debug('watch', 'style-only change');
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
const scriptRE = /<script(?:\s.*?)?>.*?<\/script>/gs;
const styleRE = /<style(?:\s.*?)?>.*?<\/style>/gs;
function isStyleOnlyChanged(oldCode, newCode) {
	if (oldCode === newCode) return false;
	let oldFrontmatter = '';
	let newFrontmatter = '';
	oldCode = oldCode.replace(frontmatterRE, (m) => ((oldFrontmatter = m), ''));
	newCode = newCode.replace(frontmatterRE, (m) => ((newFrontmatter = m), ''));
	if (oldFrontmatter !== newFrontmatter) return false;
	const oldScripts = [];
	const newScripts = [];
	oldCode = oldCode.replace(scriptRE, (m) => (oldScripts.push(m), ''));
	newCode = newCode.replace(scriptRE, (m) => (newScripts.push(m), ''));
	if (!isArrayEqual(oldScripts, newScripts)) return false;
	const oldStyles = [];
	const newStyles = [];
	oldCode = oldCode.replace(styleRE, (m) => (oldStyles.push(m), ''));
	newCode = newCode.replace(styleRE, (m) => (newStyles.push(m), ''));
	if (oldCode !== newCode) return false;
	return oldStyles.length === newStyles.length && !isArrayEqual(oldStyles, newStyles);
}
function isArrayEqual(a, b) {
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
export { handleHotUpdate, isStyleOnlyChanged };
