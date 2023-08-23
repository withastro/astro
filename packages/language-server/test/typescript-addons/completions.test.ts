import { Position } from '@volar/language-server';
import { expect } from 'chai';
import { before, describe, it } from 'mocha';
import { LanguageServer, getLanguageServer } from '../server.js';

describe('TypeScript Addons - Completions', async () => {
	let languageServer: LanguageServer;

	before(async () => (languageServer = await getLanguageServer()));
	it('Can provide neat snippets', async () => {
		const document = await languageServer.helpers.openFakeDocument('---\nprerender\n---');
		const completions = await languageServer.helpers.requestCompletion(
			document,
			Position.create(1, 10)
		);

		const prerenderCompletions = completions.items.filter((item) => item.label === 'prerender');
		expect(prerenderCompletions).to.not.be.empty;
		expect(prerenderCompletions[0].data.serviceId).to.equal('typescriptaddons');
	});
});
