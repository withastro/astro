import type { AstroSettings } from '../@types/astro.js';
import type { PageOptions } from '../vite-plugin-astro/types.js';

import * as eslexer from 'es-module-lexer';
import { AstroError, AstroErrorData } from '../core/errors/index.js';

const BOOLEAN_EXPORTS = new Set(['prerender']);
type BuiltInExports = Exclude<keyof PageOptions, 'custom'>;

// Quick scan to determine if code includes recognized export
// False positives are not a problem, so be forgiving!
function includesExport(code: string) {
	return code.includes('export const');
}

// Support quoted values to allow statically known `import.meta.env` variables to be used
function isQuoted(value: string) {
	return (value[0] === '"' || value[0] === "'") && value[value.length - 1] === value[0];
}

function isTruthy(value: string) {
	if (isQuoted(value)) {
		value = value.slice(1, -1);
	}
	return value === 'true' || value === '1';
}

function isFalsy(value: string) {
	if (isQuoted(value)) {
		value = value.slice(1, -1);
	}
	return value === 'false' || value === '0';
}

let didInit = false;

export async function scan(
	code: string,
	id: string,
	settings?: AstroSettings
): Promise<PageOptions> {
	if (!includesExport(code)) return {};
	if (!didInit) {
		await eslexer.init;
		didInit = true;
	}

	const [, exports] = eslexer.parse(code, id);

	let pageOptions: PageOptions = {};
	for (const _export of exports) {
		const { n: name, le: endOfLocalName } = _export;
		// For a given export, check the value of the local declaration
		// Basically extract the `const` from the statement `export const prerender = true`
		const prefix = code
			.slice(0, endOfLocalName)
			.split('export')
			.pop()!
			.trim()
			.replace(name, '')
			.trim();
		// For a given export, check the value of the first non-whitespace token.
		// Basically extract the `true` from the statement `export const prerender = true`
		const suffix = code.slice(endOfLocalName).trim().replace(/\=/, '').trim().split(/[;\n]/)[0];

		const isBuiltIn = BOOLEAN_EXPORTS.has(name);

		if (prefix !== 'const' || !(isTruthy(suffix) || isFalsy(suffix))) {
			// Only throw an error for built-in exports
			if (isBuiltIn) {
				throw new AstroError({
					...AstroErrorData.InvalidPrerenderExport,
					message: AstroErrorData.InvalidPrerenderExport.message(
						prefix,
						suffix,
						settings?.config.output === 'hybrid' ?? false
					),
					location: { file: id },
				});
			}
		} else {
			if (isBuiltIn) {
				pageOptions[name as BuiltInExports] = isTruthy(suffix);
			} else {
				pageOptions.custom = pageOptions.custom ?? {};
				pageOptions.custom[name] = isTruthy(suffix);
			}
		}
	}

	return pageOptions;
}
