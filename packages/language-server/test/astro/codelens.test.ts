import * as _ from '@volar/language-server/node';
import { expect } from 'chai';
import { describe } from 'mocha';
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

		expect(codeLens).to.have.lengthOf(1);
	});
});
