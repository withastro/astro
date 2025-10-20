import path from 'node:path';
import type { LocationLink } from '@volar/language-server';
import { Position } from '@volar/language-server';
import { expect } from 'chai';
import { before, describe, it } from 'mocha';
import { type LanguageServer, getLanguageServer } from '../server.js';
import { fixtureDir } from '../utils.js';

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
		expect(targetUris.every((uri) => uri.endsWith('config.ts'))).to.be.true;

		const { targetRange, targetSelectionRange, originSelectionRange } = definitions[0];

		expect(targetRange).to.deep.equal({
			start: { line: 5, character: 2 },
			end: { line: 5, character: 54 },
		});

		expect(targetSelectionRange).to.deep.equal({
			start: { line: 5, character: 2 },
			end: { line: 5, character: 7 },
		});

		expect(originSelectionRange).to.deep.equal({
			start: { line: 1, character: 0 },
			end: { line: 1, character: 5 },
		});
	});
});
