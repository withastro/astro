import { execa} from 'execa';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import {promises, existsSync} from 'fs'

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const createAstroError = new Error('Timed out waiting for create-astro to respond with expected output.')
const timeout = 5000;

const instructions = {
	directory: 'Where would you like to create your app?',
	template: 'Which app template would you like to use?', 
};
const inputs = {
	nonEmptyDir: './fixtures/select-directory/nonempty-dir',
	emptyDir: './fixtures/select-directory/empty-dir',
	nonexistentDir: './fixtures/select-directory/banana-dir',
};

function promiseWithTimeout(testFn) {
	return new Promise((resolve, reject) => {
		const timeoutEvent = setTimeout(() => {
			reject(createAstroError);
		}, timeout);
		function resolver() {
			clearTimeout(timeoutEvent);
			resolve();
		}
		testFn(resolver);
	})
}

function setup(args = []) {
	const {stdout, stdin} = execa('../create-astro.mjs', args, { cwd: __dirname })
	return {
		stdin,
		stdout,
	}
}

describe('[create-astro] select directory', function() {
	this.timeout(timeout);
	it ('should prompt for directory when none is provided', function () {
		return promiseWithTimeout(resolve => {
			const {stdout} = setup()
			stdout.on('data', chunk => {
				if (chunk.includes(instructions.directory)) {
					resolve()
				}
			})
		})
	})
	it ('should NOT proceed on a non-empty directory', function () {
		return promiseWithTimeout(resolve => {
			const {stdout} = setup([inputs.nonEmptyDir])
			stdout.on('data', chunk => {
				if (chunk.includes(instructions.directory)) {
					resolve()
				}
			})
		})
	})
	it ('should proceed on an empty directory', async function () {
		const resolvedEmptyDirPath = resolve(__dirname, inputs.emptyDir)
		if (!existsSync(resolvedEmptyDirPath)) {
			await promises.mkdir(resolvedEmptyDirPath)
		}
		return promiseWithTimeout(resolve => {
			const {stdout} = setup([inputs.emptyDir])
			stdout.on('data', chunk => {
				if (chunk.includes(instructions.template)) {
					resolve()
				}
			})
		})
	})
	it ('should proceed when directory does not exist', function () {
		return promiseWithTimeout(resolve => {
			const {stdout} = setup([inputs.nonexistentDir])
			stdout.on('data', chunk => {
				if (chunk.includes(instructions.template)) {
					resolve()
				}
			})
		})
	})
	it ('should error on bad directory selection in prompt', function () {
		return promiseWithTimeout(resolve => {
			const {stdout, stdin} = setup()
			stdout.on('data', chunk => {
				if (chunk.includes('Please clear contents or choose a different path.')) {
					resolve()
				}
				if (chunk.includes(instructions.directory)) {
					stdin.write(`${inputs.nonEmptyDir}\x0D`)
				}
			})
		})
	})
})
