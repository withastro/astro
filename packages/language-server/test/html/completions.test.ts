import { expect } from 'chai';
import { describe } from 'mocha';
import { Position } from 'vscode-languageserver-protocol';
import { LanguageServer, getLanguageServer } from '../server.js';

describe('HTML - Completions', () => {
	let languageServer: LanguageServer;

	before(async () => {
		languageServer = await getLanguageServer();
	});

	it('Can provide completions for HTML tags', async () => {
		const document = await languageServer.helpers.openFakeDocument(`<q`);
		const completions = await languageServer.helpers.requestCompletion(
			document,
			Position.create(0, 2)
		);

		expect(completions.items).to.not.be.empty;
		expect(completions.items[0].label).to.equal('blockquote');
		expect(completions.items[0].data.serviceId).to.equal('html');
	});

	it('Can provide completions for HTML attributes', async () => {
		const document = await languageServer.helpers.openFakeDocument(`<blockquote c`);
		const completions = await languageServer.helpers.requestCompletion(
			document,
			Position.create(0, 13)
		);

		expect(completions.items).to.not.be.empty;
		expect(completions.items[0].label).to.equal('cite');
		expect(completions.items[0].data.serviceId).to.equal('html');
	});
});
