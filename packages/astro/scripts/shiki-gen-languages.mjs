import fs from 'fs';

const dir = await fs.promises.readdir('packages/astro/node_modules/shiki/languages/');

const langImports = dir.map((f) => {
	const key = f.slice(0, f.indexOf('.tmLanguage.json'));
	return [
		key,
		`import('shiki/languages/${f}').then(mod => mod.default).then(grammar => {
	const lang = BUNDLED_LANGUAGES.find(l => l.id === '${key}');
	if(lang) {
		return {
			...lang,
			grammar
		};
	} else {
		return undefined;
	}
})`,
	];
});
let code = `import { BUNDLED_LANGUAGES } from 'shiki';

export const languages = {`;
let i = 0;
for (const [key, imp] of langImports) {
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
 * node packages/astro/scripts/shiki-gen-languages.mjs > packages/astro/components/shiki-languages.js
 */
