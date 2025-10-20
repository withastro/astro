const path = require('path');
const { runTests } = require('@vscode/test-electron');

async function main() {
	// NOTE: Those tests are very flaky on Windows and macOS, so we'll skip them for now
	if (process.platform === 'win32' || process.platform === 'darwin') {
		process.exit(0);
	}

	try {
		// The folder containing the Extension Manifest package.json
		// Passed to `--extensionDevelopmentPath`
		const extensionDevelopmentPath = path.resolve(__dirname, '../');

		// The path to the extension test script
		// Passed to --extensionTestsPath
		const extensionTestsPath = path.resolve(__dirname, './suite/index.js');

		// Download VS Code, unzip it and run the integration test
		await runTests({ extensionDevelopmentPath, extensionTestsPath });
	} catch {
		console.error('Failed to run tests');
		process.exit(1);
	}
}

main();
