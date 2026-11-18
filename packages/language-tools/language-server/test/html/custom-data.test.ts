import assert from 'node:assert';
import { before, describe, it } from 'node:test';
import { Position } from '@volar/language-server';
import { getLanguageServer, type LanguageServer } from '../server.ts';

describe('HTML - Custom Data', () => {
	let languageServer: LanguageServer;

	before(async () => (languageServer = await getLanguageServer()));

	it('Can properly get completions for attributes added by our custom data', async () => {
		const document = await languageServer.openFakeDocument(`<div class></div>`, 'astro');
		const completions = await languageServer.handle.sendCompletionRequest(
			document.uri,
			Position.create(0, 10),
		);

		const labels = completions!.items.map((i) => i.label);
		assert.ok(completions!.items && completions!.items.length > 0);
		assert.ok(labels.includes('class:list'));
	});
});
