import { Position } from '@volar/language-server';
import { expect } from 'chai';
import { describe } from 'mocha';
import { getLanguageServer, type LanguageServer } from '../server.js';

describe('HTML - Completions', () => {
	let languageServer: LanguageServer;

	before(async () => (languageServer = await getLanguageServer()));

	it('Can provide completions for HTML tags zzz', async () => {
		const document = await languageServer.openFakeDocument(`<q`, 'astro');
		const completions = await languageServer.handle.sendCompletionRequest(
			document.uri,
			Position.create(0, 2)
		);

		expect(completions!.items).to.not.be.empty;
		expect(completions!.items[0].label).to.equal('blockquote');
	});

	it('Can provide completions for HTML attributes', async () => {
		const document = await languageServer.openFakeDocument(`<blockquote c`, 'astro');
		const completions = await languageServer.handle.sendCompletionRequest(
			document.uri,
			Position.create(0, 13)
		);

		expect(completions!.items).to.not.be.empty;
		expect(completions!.items[0].label).to.equal('cite');
	});
});
