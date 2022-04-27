import { setup, promiseWithTimeout, timeout, PROMPT_MESSAGES } from './utils.js';
import { sep } from 'path';
import fs from 'fs';
import os from 'os';

// reset package manager in process.env
// prevents test issues when running with pnpm
const FAKE_PACKAGE_MANAGER = 'npm';
let initialEnvValue = null;

describe('[create-astro] astro add', function () {
	this.timeout(timeout);
	let tempDir = '';
	beforeEach(async () => {
		tempDir = await fs.promises.mkdtemp(`${os.tmpdir()}${sep}`);
	});
	this.beforeAll(() => {
		initialEnvValue = process.env.npm_config_user_agent;
		process.env.npm_config_user_agent = FAKE_PACKAGE_MANAGER;
	});
	this.afterAll(() => {
		process.env.npm_config_user_agent = initialEnvValue;
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
				if (chunk.includes(PROMPT_MESSAGES.astroAdd('astro add --yes'))) {
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
				if (chunk.includes(PROMPT_MESSAGES.astroAdd('npx astro@latest add --yes'))) {
					resolve();
				}
			});
		});
	});
});
