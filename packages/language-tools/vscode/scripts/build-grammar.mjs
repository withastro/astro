// @ts-check
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import yaml from 'js-yaml';
import { dim, green } from 'kleur/colors';

const dt = new Intl.DateTimeFormat('en-us', {
	hour: '2-digit',
	minute: '2-digit',
});

// Rebuild grammar when any yaml in the syntaxes directory changes
const syntaxesDir = new URL('../syntaxes/', import.meta.url);
const isWatch = process.argv.includes('--watch');

if (isWatch) {
	console.info('Watching for changes in the syntaxes directory...');
}

// Absolute paths to the grammars
const grammarFiles = fs
	.readdirSync(syntaxesDir)
	.filter((file) => file.endsWith('.src.yaml'))
	.map((path) => new URL(path, syntaxesDir));
for (const grammarFile of grammarFiles) {
	if (isWatch) {
		fs.watch(grammarFile, () => {
			buildGrammar(grammarFile);
		});
	} else {
		buildGrammar(grammarFile);
	}
}

/**
 * @param {URL} grammarFile
 */
function buildGrammar(grammarFile) {
	const grammar = yaml.load(fs.readFileSync(grammarFile, 'utf8'));
	const finalPath = fileURLToPath(grammarFile).replace('.src.yaml', '.json');
	fs.writeFileSync(finalPath, JSON.stringify(grammar, null, 2));

	const date = dt.format(new Date());
	console.info(dim(`[${date}] `) + green(`✔ updated ${finalPath}`));
}
