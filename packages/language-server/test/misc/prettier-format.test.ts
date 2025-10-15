import * as path from 'node:path';
import { Range } from '@volar/language-server';
import { expect } from 'chai';
import { describe } from 'mocha';
import { type LanguageServer, getLanguageServer } from '../server.js';
import { fixtureDir } from '../utils.js';

describe('Formatting - Prettier', () => {
	let languageServer: LanguageServer;

	before(async () => (languageServer = await getLanguageServer()));

	it('Can format document', async () => {
		const document = await languageServer.openFakeDocument(`---\n\n\n---`, 'astro');
		const formatEdits = await languageServer.handle.sendDocumentFormattingRequest(document.uri, {
			tabSize: 2,
			insertSpaces: true,
		});

		expect(formatEdits).to.deep.equal([
			{
				range: Range.create(0, 0, 3, 3),
				newText: '---\n\n---\n',
			},
		]);
	});

	it('Can ignore documents correctly', async () => {
		const document = await languageServer.handle.openTextDocument(
			path.join(fixtureDir, 'dontFormat.astro'),
			'astro',
		);
		const formatEdits = await languageServer.handle.sendDocumentFormattingRequest(document.uri, {
			tabSize: 2,
			insertSpaces: true,
		});

		expect(formatEdits).to.deep.equal(null);
	});

	it('Respect .editorconfig', async () => {
		const document = await languageServer.handle.openTextDocument(
			path.join(fixtureDir, 'editorConfig.astro'),
			'astro',
		);
		const formatEdits = await languageServer.handle.sendDocumentFormattingRequest(document.uri, {
			tabSize: 2,
			insertSpaces: true,
		});

		expect(formatEdits).to.deep.equal([
			{
				range: Range.create(0, 0, 3, 0),
				newText: '<div>\r\n\t<div></div>\r\n</div>\r\n',
			},
		]);
	});
});
