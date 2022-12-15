import * as eslexer from 'es-module-lexer';
import { PageOptions } from '../vite-plugin-astro/types.js';
import { AstroError, AstroErrorCodes, AstroErrorData } from '../core/errors/index.js'

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
			// For a given export, check the value of the first non-whitespace token. 
			// Basically extract the `true` from the statement `export const prerender = true`
			let expr = code.slice(endOfLocalName).trim().replace(/\=/, '').trim().split(/[;\n]/)[0];
			if (!(expr === 'true' || expr === 'false')) {
				throw new AstroError({
					...AstroErrorData.InvalidPrerenderExport,
					message: AstroErrorData.InvalidPrerenderExport.message(expr),
					location: { file: id }
				});
			} else {
				pageOptions[name as keyof PageOptions] = expr === 'true';
			}
		}
	}
	return pageOptions;
}
