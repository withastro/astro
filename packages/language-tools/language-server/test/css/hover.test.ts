import assert from 'node:assert';
import { before, describe, it } from 'node:test';
import { Position } from '@volar/language-server';
import type { LanguageServer } from '../server.ts';
import { getLanguageServer } from '../server.ts';

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

		assert.ok(hover?.contents);
		assert.ok(Array.isArray(hover.contents) ? hover.contents.length > 0 : true);
	});
});
