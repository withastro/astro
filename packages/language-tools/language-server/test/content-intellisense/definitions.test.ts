import assert from 'node:assert';
import path from 'node:path';
import { before, describe, it } from 'node:test';
import type { LocationLink } from '@volar/language-server';
import { Position } from '@volar/language-server';
import { getLanguageServer, type LanguageServer } from '../server.ts';
import { fixtureDir } from '../utils.ts';

describe('Content Intellisense - Go To Everywhere', async () => {
	let languageServer: LanguageServer;

	before(async () => (languageServer = await getLanguageServer()));

	it('Provide definitions for keys', async () => {
		const document = await languageServer.handle.openTextDocument(
			path.join(fixtureDir, 'src', 'content', 'blog', 'definitions.md'),
			'markdown',
		);

		const definitions = (await languageServer.handle.sendDefinitionRequest(
			document.uri,
			Position.create(1, 2),
		)) as LocationLink[];

		const targetUris = definitions?.map((definition) => definition.targetUri);
		assert.strictEqual(
			targetUris.every((uri) => uri.endsWith('config.ts')),
			true,
		);

		const { targetRange, targetSelectionRange, originSelectionRange } = definitions[0];

		assert.deepStrictEqual(targetRange, {
			start: { line: 5, character: 2 },
			end: { line: 5, character: 65 },
		});

		assert.deepStrictEqual(targetSelectionRange, {
			start: { line: 5, character: 2 },
			end: { line: 5, character: 7 },
		});

		assert.deepStrictEqual(originSelectionRange, {
			start: { line: 1, character: 0 },
			end: { line: 1, character: 5 },
		});
	});
});
