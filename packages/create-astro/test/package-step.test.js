import runTest, { ENTER } from "cli-prompts-test";
import { expect } from 'chai';
import { deleteSync } from 'del';
import { existsSync, mkdirSync, readdirSync, readFileSync } from 'fs';
import path from 'path';
import { PROMPT_MESSAGES, testDir, timeout } from './utils.js';
import stripAnsi from 'strip-ansi';

const cliPath = path.join(testDir, "../create-astro.mjs");

const inputs = {
	emptyDir: './fixtures/update-package-name/empty-dir',
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

function getPackageJson(installDir) {
	const filePath = path.resolve(testDir, installDir, 'package.json');
	return JSON.parse(readFileSync(filePath, 'utf-8'));
}

const testArgs = [
	inputs.emptyDir,
	'--skip-houston',
	'--install',
	'0',
	'--git',
	'0',
	'--typescript',
	'strict',
];

describe('[create-astro] update package name', function () {
	this.timeout(30000);

	beforeEach(ensureEmptyDir);

	afterEach(ensureEmptyDir);

	it('should the package name is changed if no value is given by the user', async function () {
		const template = 'minimal';
		const args = [
			...testArgs,
			...['--template', template]
		]
		const { exitCode, stdout } = await runTest([cliPath].concat(args), [
			ENTER,
		], {
			testPath: testDir,
			timeout,
		});

		await expect(exitCode).to.equal(0);
		// TODO: This should true, so we have to fix the implementation
		// await expect(stripAnsi(stderr).trim()).to.be.empty;
		await expect(stripAnsi(stdout).trim()).to.contain(PROMPT_MESSAGES.packageSucceed);

		const packageJson = getPackageJson(inputs.emptyDir);
		const pkgName = packageJson.name;
		await expect(pkgName).to.not.equal(`@example/${template}`);
	});

	it('should the package name is not changed if the user cancels the operation', async function () {
		const template = 'minimal';
		const args = [
			...testArgs,
			...[
				'--template',
				template,
			]
		]
		const { exitCode, stdout } = await runTest([cliPath].concat(args), [
			"\x1B", // ESC hex code
		], {
			testPath: testDir,
			timeout,
		});

		await expect(exitCode).to.equal(0);
		// TODO: This should true, so we have to fix the implementation
		// await expect(stripAnsi(stderr).trim()).to.be.empty;
		await expect(stripAnsi(stdout).trim()).to.contain(PROMPT_MESSAGES.packageIgnored);

		const packageJson = getPackageJson(inputs.emptyDir);
		const pkgName = packageJson.name;
		await expect(pkgName).to.equal(`@example/${template}`);
	});

	it('should the package name matches the passed argument --package', async function () {
		const expectedPkgName = 'astro-test';
		const args = [
			...testArgs,
			...[
				'--template',
				'minimal',
				'--package',
				expectedPkgName,
			]
		]
		const { exitCode, stdout } = await runTest([cliPath].concat(args), [
			ENTER,
		], {
			testPath: testDir,
			timeout,
		});

		await expect(exitCode).to.equal(0);
		// TODO: This should true, so we have to fix the implementation
		// await expect(stripAnsi(stderr).trim()).to.be.empty;
		await expect(stripAnsi(stdout).trim()).to.contain(PROMPT_MESSAGES.packageSucceed);

		const packageJson = getPackageJson(inputs.emptyDir);
		const pkgName = packageJson.name;
		await expect(pkgName).to.equal(expectedPkgName);
	});

	it('should the package name matches the user input', async function () {
		const expectedPkgName = 'astro-test';
		const args = [
			...testArgs,
			...[
				'--template',
				'minimal',
			]
		]
		const { exitCode, stdout } = await runTest([cliPath].concat(args), [
			`${expectedPkgName}${ENTER}`,
		], {
			testPath: testDir,
			timeout,
		});

		await expect(exitCode).to.equal(0);
		// TODO: This should true, so we have to fix the implementation
		// await expect(stripAnsi(stderr).trim()).to.be.empty;
		await expect(stripAnsi(stdout).trim()).to.contain(PROMPT_MESSAGES.packageSucceed);

		const packageJson = getPackageJson(inputs.emptyDir);
		const pkgName = packageJson.name;
		await expect(pkgName).to.equal(expectedPkgName);
	});
});
