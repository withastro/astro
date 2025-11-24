import assert from 'node:assert';
import path from 'node:path';
import { before, describe, it } from 'node:test';
import { Position } from '@volar/language-server';
import { getLanguageServer, type LanguageServer } from '../server.ts';
import { fixtureDir } from '../utils.ts';

describe('TypeScript - Completions', async () => {
	let languageServer: LanguageServer;

	before(async () => (languageServer = await getLanguageServer()));

	it('Can get completions in the frontmatter', async () => {
		const document = await languageServer.openFakeDocument('---\nc\n---', 'astro');
		const completions = await languageServer.handle.sendCompletionRequest(
			document.uri,
			Position.create(1, 1),
		);

		assert.ok(completions?.items && completions?.items.length > 0);
	});

	it('Can get completions in the template', async () => {
		const document = await languageServer.openFakeDocument('{c}', 'astro');
		const completions = await languageServer.handle.sendCompletionRequest(
			document.uri,
			Position.create(0, 1),
		);

		assert.ok(completions?.items && completions?.items.length > 0);
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

		assert.strictEqual(imageCompletion?.sortText, '\x00￿16');
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
			assert.ok(allLabels);
			assert.ok(completions?.items && completions?.items.length > 0);
			assert.ok(allLabels.includes('log'));
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
		assert.notStrictEqual(imageConfigCompletion, undefined);

		const edits = await languageServer.handle.sendCompletionResolveRequest(imageConfigCompletion!);
		assert.ok(edits);

		// Why `import type`? I... don't know. TypeScript return this in some contexts and somehow in the editor it's not a problem.
		// This issue affects all imports, even outside of Astro.
		assert.strictEqual(
			edits?.additionalTextEdits?.[0].newText,
			`\nimport type { Image } from "astro:assets";\n`,
		);
		assert.strictEqual(edits?.additionalTextEdits?.[0].range.start.line, 0);
	});

	it('Can get completions inside HTML events', async () => {
		const document = await languageServer.openFakeDocument('<div onload="a"></div>', 'astro');
		const completions = await languageServer.handle.sendCompletionRequest(
			document.uri,
			Position.create(0, 13),
		);

		assert.ok(completions?.items && completions?.items.length > 0);

		// Make sure we have the `alert` completion, which is a global function
		const allLabels = completions?.items.map((item) => item.label);
		assert.ok(allLabels.includes('alert'));
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

		assert.ok(completions?.items && completions?.items.length > 0);

		// Make sure we have the `alert` completion, which is a global function
		const allLabels = completions?.items.map((item) => item.label);
		assert.ok(allLabels.includes('alert'));
	});
});
