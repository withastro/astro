import assert from 'node:assert';
import * as path from 'node:path';
import { before, describe, it } from 'node:test';
import type { FullDocumentDiagnosticReport } from '@volar/language-server';
import { type Diagnostic, DiagnosticSeverity, Range } from '@volar/language-server';
import { getLanguageServer, type LanguageServer } from '../server.ts';
import { fixtureDir } from '../utils.ts';

describe('TypeScript - Diagnostics', async () => {
	let languageServer: LanguageServer;

	before(async () => (languageServer = await getLanguageServer()));

	it('Can get diagnostics in the frontmatter', async () => {
		const document = await languageServer.openFakeDocument('---\nNotAThing\n---', 'astro');
		const diagnostics = (await languageServer.handle.sendDocumentDiagnosticRequest(
			document.uri,
		)) as FullDocumentDiagnosticReport;

		// We should only have one error here.
		assert.strictEqual(diagnostics.items.length, 1);

		// Data here is Volar specific, and is not too relevant to test. We'll throw it out.
		const diagnostic: Diagnostic = { ...diagnostics.items[0], data: {} };

		assert.deepStrictEqual(diagnostic, {
			code: 2304,
			data: {},
			message: "Cannot find name 'NotAThing'.",
			range: Range.create(1, 0, 1, 9),
			severity: DiagnosticSeverity.Error,
			source: 'ts',
		});
	});

	it('Can get diagnostics in the template', async () => {
		const document = await languageServer.openFakeDocument('---\n\n---\n{nope}', 'astro');
		const diagnostics = (await languageServer.handle.sendDocumentDiagnosticRequest(
			document.uri,
		)) as FullDocumentDiagnosticReport;
		assert.strictEqual(diagnostics.items.length, 1);

		const diagnostic: Diagnostic = { ...diagnostics.items[0], data: {} };
		assert.deepStrictEqual(diagnostic, {
			code: 2304,
			data: {},
			message: "Cannot find name 'nope'.",
			range: Range.create(3, 1, 3, 5),
			severity: DiagnosticSeverity.Error,
			source: 'ts',
		});
	});

	it('shows enhanced diagnostics', async () => {
		const document = await languageServer.handle.openTextDocument(
			path.join(fixtureDir, 'enhancedDiagnostics.astro'),
			'astro',
		);
		const diagnostics = (await languageServer.handle.sendDocumentDiagnosticRequest(
			document.uri,
		)) as FullDocumentDiagnosticReport;
		assert.strictEqual(diagnostics.items.length, 1);

		diagnostics.items = diagnostics.items.map((diag) => ({ ...diag, data: {} }));
		assert.deepStrictEqual(diagnostics.items, [
			{
				code: 2322,
				data: {},
				message:
					"Type '{ \"client:idle\": true; }' is not assignable to type 'HTMLAttributes'.\n  Property 'client:idle' does not exist on type 'HTMLAttributes'.\n\nClient directives are only available on framework components.",
				range: Range.create(0, 5, 0, 16),
				severity: DiagnosticSeverity.Error,
				source: 'ts',
			},
		]);
	});

	it('can get diagnostics in script tags', async () => {
		const document = await languageServer.openFakeDocument(
			`<script>const something: string = "Hello";something;</script><div><script>console.log(doesnotexist);</script></div>`,
			'astro',
		);
		const diagnostics = (await languageServer.handle.sendDocumentDiagnosticRequest(
			document.uri,
		)) as FullDocumentDiagnosticReport;
		assert.strictEqual(diagnostics.items.length, 1);
	});
});
