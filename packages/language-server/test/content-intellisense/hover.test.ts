import path from 'node:path';
import { Position } from '@volar/language-server';
import assert from 'node:assert';
import { before, describe, it } from 'node:test';
import { type LanguageServer, getLanguageServer } from '../server.js';
import { fixtureDir } from '../utils.js';

describe('Content Intellisense - Hover', async () => {
	let languageServer: LanguageServer;

	before(async () => (languageServer = await getLanguageServer()));

	it('Provide hover information for collection properties', async () => {
		const document = await languageServer.handle.openTextDocument(
			path.join(fixtureDir, 'src', 'content', 'blog', 'hover.md'),
			'markdown',
		);

		const hover = await languageServer.handle.sendHoverRequest(document.uri, Position.create(1, 1));

		assert.deepStrictEqual(hover?.contents, {
			kind: 'markdown',
			value: "The blog post's title.",
		});
	});
});
