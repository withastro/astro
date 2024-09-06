import { spawn } from 'child_process';
import { readdirSync } from 'fs';
import { dirname, join, resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const dummyGrammarDir = resolve(__dirname, './dummy');
const dummyGrammars = readdirSync(dummyGrammarDir).map((file) => join(dummyGrammarDir, file));

const grammarDir = resolve(__dirname, '../../syntaxes');
const grammars = readdirSync(grammarDir)
	.filter((file) => file.endsWith('.json'))
	.map((file) => join(grammarDir, file));

const allGrammars = [...grammars, ...dummyGrammars];

/**
 * Escapes command line arguments for Windows
 * @param {string} arg
 * @returns {string}
 *
 * Escaping sequences obtained trusting https://www.robvanderwoude.com/escapechars.php#:~:text=In%20batch%20files%2C%20the%20percent,instead%20of%20being%20further%20interpreted.
 */
function escapeWindowsArg(arg) {
	// If the argument doesn't contain spaces or special characters, return it as is
	const single_charac_escape = /(['`,;=()<>|&^])/g;
	const double_carat_escape = /(!)/g;
	const percentage_escape = /(%)/g;
	const backlash_escape = /([\\"[\].*?])/g;
	if (
		![single_charac_escape, double_carat_escape, percentage_escape, backlash_escape].some((regex) =>
			regex.test(arg),
		)
	) {
		return arg;
	}

	// This one must go first, since it would otherwise conflict with the ! rule
	arg = arg.replace(single_charac_escape, '^$1');
	arg = arg.replace(double_carat_escape, '^^$1');
	arg = arg.replace(percentage_escape, '%$1');
	arg = arg.replace(backlash_escape, '\\$1');

	// Wrap the entire argument in double quotes
	return `"${arg}"`;
}

/**
 * @param  {Parameters<typeof spawn>} arg
 * @returns {Promise<number | null>}
 */
function promisifySpawn(...arg) {
	const childProcess = spawn(...arg);
	return new Promise((cb) => {
		childProcess.on('exit', (code) => {
			cb(code);
		});

		childProcess.on('error', (err) => {
			console.error(err);
			cb(1);
		});
	});
}

async function snapShotTest() {
	const extraArgs = process.argv.slice(2);
	const isWindows = process.platform === 'win32';

	const args = [
		'vscode-tmgrammar-snap',
		'-s',
		'source.astro',
		'./test/grammar/fixtures/**/*.astro',
		...allGrammars.reduce((/** @type string[] */ previous, path) => [...previous, '-g', path], []),
		...extraArgs,
	].map((arg) => {
		if (isWindows) return escapeWindowsArg(arg);
		return arg;
	});

	const code = await promisifySpawn(isWindows ? 'pnpm.cmd' : 'pnpm', args, {
		stdio: 'inherit',
		// windows shell escaping on nodejs doesn't work
		// See https://github.com/nodejs/node/issues/52554 and https://github.com/withastro/language-tools/pull/893
		shell: isWindows,
	});

	if (code && code > 0) {
		process.exit(code);
	}
}

snapShotTest();
