import { Range } from '@volar/language-server';
import { expect } from 'chai';
import { describe } from 'mocha';
import { type LanguageServer, getLanguageServer } from '../server.js';

describe('TypeScript - Organize & Sort Imports', () => {
	let languageServer: LanguageServer;

	before(async () => (languageServer = await getLanguageServer()));

	it('Can organize imports', async () => {
		const document = await languageServer.openFakeDocument(
			`---\n\nimport os from "node:os";\n\nimport fs from "node:fs";\n\n---\n\n`,
			'astro'
		);
		const organizeEdits = await languageServer.handle.sendCodeActionsRequest(
			document.uri,
			Range.create(6, 0, 6, 0),
			{
				diagnostics: [],
				only: ['source.organizeImports'],
				triggerKind: 1,
			}
		);

		expect(organizeEdits).to.deep.equal([
			{
				data: {
					original: {
						edit: {
							documentChanges: [
								{
									edits: [
										{
											newText: '',
											range: Range.create(4, 0, 5, 0)
										},
										{
											newText: '',
											range: Range.create(6, 0, 7, 0),
										},
									],
									textDocument: {
										uri: document.uri + "?virtualCodeId=tsx",
										version: null,
									},
								},
							],
						},
					},
					serviceIndex: 3,
					uri: document.uri,
					version: (organizeEdits?.[0] as any).data.version,
				},
				diagnostics: [],
				edit: {
					documentChanges: [
						{
							edits: [
								{
									newText: '',
									range: Range.create(2, 0, 3, 0),
								},
								{
									newText: '',
									range: Range.create(4, 0, 5, 0),
								},
							],
							textDocument: {
								uri: document.uri,
								version: null,
							},
						},
					],
				},
				kind: 'source.organizeImports',
				title: 'Organize Imports',
			},
		]);
	});
});
