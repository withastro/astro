import { Position } from '@volar/language-server';
import { expect } from 'chai';
import { describe } from 'mocha';
import { type LanguageServer, getLanguageServer } from '../server.js';

describe('HTML - Completions', () => {
	let languageServer: LanguageServer;

	before(async () => (languageServer = await getLanguageServer()));

	it('Can provide completions for HTML tags', async () => {
		const document = await languageServer.openFakeDocument(`<block`, 'astro');
		const completions = await languageServer.handle.sendCompletionRequest(
			document.uri,
			Position.create(0, 6),
		);

		const allLabels = completions!.items.map((i) => i.label);
		expect(completions!.items).to.not.be.empty;
		expect(allLabels).to.include('blockquote');
	});

	it('Can provide completions for HTML attributes', async () => {
		const document = await languageServer.openFakeDocument(`<blockquote c`, 'astro');
		const completions = await languageServer.handle.sendCompletionRequest(
			document.uri,
			Position.create(0, 13),
		);

		expect(completions!.items).to.not.be.empty;
		expect(completions!.items[0].label).to.equal('cite');
	});
});
