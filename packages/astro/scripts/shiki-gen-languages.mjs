import fs from 'fs';

const dir = await fs.promises.readdir('packages/astro/node_modules/shiki/languages/');

const langImports = dir.map(f => {
	return [
		f.slice(0, f.indexOf('.tmLanguage.json')),
		`import('shiki/languages/${f}')`
	];
});
let code = `export const languages = {`;
let i = 0;
for(const [key, imp] of langImports) {
	if(i > 0) {
		code += ',';
	}
	code += `\n\t'${key}': () => ${imp}`;
	i++;
}
code += '\n};';

console.log(code);

/**
 * Run this script and pipe it into the output file, for ex.
 * node packages/astro/scripts/shiki-gen-languages.mjs > packages/astro/components/shiki-languages.js
 */
