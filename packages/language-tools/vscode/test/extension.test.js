const assert = require('node:assert');
const vscode = require('vscode');

suite('Extension Test Suite', () => {
	vscode.window.showInformationMessage('Start all tests.');

	test('can activate the extension', async function () {
		// This can be slow in CI.
		this.timeout(10000);
		const ext = vscode.extensions.getExtension('astro-build.astro-vscode');
		const activate = await ext?.activate();

		assert.notStrictEqual(activate, undefined);
	});
});
