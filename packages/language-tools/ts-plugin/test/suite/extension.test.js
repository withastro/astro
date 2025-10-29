const assert = require('node:assert');
const path = require('node:path');
const vscode = require('vscode');

suite('Extension Test Suite', () => {
	vscode.window.showInformationMessage('Start all tests.');

	// TypeScript takes a while to wake up and there's unfortunately no good way to wait for it
	async function waitForTS(command, commandArgs, condition) {
		for (let i = 0; i < 2000; i++) {
			const commandResult = await vscode.commands.executeCommand(command, ...commandArgs);
			if (condition(commandResult)) {
				return commandResult;
			}
			await new Promise((resolve) => setTimeout(resolve, 100));
		}
		throw new Error(
			`TypeScript plugin never started or condition never resolved for command ${command}`,
		);
	}

	test('can find references inside Astro files', async () => {
		const doc = await vscode.workspace.openTextDocument(
			vscode.Uri.file(path.join(__dirname, '../fixtures/script.ts')),
		);

		const references = await waitForTS(
			'vscode.executeReferenceProvider',
			[doc.uri, new vscode.Position(0, 18)],
			(result) => result.length > 1,
		);

		const hasAstroRef = references.some((ref) => ref.uri.path.includes('MyAstroComponent.astro'));
		assert.strictEqual(hasAstroRef, true, 'Should find Astro reference');
	}).timeout(50000);

	test('can get completions for Astro components', async () => {
		const doc = await vscode.workspace.openTextDocument(
			vscode.Uri.file(path.join(__dirname, '../fixtures/script.ts')),
		);

		const completions = await waitForTS(
			'vscode.executeCompletionItemProvider',
			[doc.uri, new vscode.Position(4, 12)],
			(result) => result.items.length > 0,
		);

		const hasAstroCompletion = completions.items.some((item) => {
			return item.insertText === 'MyAstroComponent';
		});
		assert.strictEqual(hasAstroCompletion, true, 'Should find Astro component completion');
	}).timeout(50000);

	test('can get implementations inside Astro files', async () => {
		const doc = await vscode.workspace.openTextDocument(
			vscode.Uri.file(path.join(__dirname, '../fixtures/script.ts')),
		);

		const implementations = await waitForTS(
			'vscode.executeImplementationProvider',
			[doc.uri, new vscode.Position(6, 15)],
			(result) => result.length > 1,
		);

		const hasAstroImplementation = implementations.some((impl) =>
			impl.uri.path.includes('MyAstroComponent'),
		);
		assert.strictEqual(hasAstroImplementation, true, 'Should find Astro implementation');
	}).timeout(50000);
});
