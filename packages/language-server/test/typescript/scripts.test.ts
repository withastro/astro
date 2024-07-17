import { FullDocumentDiagnosticReport } from '@volar/language-server';
import { expect } from 'chai';
import { type LanguageServer, getLanguageServer } from '../server.js';

describe('TypeScript - Diagnostics', async () => {
	let languageServer: LanguageServer;

	before(async () => (languageServer = await getLanguageServer()));

	it('treats script tags as modules', async () => {
		const document = await languageServer.openFakeDocument(
			'<script>import * as path from "node:path";path;const hello = "Hello, Astro!";</script><script>console.log(hello);</script>',
			'astro'
		);
		const diagnostics = (await languageServer.handle.sendDocumentDiagnosticRequest(
			document.uri
		)) as FullDocumentDiagnosticReport;

		expect(diagnostics.items).length(2);
	});

	it('treats inline script tags as not isolated modules', async () => {
		const document = await languageServer.openFakeDocument(
			'<script is:inline>const hello = "Hello, Astro!";</script><script is:inline>console.log(hello);</script>',
			'astro'
		);

		const diagnostics = (await languageServer.handle.sendDocumentDiagnosticRequest(
			document.uri
		)) as FullDocumentDiagnosticReport;

		expect(diagnostics.items).length(0);
	});
});
