import { Position } from '@volar/language-server';
import { expect } from 'chai';
import { describe } from 'mocha';
import { LanguageServer, getLanguageServer } from '../server.js';

describe('CSS - Completions', () => {
	let languageServer: LanguageServer;

	before(async () => {
		languageServer = await getLanguageServer();
	});

	it('Can provide completions for CSS properties', async () => {
		const document = await languageServer.helpers.openFakeDocument(`<style>.foo { colo }</style>`);
		const completions = await languageServer.helpers.requestCompletion(
			document,
			Position.create(0, 18)
		);

		expect(completions.items).to.not.be.empty;
		expect(completions.items[0].data.serviceId).to.equal('css');
	});

	it('Can provide completions for CSS values', async () => {
		const document = await languageServer.helpers.openFakeDocument(
			`<style>.foo { color: re }</style>`
		);
		const completions = await languageServer.helpers.requestCompletion(
			document,
			Position.create(0, 21)
		);

		expect(completions.items).to.not.be.empty;
		expect(completions.items[0].data.serviceId).to.equal('css');
	});
});
