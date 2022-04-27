import { setup, promiseWithTimeout, timeout, PROMPT_MESSAGES } from './utils.js';
import { sep } from 'path';
import fs from 'fs';
import os from 'os';

describe('[create-astro] astro add', function () {
	this.timeout(timeout);
	let tempDir = '';
	beforeEach(async () => {
		tempDir = await fs.promises.mkdtemp(`${os.tmpdir()}${sep}`);
	});

	it('should use "astro add" when user has installed dependencies', function () {
		const { stdout, stdin } = setup([tempDir, '--dryrun']);
		return promiseWithTimeout((resolve) => {
			const seen = new Set();
			const installPrompt = PROMPT_MESSAGES.install('npm');
			stdout.on('data', (chunk) => {
				if (!seen.has(PROMPT_MESSAGES.template) && chunk.includes(PROMPT_MESSAGES.template)) {
					seen.add(PROMPT_MESSAGES.template);
					stdin.write('\x0D');
				}
				if (!seen.has(installPrompt) && chunk.includes(installPrompt)) {
					seen.add(installPrompt);
					stdin.write('\x0D');
				}
				if (chunk.includes(PROMPT_MESSAGES.astroAdd('astro add'))) {
					resolve();
				}
			});
		});
	});

	it('should use "npx astro@latest add" when use has NOT installed dependencies', function () {
		const { stdout, stdin } = setup([tempDir, '--dryrun']);
		return promiseWithTimeout((resolve) => {
			const seen = new Set();
			const installPrompt = PROMPT_MESSAGES.install('npm');
			stdout.on('data', (chunk) => {
				if (!seen.has(PROMPT_MESSAGES.template) && chunk.includes(PROMPT_MESSAGES.template)) {
					seen.add(PROMPT_MESSAGES.template);
					stdin.write('\x0D');
				}
				if (!seen.has(installPrompt) && chunk.includes(installPrompt)) {
					seen.add(installPrompt);
					stdin.write('n\x0D');
				}
				if (chunk.includes(PROMPT_MESSAGES.astroAdd('npx astro@latest add'))) {
					resolve();
				}
			});
		});
	});
});
