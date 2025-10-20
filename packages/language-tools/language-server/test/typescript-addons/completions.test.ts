import { Position } from '@volar/language-server';
import { expect } from 'chai';
import { before, describe, it } from 'mocha';
import { type LanguageServer, getLanguageServer } from '../server.js';

describe('TypeScript Addons - Completions', async () => {
	let languageServer: LanguageServer;

	before(async () => (languageServer = await getLanguageServer()));

	it('Can provide neat snippets', async () => {
		const document = await languageServer.openFakeDocument('---\nprerender\n---', 'astro');
		const completions = await languageServer.handle.sendCompletionRequest(
			document.uri,
			Position.create(1, 10),
		);

		const prerenderCompletions = completions?.items.filter((item) => item.label === 'prerender');
		expect(prerenderCompletions).to.not.be.empty;
	});
});
