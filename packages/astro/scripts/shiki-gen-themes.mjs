import fs from 'fs';

const dir = await fs.promises.readdir('packages/astro/node_modules/shiki/themes/');

const themeImports = dir.map((f) => {
	return [f.slice(0, f.indexOf('.json')), `import('shiki/themes/${f}').then(mod => mod.default)`];
});

let code = `export const themes = {`;
let i = 0;
for (const [key, imp] of themeImports) {
	if (i > 0) {
		code += ',';
	}
	code += `\n\t'${key}': () => ${imp}`;
	i++;
}
code += '\n};';

// eslint-disable-next-line no-console
console.log(code);

/**
 * Run this script and pipe it into the output file, for ex.
 * node packages/astro/scripts/shiki-gen-themes.mjs > packages/astro/components/shiki-themes.js
 */
