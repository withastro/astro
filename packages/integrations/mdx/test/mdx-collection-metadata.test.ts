import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import { type DevServer, type Fixture, loadFixture } from './test-utils.ts';

describe('MDX with collection metadata', () => {
	let fixture: Fixture;

	before(async () => {
		fixture = await loadFixture({
			root: new URL('./fixtures/collection-metadata/', import.meta.url),
			outDir: './dist/build/',
		});
		await fixture.build();
	});

	it('exposes the collection of MDX entries to Markdown plugins', async () => {
		const html = await fixture.readFile('/docs/mdx-entry/index.html');

		assert.match(html, /collection: docs \(docs\)/);
	});

	it('exposes the collection of deferred Markdown entries to Markdown plugins', async () => {
		const html = await fixture.readFile('/docs/md-entry/index.html');

		assert.match(html, /collection: docs \(docs\)/);
	});

	it('leaves the collection unknown for files loaded by several collections', async () => {
		const html = await fixture.readFile('/first/shared/index.html');

		assert.match(html, /collection: unknown/);
	});
});

describe('MDX with collection metadata in development', () => {
	let fixture: Fixture;
	let devServer: DevServer;

	before(async () => {
		fixture = await loadFixture({
			root: new URL('./fixtures/collection-metadata/', import.meta.url),
			outDir: './dist/dev/',
		});
		devServer = await fixture.startDevServer();
	});

	after(async () => {
		await devServer?.stop();
		fixture.resetAllFiles();
	});

	async function waitFor(path: string, pattern: RegExp) {
		const deadline = Date.now() + 10_000;
		while (true) {
			const html = await (await fixture.fetch(path)).text();
			if (pattern.test(html)) return;
			if (Date.now() > deadline) assert.fail(`${path} never matched ${pattern}`);
			await new Promise((resolve) => setTimeout(resolve, 200));
		}
	}

	it('compiles MDX entries again when their collection changes', async () => {
		await waitFor('/docs/mdx-entry', /collection: docs \(docs\)/);

		await fixture.editFile('/src/content.config.ts', (content) =>
			content.replace("descriptors: { library: 'docs' }", "descriptors: { library: 'guides' }"),
		);

		await waitFor('/docs/mdx-entry', /collection: docs \(guides\)/);
	});
});
