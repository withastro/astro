import { Position } from '@volar/language-server';
import { expect } from 'chai';
import { describe } from 'mocha';
import type { LanguageServer } from '../server.js';
import { getLanguageServer } from '../server.js';

describe('CSS - Hover', () => {
	let languageServer: LanguageServer;

	before(async () => {
		languageServer = await getLanguageServer();
	});

	it('Can get hover in style tags', async () => {
		const document = await languageServer.openFakeDocument(
			'<style>\nh1 {\ncolor: red;\n}\n</style>',
			'astro',
		);
		const hover = await languageServer.handle.sendHoverRequest(document.uri, Position.create(2, 7));

		expect(hover?.contents).to.not.be.empty;
	});
});
