import fs from 'node:fs';

const dir = await fs.promises.readdir('packages/astro/node_modules/shiki/themes/');

const toThemeImport = (theme) => `import('shiki/themes/${theme}').then(mod => mod.default)`;

const themeImports = dir.map((f) => {
	return [f.slice(0, f.indexOf('.json')), toThemeImport(f)];
});

let code = `\
/**
 * This file is prebuilt from packages/astro/scripts/shiki-gen-themes.mjs
 * Do not edit this directly, but instead edit that file and rerun it to generate this file.
 */

// prettier-ignore
export const themes = {`;

for (const [key, imp] of themeImports) {
	code += `\n\t'${key}': () => ${imp},`;
}
code += '\n};';

// eslint-disable-next-line no-console
console.log(code);

/**
 * Run this script and pipe it into the output file, for ex.
 * node packages/astro/scripts/shiki-gen-themes.mjs > packages/astro/components/shiki-themes.js
 */
