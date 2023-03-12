import * as eslexer from 'es-module-lexer';
import { AstroError, AstroErrorData } from '../core/errors/index.js';
import type { PageOptions } from '../vite-plugin-astro/types.js';

const BOOLEAN_EXPORTS = new Set(['prerender']);

// Quick scan to determine if code includes recognized export
// False positives are not a problem, so be forgiving!
function includesExport(code: string) {
	for (const name of BOOLEAN_EXPORTS) {
		if (code.includes(name)) return true;
	}
	return false;
}

let didInit = false;

export async function scan(code: string, id: string): Promise<PageOptions> {
	if (!includesExport(code)) return {};
	if (!didInit) {
		await eslexer.init;
		didInit = true;
	}

	const [_, exports] = eslexer.parse(code, id);
	let pageOptions: PageOptions = {};
	for (const _export of exports) {
		const { n: name, le: endOfLocalName } = _export;
		if (BOOLEAN_EXPORTS.has(name)) {
			// For a given export, check the value of the local declaration
			// Basically extract the `const` from the statement `export const prerender = true`
			const prefix = code
				.slice(0, endOfLocalName)
				.split('export')
				.pop()!
				.trim()
				.replace('prerender', '')
				.trim();
			// For a given export, check the value of the first non-whitespace token.
			// Basically extract the `true` from the statement `export const prerender = true`
			const suffix = code.slice(endOfLocalName).trim().replace(/\=/, '').trim().split(/[;\n]/)[0];
			if (prefix !== 'const' || !(suffix === 'true' || suffix === 'false')) {
				throw new AstroError({
					...AstroErrorData.InvalidPrerenderExport,
					message: AstroErrorData.InvalidPrerenderExport.message(prefix, suffix),
					location: { file: id },
				});
			} else {
				pageOptions[name as keyof PageOptions] = suffix === 'true';
			}
		}
	}
	return pageOptions;
}
