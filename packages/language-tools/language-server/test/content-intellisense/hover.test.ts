import assert from 'node:assert';
import path from 'node:path';
import { before, describe, it } from 'node:test';
import { Position } from '@volar/language-server';
// @ts-ignore
import { cli } from '../../../../astro/test/test-utils.js';
import { getLanguageServer, type LanguageServer } from '../server.ts';
import { fixtureDir } from '../utils.ts';

describe(
	'Content Intellisense - Hover',
	{ skip: parseInt(process.versions.node) === 20 },
	async () => {
		let languageServer: LanguageServer;

		before(async () => {
			await cli('sync', '--root', fixtureDir).getResult();
			languageServer = await getLanguageServer();
		});

		it('Provide hover information for collection properties', async () => {
			const document = await languageServer.handle.openTextDocument(
				path.join(fixtureDir, 'src', 'content', 'blog', 'hover.md'),
				'markdown',
			);

			const hover = await languageServer.handle.sendHoverRequest(
				document.uri,
				Position.create(1, 1),
			);

			assert.deepStrictEqual(hover?.contents, {
				kind: 'markdown',
				value: "The blog post's title.",
			});
		});
	},
);
