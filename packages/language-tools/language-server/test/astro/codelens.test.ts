import assert from 'node:assert';
import { before, describe, it } from 'node:test';
import * as _ from '@volar/language-server/node';
import type { LanguageServer } from '../server.js';
import { getLanguageServer } from '../server.js';

describe('Astro - Code Lens', () => {
	let languageServer: LanguageServer;

	before(async () => (languageServer = await getLanguageServer()));

	it('Can provide a codelens for Astro.glob', async () => {
		const document = await languageServer.openFakeDocument('---\nAstro.glob(".");\n---\n', 'astro');

		const codeLens = await languageServer.handle.connection.sendRequest(_.CodeLensRequest.type, {
			textDocument: { uri: document.uri },
		});

		assert.ok(codeLens);
		assert.strictEqual(codeLens.length, 1);
	});
});
