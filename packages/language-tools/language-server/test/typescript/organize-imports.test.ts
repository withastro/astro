import assert from 'node:assert';
import path from 'node:path';
import { before, describe, it } from 'node:test';
import { type CodeAction, Range, TextDocumentEdit } from '@volar/language-server';
import { getLanguageServer, type LanguageServer } from '../server.ts';
import { fixtureDir } from '../test-utils.ts';

function getTextEdits(codeActions: CodeAction[]) {
	return codeActions.flatMap(
		(action) =>
			action.edit?.documentChanges?.flatMap((change) =>
				TextDocumentEdit.is(change) ? change.edits : [],
			) ?? [],
	);
}

describe('TypeScript - Organize & Sort Imports', () => {
	let languageServer: LanguageServer;

	before(async () => (languageServer = await getLanguageServer()));

	it('Can organize imports', async () => {
		const document = await languageServer.openFakeDocument(
			`---\n\nimport os from "node:os";\n\nimport fs from "node:fs";\n\n---\n\n`,
			'astro',
		);
		const organizeActions = await languageServer.handle.sendCodeActionsRequest(
			document.uri,
			Range.create(6, 0, 6, 0),
			{
				diagnostics: [],
				only: ['source.organizeImports'],
				triggerKind: 1,
			},
		);
		const organizeEdits = await Promise.all(
			(organizeActions as CodeAction[]).map((action) =>
				languageServer.handle.sendCodeActionResolveRequest(action),
			),
		);
		assert.deepStrictEqual(getTextEdits(organizeEdits), [
			{
				newText: '',
				range: Range.create(2, 0, 3, 0),
			},
			{
				newText: '',
				range: Range.create(4, 0, 5, 0),
			},
		]);
	});

	it('Can organize imports in files using CRLF', async () => {
		const document = await languageServer.openFakeDocument(
			`---\r\n\r\nimport os from "node:os";\r\n\r\nimport fs from "node:fs";\r\n\r\n---\r\n\r\n`,
			'astro',
		);
		const organizeActions = await languageServer.handle.sendCodeActionsRequest(
			document.uri,
			Range.create(6, 0, 6, 0),
			{
				diagnostics: [],
				only: ['source.organizeImports'],
				triggerKind: 1,
			},
		);
		const organizeEdits = await Promise.all(
			(organizeActions as CodeAction[]).map((action) =>
				languageServer.handle.sendCodeActionResolveRequest(action),
			),
		);

		assert.deepStrictEqual(getTextEdits(organizeEdits), [
			{
				newText: '',
				range: Range.create(2, 0, 3, 0),
			},
			{
				newText: '',
				range: Range.create(4, 0, 5, 0),
			},
		]);
	});

	it('does not return generated component exports', async () => {
		const document = await languageServer.handle.openTextDocument(
			path.join(fixtureDir, 'organize-imports/src/pages/index.astro'),
			'astro',
		);
		const organizeActions = await languageServer.handle.sendCodeActionsRequest(
			document.uri,
			Range.create(1, 0, 1, 0),
			{
				diagnostics: [],
				only: ['source.organizeImports'],
				triggerKind: 1,
			},
		);
		const organizeEdits = await Promise.all(
			(organizeActions as CodeAction[]).map((action) =>
				languageServer.handle.sendCodeActionResolveRequest(action),
			),
		);
		const returnedText = getTextEdits(organizeEdits).map((edit) => edit.newText);

		assert.ok(!returnedText.some((text) => text.includes('IndexAstroComponent as Index')));
		assert.ok(returnedText.some((text) => text.includes('UserAstroComponent as User')));
	});

	it('organizes imports in script tags', async () => {
		const document = await languageServer.handle.openTextDocument(
			path.join(fixtureDir, 'organize-imports/src/pages/index.astro'),
			'astro',
		);
		const organizeActions = await languageServer.handle.sendCodeActionsRequest(
			document.uri,
			Range.create(12, 1, 12, 1),
			{
				diagnostics: [],
				only: ['source.organizeImports'],
				triggerKind: 1,
			},
		);
		const organizeEdits = await Promise.all(
			(organizeActions as CodeAction[]).map((action) =>
				languageServer.handle.sendCodeActionResolveRequest(action),
			),
		);
		const returnedText = getTextEdits(organizeEdits).map((edit) => edit.newText);

		assert.ok(returnedText.some((text) => text.includes('helperOne, helperTwo')));
	});
});
