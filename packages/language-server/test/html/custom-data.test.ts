import { Position } from '@volar/language-server';
import { expect } from 'chai';
import { describe } from 'mocha';
import { type LanguageServer, getLanguageServer } from '../server.js';

describe('HTML - Custom Data', () => {
	let languageServer: LanguageServer;

	before(async () => (languageServer = await getLanguageServer()));

	it('Can properly get completions for attributes added by our custom data', async () => {
		const document = await languageServer.openFakeDocument(`<div class></div>`, 'astro');
		const completions = await languageServer.handle.sendCompletionRequest(
			document.uri,
			Position.create(0, 10),
		);

		const labels = completions!.items.map((i) => i.label);
		expect(completions!.items).to.not.be.empty;
		expect(labels).to.include('class:list');
	});
});
