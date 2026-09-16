import assert from 'node:assert';
import { before, describe, it } from 'node:test';
import { Position } from '@volar/language-server';
import { getLanguageServer, type LanguageServer } from '../server.ts';

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
		assert.ok(completions!.items && completions!.items.length > 0);
		assert.ok(allLabels.includes('blockquote'));
	});

	it('Can provide completions for HTML attributes', async () => {
		const document = await languageServer.openFakeDocument(`<blockquote c`, 'astro');
		const completions = await languageServer.handle.sendCompletionRequest(
			document.uri,
			Position.create(0, 13),
		);

		assert.ok(completions!.items && completions!.items.length > 0);
		assert.strictEqual(completions!.items[0].label, 'cite');
	});
});
