import { Position } from '@volar/language-server';
import { expect } from 'chai';
import { describe } from 'mocha';
import { type LanguageServer, getLanguageServer } from '../server.js';

describe('HTML - Hover', () => {
	let languageServer: LanguageServer;

	before(async () => (languageServer = await getLanguageServer()));

	it('Can provide hover for HTML tags', async () => {
		const document = await languageServer.openFakeDocument(`<q`, 'astro');
		const hover = await languageServer.handle.sendHoverRequest(document.uri, Position.create(0, 2));

		expect(hover).to.not.be.null;
	});

	it('Can provide hover for HTML attributes', async () => {
		const document = await languageServer.openFakeDocument(`<blockquote c`, 'astro');
		const hover = await languageServer.handle.sendHoverRequest(
			document.uri,
			Position.create(0, 13),
		);

		expect(hover).to.not.be.null;
	});
});
