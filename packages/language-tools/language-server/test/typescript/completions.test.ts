import path from 'node:path';
import { Position } from '@volar/language-server';
import { expect } from 'chai';
import { before, describe, it } from 'mocha';
import { type LanguageServer, getLanguageServer } from '../server.js';
import { fixtureDir } from '../utils.js';

describe('TypeScript - Completions', async () => {
	let languageServer: LanguageServer;

	before(async () => (languageServer = await getLanguageServer()));

	it('Can get completions in the frontmatter', async () => {
		const document = await languageServer.openFakeDocument('---\nc\n---', 'astro');
		const completions = await languageServer.handle.sendCompletionRequest(
			document.uri,
			Position.create(1, 1),
		);

		expect(completions?.items).to.not.be.empty;
	});

	it('Can get completions in the template', async () => {
		const document = await languageServer.openFakeDocument('{c}', 'astro');
		const completions = await languageServer.handle.sendCompletionRequest(
			document.uri,
			Position.create(0, 1),
		);

		expect(completions?.items).to.not.be.empty;
	});

	it('sort completions starting with `astro:` higher than other imports', async () => {
		const document = await languageServer.openFakeDocument('<Image', 'astro');
		const completions = await languageServer.handle.sendCompletionRequest(
			document.uri,
			Position.create(0, 6),
		);

		const imageCompletion = completions?.items.find(
			(item) => item.labelDetails?.description === 'astro:assets',
		);

		expect(imageCompletion?.sortText).to.equal('\x00￿16');
	});

	it('Can get completions in all kinds of script tags', async () => {
		const documents = [
			'<script>\nconsole.\n</script>',
			'<script type="module">\nconsole.\n</script>',
			'<script is:inline>\nconsole.\n</script>',
		];

		for (const doc of documents) {
			const document = await languageServer.openFakeDocument(doc, 'astro');
			const completions = await languageServer.handle.sendCompletionRequest(
				document.uri,
				Position.create(1, 8),
			);

			const allLabels = completions?.items.map((item) => item.label);
			expect(completions?.items).to.not.be.empty;
			expect(allLabels).to.include('log');
		}
	});

	it('properly maps edits for completions in script tags', async () => {
		const document = await languageServer.handle.openTextDocument(
			path.join(fixtureDir, 'scriptImport.astro'),
			'astro',
		);
		const completions = await languageServer.handle.sendCompletionRequest(
			document.uri,
			Position.create(1, 0),
		);

		const imageConfigCompletion = completions?.items.find(
			(item) => item.label === 'Image' && item.labelDetails?.description === 'astro:assets',
		);
		expect(imageConfigCompletion).to.not.be.undefined;

		const edits = await languageServer.handle.sendCompletionResolveRequest(imageConfigCompletion!);
		expect(edits).to.not.be.empty;

		// Why `import type`? I... don't know. TypeScript return this in some contexts and somehow in the editor it's not a problem.
		// This issue affects all imports, even outside of Astro.
		expect(edits?.additionalTextEdits?.[0].newText).to.equal(
			`\nimport type { Image } from "astro:assets";\n`,
		);
		expect(edits?.additionalTextEdits?.[0].range.start.line).to.equal(0);
	});

	it('Can get completions inside HTML events', async () => {
		const document = await languageServer.openFakeDocument('<div onload="a"></div>', 'astro');
		const completions = await languageServer.handle.sendCompletionRequest(
			document.uri,
			Position.create(0, 13),
		);

		expect(completions?.items).to.not.be.empty;

		// Make sure we have the `alert` completion, which is a global function
		const allLabels = completions?.items.map((item) => item.label);
		expect(allLabels).to.include('alert');
	});

	it('Can get completions inside HTML events with multi-bytes characters in the file', async () => {
		const document = await languageServer.openFakeDocument(
			'<div>あ</div><div onload="a"></div>',
			'astro',
		);
		const completions = await languageServer.handle.sendCompletionRequest(
			document.uri,
			Position.create(0, 24),
		);

		expect(completions?.items).to.not.be.empty;

		// Make sure we have the `alert` completion, which is a global function
		const allLabels = completions?.items.map((item) => item.label);
		expect(allLabels).to.include('alert');
	});
});
