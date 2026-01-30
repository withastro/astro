import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { after, before, describe, it } from 'node:test';
import { Position } from '@volar/language-server';
import { URI } from 'vscode-uri';
import { getLanguageServer, type LanguageServer } from '../server.ts';
import { fixtureDir } from '../utils.ts';

const contentSchemaPath = path.resolve(fixtureDir, '.astro', 'collections', 'caching.schema.json');

describe('Content Intellisense - Caching', async () => {
	let languageServer: LanguageServer;

	before(async () => (languageServer = await getLanguageServer()));

	it('Properly updates the schema when they are updated', async () => {
		const document = await languageServer.handle.openTextDocument(
			path.join(fixtureDir, 'src', 'content', 'caching', 'caching.md'),
			'markdown',
		);

		const hover = await languageServer.handle.sendHoverRequest(document.uri, Position.create(1, 1));

		assert.deepStrictEqual(hover?.contents, {
			kind: 'markdown',
			value: 'I will be changed',
		});

		fs.writeFileSync(
			contentSchemaPath,
			fs.readFileSync(contentSchemaPath, 'utf-8').replaceAll('I will be changed', 'I am changed'),
		);

		await languageServer.handle.didChangeWatchedFiles([
			{
				uri: URI.file(contentSchemaPath).toString(),
				type: 2,
			},
		]);

		const hover2 = await languageServer.handle.sendHoverRequest(
			document.uri,
			Position.create(1, 1),
		);

		assert.deepStrictEqual(hover2?.contents, {
			kind: 'markdown',
			value: 'I am changed',
		});
	});

	after(async () => {
		fs.writeFileSync(
			contentSchemaPath,
			fs.readFileSync(contentSchemaPath, 'utf-8').replaceAll('I am changed', 'I will be changed'),
		);
	});
});
