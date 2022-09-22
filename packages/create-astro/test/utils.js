import { execa } from 'execa';
import { dirname } from 'path';
import stripAnsi from 'strip-ansi';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
export const testDir = dirname(__filename);
export const timeout = 5000;

const timeoutError = function (details) {
	let errorMsg = 'Timed out waiting for create-astro to respond with expected output.';
	if (details) {
		errorMsg += '\nLast output: "' + details + '"';
	}
	return new Error(errorMsg);
};

export function promiseWithTimeout(testFn) {
	return new Promise((resolve, reject) => {
		let lastStdout;
		function onStdout(chunk) {
			lastStdout = stripAnsi(chunk.toString()).trim() || lastStdout;
		}

		const timeoutEvent = setTimeout(() => {
			reject(timeoutError(lastStdout));
		}, timeout);
		function resolver() {
			clearTimeout(timeoutEvent);
			resolve();
		}

		testFn(resolver, onStdout);
	});
}

export const PROMPT_MESSAGES = {
	directory: 'Where would you like to create your new project?',
	template: 'Which template would you like to use?',
	typescript: 'How would you like to setup TypeScript?',
	typescriptSucceed: 'Next steps',
};

export function setup(args = []) {
	const { stdout, stdin } = execa('../create-astro.mjs', [...args, '--dryrun'], { cwd: testDir });
	return {
		stdin,
		stdout,
	};
}
