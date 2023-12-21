import { Position } from '@volar/language-server';
import { expect } from 'chai';
import { before, describe, it } from 'mocha';
import { LanguageServer, getLanguageServer } from '../server.js';

describe('TypeScript - Completions', async () => {
	let languageServer: LanguageServer;

	before(async () => (languageServer = await getLanguageServer()));

	it('Can get completions in the frontmatter', async () => {
		const document = await languageServer.helpers.openFakeDocument('---\nc\n---');
		const completions = await languageServer.helpers.requestCompletion(
			document,
			Position.create(1, 1)
		);

		expect(completions.items).to.not.be.empty;
	});

	it('Can get completions in the template', async () => {
		const document = await languageServer.helpers.openFakeDocument('{c}');
		const completions = await languageServer.helpers.requestCompletion(
			document,
			Position.create(0, 1)
		);

		expect(completions.items).to.not.be.empty;
	});

	it('sort completions starting with `astro:` higher than other imports', async () => {
		const document = await languageServer.helpers.openFakeDocument('<Image');
		const completions = await languageServer.helpers.requestCompletion(
			document,
			Position.create(0, 6)
		);

		const imageCompletion = completions.items.find(
			(item) => item.labelDetails?.description === 'astro:assets'
		);

		expect(imageCompletion?.sortText).to.equal('\x00￿16');
	});
});
