import assert from 'node:assert';
import path from 'node:path';
import { before, describe, it } from 'node:test';
import { Position } from '@volar/language-server';
import { getLanguageServer, type LanguageServer } from '../server.ts';
import { fixtureDir } from '../utils.ts';

describe('Content Intellisense - Completions', async () => {
	let languageServer: LanguageServer;

	before(async () => (languageServer = await getLanguageServer()));

	it('Provide completions for collection properties', async () => {
		const document = await languageServer.handle.openTextDocument(
			path.join(fixtureDir, 'src', 'content', 'blog', 'completions.md'),
			'markdown',
		);

		const completions = await languageServer.handle.sendCompletionRequest(
			document.uri,
			Position.create(1, 1),
		);

		// We don't do any mapping ourselves here, so we'll just check if the labels are correct.
		const labels = (completions?.items ?? []).map((item) => item.label);
		['title', 'description', 'tags', 'type'].forEach((m) => assert.ok(labels.includes(m)));
	});

	it('Provide completions for collection property values', async () => {
		const document = await languageServer.handle.openTextDocument(
			path.join(fixtureDir, 'src', 'content', 'blog', 'completions-values.md'),
			'markdown',
		);

		const completions = await languageServer.handle.sendCompletionRequest(
			document.uri,
			Position.create(1, 7),
		);

		const labels = (completions?.items ?? []).map((item) => item.label);
		['blog'].forEach((m) => assert.ok(labels.includes(m)));
	});
});
