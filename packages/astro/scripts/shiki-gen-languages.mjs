import fs from 'node:fs';

const dir = await fs.promises.readdir('packages/astro/node_modules/shiki/languages/');

const langImports = dir.map((f) => {
	const key = f.slice(0, f.indexOf('.tmLanguage.json'));
	return [key, `import('shiki/languages/${f}').then((mod) => handleLang(mod.default, '${key}'))`];
});

let code = `\
/**
 * This file is prebuilt from packages/astro/scripts/shiki-gen-languages.mjs
 * Do not edit this directly, but instead edit that file and rerun it to generate this file.
 */

import { BUNDLED_LANGUAGES } from 'shiki';

function handleLang(grammar, language) {
	const lang = BUNDLED_LANGUAGES.find((l) => l.id === language);
	if (lang) {
		return {
			...lang,
			grammar,
		};
	} else {
		return undefined;
	}
}

// prettier-ignore
export const languages = {`;

for (const [key, imp] of langImports) {
	code += `\n\t'${key}': () => ${imp},`;
}
code += '\n};';

// eslint-disable-next-line no-console
console.log(code);

/**
 * Run this script and pipe it into the output file, for ex.
 * node packages/astro/scripts/shiki-gen-languages.mjs > packages/astro/components/shiki-languages.js
 */
