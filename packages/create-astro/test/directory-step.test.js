import { resolve } from 'path';
import { promises, existsSync } from 'fs';
import { PROMPT_MESSAGES, testDir, setup, promiseWithTimeout, timeout } from './utils.js';

const inputs = {
	nonEmptyDir: './fixtures/select-directory/nonempty-dir',
	emptyDir: './fixtures/select-directory/empty-dir',
	nonexistentDir: './fixtures/select-directory/banana-dir',
};

describe('[create-astro] select directory', function () {
	this.timeout(timeout);
	it('should prompt for directory when none is provided', function () {
		return promiseWithTimeout((resolve) => {
			const { stdout } = setup();
			stdout.on('data', (chunk) => {
				if (chunk.includes(PROMPT_MESSAGES.directory)) {
					resolve();
				}
			});
		});
	});
	it('should NOT proceed on a non-empty directory', function () {
		return promiseWithTimeout((resolve) => {
			const { stdout } = setup([inputs.nonEmptyDir]);
			stdout.on('data', (chunk) => {
				if (chunk.includes(PROMPT_MESSAGES.directory)) {
					resolve();
				}
			});
		});
	});
	it('should proceed on an empty directory', async function () {
		const resolvedEmptyDirPath = resolve(testDir, inputs.emptyDir);
		if (!existsSync(resolvedEmptyDirPath)) {
			await promises.mkdir(resolvedEmptyDirPath);
		}
		return promiseWithTimeout((resolve) => {
			const { stdout } = setup([inputs.emptyDir]);
			stdout.on('data', (chunk) => {
				if (chunk.includes(PROMPT_MESSAGES.template)) {
					resolve();
				}
			});
		});
	});
	it('should proceed when directory does not exist', function () {
		return promiseWithTimeout((resolve) => {
			const { stdout } = setup([inputs.nonexistentDir]);
			stdout.on('data', (chunk) => {
				if (chunk.includes(PROMPT_MESSAGES.template)) {
					resolve();
				}
			});
		});
	});
	it('should error on bad directory selection in prompt', function () {
		return promiseWithTimeout((resolve) => {
			const { stdout, stdin } = setup();
			stdout.on('data', (chunk) => {
				if (chunk.includes('is not empty!')) {
					resolve();
				}
				if (chunk.includes(PROMPT_MESSAGES.directory)) {
					stdin.write(`${inputs.nonEmptyDir}\x0D`);
				}
			});
		});
	});
});
