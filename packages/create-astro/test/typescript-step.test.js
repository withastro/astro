import { expect } from 'chai';
import { deleteSync } from 'del';
import { existsSync, mkdirSync, readdirSync, readFileSync } from 'fs';
import path from 'path';
import { PROMPT_MESSAGES, testDir, setup, promiseWithTimeout, timeoutDiskAccess } from './utils.js';

const inputs = {
	emptyDir: './fixtures/select-typescript/empty-dir',
};

function isEmpty(dirPath) {
	return !existsSync(dirPath) || readdirSync(dirPath).length === 0;
}

function ensureEmptyDir() {
	const dirPath = path.resolve(testDir, inputs.emptyDir);
	if (!existsSync(dirPath)) {
		mkdirSync(dirPath);
	} else if (!isEmpty(dirPath)) {
		deleteSync(dirPath + '/*', { dot: true });
	}
}

function getTsConfig(installDir) {
	const filePath = path.resolve(testDir, installDir, 'tsconfig.json');
	return JSON.parse(readFileSync(filePath, 'utf-8'));
}

describe('[create-astro] select typescript', function () {
	this.timeout(timeoutDiskAccess);

	beforeEach(ensureEmptyDir);

	afterEach(ensureEmptyDir);

	it('should prompt for typescript when none is provided', async function () {
		return promiseWithTimeout((resolve) => {
			const { stdout } = setup([
				inputs.emptyDir,
				'--template', 'minimal',
				'--install', '0',
				'--git', '0'
			]);
			stdout.on('data', (chunk) => {
				if (chunk.includes(PROMPT_MESSAGES.typescript)) {
					resolve();
				}
			});
		});
	});

	it('should not prompt for typescript when provided', async function () {
		return promiseWithTimeout((resolve) => {
			const { stdout } = setup([
				inputs.emptyDir,
				'--template', 'minimal',
				'--install', '0',
				'--git', '0',
				'--typescript', 'base'
			]);
			stdout.on('data', (chunk) => {
				if (chunk.includes(PROMPT_MESSAGES.typescriptSucceed)) {
					resolve();
				}
			});
		});
	});

	it('should use "strict" config when specified', async function () {
		return promiseWithTimeout((resolve) => {
			let wrote = false;
			const { stdout, stdin } = setup([
				inputs.emptyDir,
				'--template', 'minimal',
				'--install', '0',
				'--git', '0'
			]);
			stdout.on('data', (chunk) => {
				if (!wrote && chunk.includes(PROMPT_MESSAGES.typescript)) {
					stdin.write('\x1B\x5B\x42\x0D');
					wrote = true;
				}
				if (chunk.includes(PROMPT_MESSAGES.typescriptSucceed)) {
					const tsConfigJson = getTsConfig(inputs.emptyDir);
					expect(tsConfigJson).to.deep.equal({'extends': 'astro/tsconfigs/strict'});
					resolve();
				}
			});
		});
	});

	it('should create tsconfig.json when missing', async function () {
		return promiseWithTimeout((resolve) => {
			const { stdout } = setup([
				inputs.emptyDir,
				'--template', 'cassidoo/shopify-react-astro',
				'--install', '0',
				'--git', '0',
				'--typescript', 'base'
			]);
			stdout.on('data', (chunk) => {
				if (chunk.includes(PROMPT_MESSAGES.typescriptSucceed)) {
					const tsConfigJson = getTsConfig(inputs.emptyDir);
					expect(tsConfigJson).to.deep.equal({'extends': 'astro/tsconfigs/base'});
					resolve();
				}
			});
		});
	});
});
