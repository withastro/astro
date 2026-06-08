import assert from 'node:assert';
import path from 'node:path';
import { before, describe, it } from 'node:test';
import type {
	CodeAction,
	Command,
	Diagnostic,
	FullDocumentDiagnosticReport,
} from '@volar/language-server';
import { getLanguageServer, type LanguageServer } from '../server.ts';
import { fixtureDir } from '../test-utils.ts';

describe('TypeScript - Code Actions', async () => {
	let languageServer: LanguageServer;

	before(async () => (languageServer = await getLanguageServer()));

	it('adds imports for local Astro components without AstroComponent suffixes', async () => {
		const { action } = await getAstroComponentImportAction(
			'src/pages/componentCodeAction.astro',
			'Simple',
			'../components/Simple.astro',
		);

		assertCodeActionImport(action, `import Simple from "../components/Simple.astro";`);
	});

	it('adds imports for nested Astro components', async () => {
		const { action } = await getAstroComponentImportAction(
			'src/pages/componentCodeAction.astro',
			'Nested',
			'../components/nested/Nested.astro',
		);

		assertCodeActionImport(action, `import Nested from "../components/nested/Nested.astro";`);
	});

	it('adds imports for Astro components through tsconfig path aliases', async () => {
		const { action } = await getAstroComponentImportAction(
			'alias/src/pages/componentCodeAction.astro',
			'Alias',
			'@components/Alias.astro',
		);

		assertCodeActionImport(action, `import Alias from "@components/Alias.astro";`);
	});

	it('adds imports for Astro components with generated 404 names', async () => {
		const { action } = await getAstroComponentImportAction(
			'src/pages/componentCodeAction.astro',
			'FourOhFour',
			'../components/404.astro',
		);

		assertCodeActionImport(action, `import FourOhFour from "../components/404.astro";`);
	});

	async function getAstroComponentImportAction(
		filePath: string,
		missingName: string,
		source: string,
	) {
		const document = await languageServer.handle.openTextDocument(
			path.join(fixtureDir, filePath),
			'astro',
		);
		const diagnostics = (await languageServer.handle.sendDocumentDiagnosticRequest(
			document.uri,
		)) as FullDocumentDiagnosticReport;
		const diagnostic = diagnostics.items.find(
			(item) =>
				item.source === 'ts' &&
				/[A-Za-z_$][\w$]*/.exec(document.getText(item.range))?.[0] === missingName,
		);
		assert.ok(diagnostic, `Expected diagnostic for ${missingName}`);

		const codeActions = await languageServer.handle.sendCodeActionsRequest(
			document.uri,
			diagnostic.range,
			{
				diagnostics: [diagnostic],
				only: ['quickfix'],
				triggerKind: 1,
			},
		);
		const action = codeActions?.find((item) => item.title === `Add import from "${source}"`);
		assertCodeAction(
			action,
			`Expected Add import action from ${source}; got ${codeActions?.map((item) => item.title).join(', ')}`,
		);

		assertAttachedDiagnostic(action, diagnostic);
		assertEditsDocument(action, document.uri);
		return { action, diagnostic };
	}
});

function assertCodeActionImport(action: CodeAction, importText: string) {
	const edits = action.edit?.changes
		? Object.values(action.edit.changes).flat()
		: action.edit?.documentChanges?.flatMap((change) => ('edits' in change ? change.edits : []));

	assert.ok(edits?.some((edit) => edit.newText.includes(importText)));
	assert.ok(!edits?.some((edit) => edit.newText.includes('AstroComponent')));
}

function assertAttachedDiagnostic(action: CodeAction, diagnostic: Diagnostic) {
	assert.deepStrictEqual(
		action.diagnostics?.map((attachedDiagnostic) => ({
			code: attachedDiagnostic.code,
			message: attachedDiagnostic.message,
			range: attachedDiagnostic.range,
		})),
		[
			{
				code: diagnostic.code,
				message: diagnostic.message,
				range: diagnostic.range,
			},
		],
	);
}

function assertEditsDocument(action: CodeAction, documentUri: string) {
	assert.ok(action.edit?.changes?.[documentUri]?.length);
}

function assertCodeAction(
	action: CodeAction | Command | undefined,
	message: string,
): asserts action is CodeAction {
	assert.ok(action, message);
	assert.notStrictEqual(typeof action.command, 'string');
}
