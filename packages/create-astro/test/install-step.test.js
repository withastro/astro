import { setup, promiseWithTimeout, timeout, PROMPT_MESSAGES } from './utils.js';
import { sep } from 'path';
import fs from 'fs';
import os from 'os';

const FAKE_PACKAGE_MANAGER = 'banana';
let initialEnvValue = null;

describe('[create-astro] install', function () {
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

	it('should respect package manager in prompt', function () {
		const { stdout, stdin } = setup([tempDir]);
		return promiseWithTimeout((resolve) => {
			const seen = new Set();
			const installPrompt = PROMPT_MESSAGES.install(FAKE_PACKAGE_MANAGER);
			stdout.on('data', (chunk) => {
				if (!seen.has(PROMPT_MESSAGES.template) && chunk.includes(PROMPT_MESSAGES.template)) {
					seen.add(PROMPT_MESSAGES.template);
					// respond with "enter key"
					stdin.write('\x0D');
				}
				if (!seen.has(installPrompt) && chunk.includes(installPrompt)) {
					seen.add(installPrompt);
					resolve();
				}
			});
		});
	});

	it('should respect package manager in next steps', function () {
		const { stdout, stdin } = setup([tempDir]);
		return promiseWithTimeout((resolve) => {
			const seen = new Set();
			const installPrompt = PROMPT_MESSAGES.install(FAKE_PACKAGE_MANAGER);
			const astroAddPrompt = PROMPT_MESSAGES.astroAdd();
			stdout.on('data', (chunk) => {
				if (!seen.has(PROMPT_MESSAGES.template) && chunk.includes(PROMPT_MESSAGES.template)) {
					seen.add(PROMPT_MESSAGES.template);
					// respond with "enter key"
					stdin.write('\x0D');
				}
				if (!seen.has(installPrompt) && chunk.includes(installPrompt)) {
					seen.add(installPrompt);
					// respond with "no, then enter key"
					stdin.write('n\x0D');
				}
				if (!seen.has(astroAddPrompt) && chunk.includes(astroAddPrompt)) {
					seen.add(astroAddPrompt);
					stdin.write('n\x0D');
				}
				if (!seen.has(PROMPT_MESSAGES.git) && chunk.includes(PROMPT_MESSAGES.git)) {
					seen.add(PROMPT_MESSAGES.git);
					stdin.write('\x0D');
				}
				if (chunk.includes('banana dev')) {
					resolve();
				}
			});
		});
	});
});
