import { execa } from 'execa';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
export const testDir = dirname(__filename);
export const timeoutNoDisk = 5000;
export const timeoutDiskAccess = 10000;

const timeoutError = function (details) {
	let errorMsg =
	  'Timed out waiting for create-astro to respond with expected output.';
	if (details) {
		errorMsg += '\nLast output: "' + details + '"';
	}
	return new Error(errorMsg);
}

export function promiseWithVariableTimeout(timeout) {
	return function promiseWithTimeout(testFn, onTimeout) {
		return new Promise((resolve, reject) => {
			const timeoutEvent = setTimeout(() => {
				const details = onTimeout ? onTimeout() : null;
				reject(timeoutError(details));
			}, timeout);
			function resolver() {
				clearTimeout(timeoutEvent);
				resolve();
			}
			testFn(resolver);
		});
	}
}

export const PROMPT_MESSAGES = {
	directory: 'Where would you like to create your new project?',
	template: 'Which template would you like to use?',
	typescript: 'How would you like to setup TypeScript?',
	typescriptSucceed: 'Next steps'
};

export function setup(args = []) {
	const { stdout, stdin } = execa('../create-astro.mjs', [...args, '--dryrun'], { cwd: testDir });
	return {
		stdin,
		stdout,
	};
}
