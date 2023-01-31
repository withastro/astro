import { expect } from 'chai';
import { deleteSync } from 'del';
import { existsSync, mkdirSync, readdirSync, readFileSync } from 'fs';
import path from 'path';
import { PROMPT_MESSAGES, testDir, setup, promiseWithTimeout, timeout } from './utils.js';

const inputs = {
	emptyDir: './fixtures/select-typescript/empty-dir',
};

function isEmpty(dirPath) {
	return !existsSync(dirPath) || readdirSync(dirPath).length === 0;
}

function ensureEmptyDir() {
	const dirPath = path.resolve(testDir, inputs.emptyDir);
	if (!existsSync(dirPath)) {
		mkdirSync(dirPath, { recursive: true });
	} else if (!isEmpty(dirPath)) {
		const globPath = path.resolve(dirPath, '*');
		deleteSync(globPath, { dot: true });
	}
}

function getTsConfig(installDir) {
	const filePath = path.resolve(testDir, installDir, 'tsconfig.json');
	return JSON.parse(readFileSync(filePath, 'utf-8'));
}

describe('[create-astro] select typescript', function () {
	this.timeout(timeout);

	beforeEach(ensureEmptyDir);

	afterEach(ensureEmptyDir);

	it('should prompt for typescript when none is provided', async function () {
		return promiseWithTimeout(
			(resolve, onStdout) => {
				const { stdout } = setup([
					inputs.emptyDir,
					'--template',
					'minimal',
					'--install',
					'0',
					'--git',
					'0',
				]);
				stdout.on('data', (chunk) => {
					onStdout(chunk);
					if (chunk.includes(PROMPT_MESSAGES.typescript)) {
						resolve();
					}
				});
			},
			() => lastStdout
		);
	});

	it('should not prompt for typescript when provided', async function () {
		return promiseWithTimeout(
			(resolve, onStdout) => {
				const { stdout } = setup([
					inputs.emptyDir,
					'--template',
					'minimal',
					'--install',
					'0',
					'--git',
					'0',
					'--typescript',
					'base',
				]);
				stdout.on('data', (chunk) => {
					onStdout(chunk);
					if (chunk.includes(PROMPT_MESSAGES.typescriptSucceed)) {
						resolve();
					}
				});
			},
			() => lastStdout
		);
	});

	it('should use "strict" config when specified', async function () {
		return promiseWithTimeout(
			(resolve, onStdout) => {
				let wrote = false;
				const { stdout, stdin } = setup([
					inputs.emptyDir,
					'--template',
					'minimal',
					'--install',
					'0',
					'--git',
					'0',
				]);
				stdout.on('data', (chunk) => {
					onStdout(chunk);
					if (!wrote && chunk.includes(PROMPT_MESSAGES.typescript)) {
						// Enter (strict is default)
						stdin.write('\n');
						wrote = true;
					}
					if (chunk.includes(PROMPT_MESSAGES.typescriptSucceed)) {
						const tsConfigJson = getTsConfig(inputs.emptyDir);
						expect(tsConfigJson).to.deep.equal({ extends: 'astro/tsconfigs/strict' });
						resolve();
					}
				});
			},
			() => lastStdout
		);
	});

	it('should create tsconfig.json when missing', async function () {
		return promiseWithTimeout(
			(resolve, onStdout) => {
				const { stdout } = setup([
					inputs.emptyDir,
					'--template',
					'cassidoo/shopify-react-astro',
					'--install',
					'0',
					'--git',
					'0',
					'--typescript',
					'base',
				]);
				stdout.on('data', (chunk) => {
					onStdout(chunk);
					if (chunk.includes(PROMPT_MESSAGES.typescriptSucceed)) {
						const tsConfigJson = getTsConfig(inputs.emptyDir);
						expect(tsConfigJson).to.deep.equal({ extends: 'astro/tsconfigs/base' });
						resolve();
					}
				});
			},
			() => lastStdout
		);
	});
});
