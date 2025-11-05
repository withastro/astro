import { spawn } from 'node:child_process';
import { readdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const dummyGrammarDir = resolve(__dirname, './dummy');
const dummyGrammars = readdirSync(dummyGrammarDir).map((file) => join(dummyGrammarDir, file));

const grammarDir = resolve(__dirname, '../../syntaxes');
const grammars = readdirSync(grammarDir)
	.filter((file) => file.endsWith('.json'))
	.map((file) => join(grammarDir, file));

const allGrammars = [...grammars, ...dummyGrammars];

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
	].map((arg) => (isWindows && arg.includes(' ') ? `"${arg}"` : arg));

	const code = await promisifySpawn(isWindows ? 'pnpm.cmd' : 'pnpm', args, {
		stdio: 'inherit',
		shell: isWindows,
	});

	if (code && code > 0) {
		process.exit(code);
	}
}

snapShotTest();
