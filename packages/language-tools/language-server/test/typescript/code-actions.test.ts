import assert from 'node:assert';
import { before, describe, it } from 'node:test';
import { type CodeAction, type FullDocumentDiagnosticReport, Range } from '@volar/language-server';
import { getLanguageServer, type LanguageServer } from '../server.ts';

describe('TypeScript - Code Actions', () => {
	let languageServer: LanguageServer;

	before(async () => (languageServer = await getLanguageServer()));

	it('offers to import an Astro component that is used but not imported', async () => {
		const document = await languageServer.openFakeDocument('---\n---\n\n<BlogPost />\n', 'astro');
		const diagnostics = (await languageServer.handle.sendDocumentDiagnosticRequest(
			document.uri,
		)) as FullDocumentDiagnosticReport;
		const codeActions = await languageServer.handle.sendCodeActionsRequest(
			document.uri,
			Range.create(3, 1, 3, 9),
			{
				diagnostics: diagnostics.items,
				only: ['quickfix'],
				triggerKind: 1,
			},
		);

		const importAction = (codeActions as CodeAction[])?.find((codeAction) =>
			codeAction.title.startsWith('Add import from'),
		);
		assert.ok(importAction);
		const resolvedImportAction =
			await languageServer.handle.sendCodeActionResolveRequest(importAction);

		const edit = (
			resolvedImportAction.edit?.documentChanges?.[0] as { edits: { newText: string }[] }
		).edits[0];
		assert.strictEqual(
			edit.newText.includes('import BlogPost from "./src/components/BlogPost.astro";'),
			true,
		);
	});
});
