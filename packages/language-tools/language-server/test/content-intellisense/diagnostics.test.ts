import assert from 'node:assert';
import path from 'node:path';
import { before, describe, it } from 'node:test';
import type { FullDocumentDiagnosticReport } from '@volar/language-server';
import { DiagnosticSeverity, Position } from '@volar/language-server';
import { getLanguageServer, type LanguageServer } from '../server.ts';
import { fixtureDir } from '../utils.ts';

// TODO: We can't sync the fixture with these mistakes at all, as such we can't run these tests.
describe.skip('Content Intellisense - Diagnostics', async () => {
	let languageServer: LanguageServer;

	before(async () => (languageServer = await getLanguageServer()));

	it('Report errors for missing entries in frontmatter', async () => {
		const document = await languageServer.handle.openTextDocument(
			path.join(fixtureDir, 'src', 'content', 'blog', 'missing_property.md'),
			'markdown',
		);
		const diagnostics = (await languageServer.handle.sendDocumentDiagnosticRequest(
			document.uri,
		)) as FullDocumentDiagnosticReport;

		assert.strictEqual(diagnostics.items.length, 1);

		const firstDiagnostic = diagnostics.items[0];

		// The data is not super relevant to the test, so we'll throw it out.
		delete firstDiagnostic.data;

		assert.deepStrictEqual(firstDiagnostic, {
			code: 0,
			message: 'Missing property "description".',
			range: {
				start: Position.create(0, 0),
				end: Position.create(2, 3),
			},
			severity: DiagnosticSeverity.Error,
			source: 'astro',
		});
	});

	it('Report errors for invalid types in frontmatter', async () => {
		const document = await languageServer.handle.openTextDocument(
			path.join(fixtureDir, 'src', 'content', 'blog', 'type_error.md'),
			'markdown',
		);
		const diagnostics = (await languageServer.handle.sendDocumentDiagnosticRequest(
			document.uri,
		)) as FullDocumentDiagnosticReport;

		assert.strictEqual(diagnostics.items.length, 1);

		const firstDiagnostic = diagnostics.items[0];

		delete firstDiagnostic.data;

		assert.deepStrictEqual(firstDiagnostic, {
			code: 0,
			message: 'Incorrect type. Expected "string".',
			range: {
				start: Position.create(1, 7),
				end: Position.create(1, 8),
			},
			severity: DiagnosticSeverity.Error,
			source: 'astro',
		});
	});

	it('Report error for missing frontmatter', async () => {
		const document = await languageServer.handle.openTextDocument(
			path.join(fixtureDir, 'src', 'content', 'blog', 'no_frontmatter.md'),
			'markdown',
		);
		const diagnostics = (await languageServer.handle.sendDocumentDiagnosticRequest(
			document.uri,
		)) as FullDocumentDiagnosticReport;

		assert.strictEqual(diagnostics.items.length, 1);

		const firstDiagnostic = diagnostics.items[0];

		delete firstDiagnostic.data;

		assert.deepStrictEqual(firstDiagnostic, {
			message: 'Frontmatter is required for this file.',
			range: {
				start: Position.create(0, 0),
				end: Position.create(0, 0),
			},
			severity: DiagnosticSeverity.Error,
		});
	});
});
