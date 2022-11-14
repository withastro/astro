const path = require('path');
const { runTests } = require('@vscode/test-electron');
const { downloadDirToExecutablePath } = require('./utils');
const { existsSync, readdirSync } = require('fs');

async function main() {
	try {
		// The folder containing the Extension Manifest package.json
		// Passed to `--extensionDevelopmentPath`
		const extensionDevelopmentPath = path.resolve(__dirname, '../../vscode');

		// The path to the extension test script
		// Passed to --extensionTestsPath
		const extensionTestsPath = path.resolve(__dirname, './suite/index.js');

		// If there's already a downloaded version of VS Code, let's use it
		const vscodeTestPath = path.resolve(__dirname, '../../vscode/.vscode-test');
		let vsPath = undefined;
		if (existsSync(vscodeTestPath)) {
			const files = readdirSync(vscodeTestPath);
			files.forEach((file) => {
				if (file.startsWith('vscode-')) {
					vsPath = downloadDirToExecutablePath(path.resolve(__dirname, '../../vscode/.vscode-test/', file));
					return;
				}
			});
		}

		await runTests({
			extensionDevelopmentPath,
			extensionTestsPath,
			vscodeExecutablePath: vsPath,
			launchArgs: ['./fixtures/fixtures.code-workspace'],
		});
	} catch (err) {
		console.error('Failed to run tests');
		process.exit(1);
	}
}

main();
