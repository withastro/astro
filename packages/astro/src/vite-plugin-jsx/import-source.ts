import type { TsConfigJson } from 'tsconfig-resolver';
import type { AstroRenderer } from '../@types/astro';
import { parseNpmName } from '../core/util.js';

export async function detectImportSource(
	code: string,
	jsxRenderers: Map<string, AstroRenderer>,
	tsConfig?: TsConfigJson
): Promise<string | undefined> {
	let importSource = detectImportSourceFromComments(code);
	if (!importSource && /import/.test(code)) {
		importSource = await detectImportSourceFromImports(code, jsxRenderers);
	}
	if (!importSource && tsConfig) {
		importSource = tsConfig.compilerOptions?.jsxImportSource;
	}
	return importSource;
}

// Matches import statements and dynamic imports. Captures import specifiers only.
// Adapted from: https://github.com/vitejs/vite/blob/97f8b4df3c9eb817ab2669e5c10b700802eec900/packages/vite/src/node/optimizer/scan.ts#L47-L48
const importsRE =
	/(?<!\/\/.*)(?<=^|;|\*\/)\s*(?:import(?!\s+type)(?:[\w*{}\n\r\t, ]+from)?\s*("[^"]+"|'[^']+')\s*(?=$|;|\/\/|\/\*)|import\s*\(\s*("[^"]+"|'[^']+')\s*\))/gm;

/**
 * Scan a file's imports to detect which renderer it may need.
 * ex: if the file imports "preact", it's safe to assume the
 * component should be built as a Preact component.
 * If no relevant imports found, return undefined.
 */
async function detectImportSourceFromImports(
	code: string,
	jsxRenderers: Map<string, AstroRenderer>
): Promise<string | undefined> {
	let m;
	importsRE.lastIndex = 0;
	while ((m = importsRE.exec(code)) != null) {
		const spec = (m[1] || m[2]).slice(1, -1);
		const pkg = parseNpmName(spec);
		if (pkg && jsxRenderers.has(pkg.name)) {
			return pkg.name;
		}
	}
}

/**
 * Scan a file for an explicit @jsxImportSource comment.
 * If one is found, return it's value. Otherwise, return undefined.
 */
function detectImportSourceFromComments(code: string): string | undefined {
	// if no imports were found, look for @jsxImportSource comment
	const multiline = code.match(/\/\*\*?[\S\s]*\*\//gm) || [];
	for (const comment of multiline) {
		const [, lib] = comment.slice(0, -2).match(/@jsxImportSource\s*(\S+)/) || [];
		if (lib) {
			return lib.trim();
		}
	}
}
