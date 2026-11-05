import assert from 'node:assert/strict';
import { before, describe, it } from 'node:test';
import testAdapter from './test-adapter.ts';
import { type App, type Fixture, loadFixture } from './test-utils.ts';

describe('Collection metadata', () => {
	let fixture: Fixture;
	let app: App;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/collection-metadata/',
			adapter: testAdapter(),
			outDir: './dist/collection-metadata/',
		});
		await fixture.build({});
		app = await fixture.loadTestAdapterApp();
	});

	it('lists build-time then live collections with their descriptors', async () => {
		const response = await app.render(new Request('http://example.com/metadata.json'));
		assert.equal(response.status, 200);
		const { metadata } = await response.json();

		assert.deepEqual(metadata, [
			{
				name: 'docs',
				type: 'build-time',
				loader: { name: 'docs-loader' },
				descriptors: { library: 'docs', version: 1 },
			},
			{
				name: 'guides',
				type: 'build-time',
				loader: { name: 'docs-loader' },
				descriptors: { library: 'docs', version: 2, audience: ['beginners'] },
			},
			{
				name: 'notes',
				type: 'build-time',
				loader: { name: 'notes-loader' },
				descriptors: { library: 'notes' },
			},
			{
				name: 'authors',
				type: 'build-time',
				loader: { name: 'inline' },
				descriptors: {},
			},
			{
				name: 'products',
				type: 'live',
				loader: { name: 'products-loader' },
				descriptors: { library: 'shop', featured: true },
			},
		]);
	});

	it('finds collections by descriptor and reads their entries', async () => {
		const response = await app.render(new Request('http://example.com/metadata.json'));
		const { entries } = await response.json();

		assert.deepEqual(entries, [
			{ name: 'docs', ids: ['intro'] },
			{ name: 'guides', ids: ['intro'] },
		]);
	});
});

for (const collectionStorage of ['single-file', 'chunked'] as const) {
	describe(`Collections in astro:build:done, with a ${collectionStorage} data store`, () => {
		before(async () => {
			const fixture = await loadFixture({
				root: './fixtures/collection-metadata/',
				adapter: testAdapter(),
				outDir: `./dist/collection-metadata-build-done-${collectionStorage}/`,
				experimental: { collectionMetadata: true, collectionStorage },
			});
			await fixture.build({ force: true });
		});

		it('passes the metadata and entries of build-time collections', () => {
			const { metadata, docs, docsWithContent, products } = (globalThis as any)
				.buildDoneCollections;

			assert.deepEqual(
				metadata.map(({ name }: { name: string }) => name),
				['docs', 'guides', 'notes', 'authors'],
			);
			assert.deepEqual(
				docs.map(({ id }: { id: string }) => id),
				['intro'],
			);
			// Each call returns new objects, so the change the fixture's integration made isn't seen
			assert.notEqual(docs[0].data.title, 'Changed by an integration');
			assert.equal('body' in docs[0], false);
			assert.equal('rendered' in docs[0], false);
			assert.equal(typeof docsWithContent[0].body, 'string');
			assert.ok(docsWithContent[0].rendered.html);
			// Live collections have no entries at build time
			assert.deepEqual(products, []);
		});
	});
}

describe('Collection metadata in Markdown plugins', () => {
	let app: App;

	before(async () => {
		const fixture = await loadFixture({
			root: './fixtures/collection-metadata/',
			adapter: testAdapter(),
			outDir: './dist/collection-metadata-markdown/',
		});
		await fixture.build({});
		app = await fixture.loadTestAdapterApp();
	});

	async function renderEntry(collection: string, id: string) {
		const response = await app.render(
			new Request(`http://example.com/rendered/${collection}/${id}`),
		);
		return response.text();
	}

	it('exposes the collection of entries rendered by glob()', async () => {
		assert.match(await renderEntry('docs', 'intro'), /collection: docs \(docs\)/);
		assert.match(await renderEntry('guides', 'intro'), /collection: guides \(docs\)/);
	});

	it('exposes the collection of entries rendered with renderMarkdown()', async () => {
		assert.match(await renderEntry('notes', 'first'), /collection: notes \(notes\)/);
	});
});

describe('Collection metadata in Markdown plugins without the flag', () => {
	let app: App;

	before(async () => {
		const fixture = await loadFixture({
			root: './fixtures/collection-metadata/',
			adapter: testAdapter(),
			outDir: './dist/collection-metadata-markdown-disabled/',
			experimental: { collectionMetadata: false },
		});
		await fixture.build({});
		app = await fixture.loadTestAdapterApp();
	});

	it('leaves the collection unknown', async () => {
		const response = await app.render(new Request('http://example.com/rendered/docs/intro'));

		assert.match(await response.text(), /collection: unknown/);
	});
});

describe('Collection metadata without the flag', () => {
	let app: App;

	before(async () => {
		const fixture = await loadFixture({
			root: './fixtures/collection-metadata/',
			adapter: testAdapter(),
			outDir: './dist/collection-metadata-disabled/',
			experimental: { collectionMetadata: false },
		});
		await fixture.build({});
		app = await fixture.loadTestAdapterApp();
	});

	it('passes no collections to astro:build:done', () => {
		assert.equal((globalThis as any).buildDoneCollections, undefined);
	});

	it('throws from getCollectionsMetadata()', async () => {
		const response = await app.render(new Request('http://example.com/metadata.json'));

		assert.equal(response.status, 500);
	});
});

describe('Collection descriptors without the flag', () => {
	it('are ignored, so not checked', async () => {
		const fixture = await loadFixture({ root: './fixtures/collection-metadata-disabled/' });
		// Without the cache, an invalid content config would leave the collection empty
		await fixture.build({ force: true });

		assert.match(await fixture.readFile('/index.html'), /<p id="count">1<\/p>/);
	});
});

describe('astro:collections:resolved in a build', () => {
	const calls: string[] = [];

	before(async () => {
		const fixture = await loadFixture({
			root: './fixtures/collection-metadata/',
			adapter: testAdapter(),
			outDir: './dist/collection-metadata-hook-order/',
			integrations: [
				{
					name: 'record-hook-order',
					hooks: {
						'astro:config:setup': ({ updateConfig }) => {
							updateConfig({
								vite: {
									plugins: [
										{
											name: 'record-first-load',
											// Only the build's Vite pipeline, not the server sync loads the content config with
											apply: 'build',
											load() {
												if (!calls.includes('vite:load')) calls.push('vite:load');
											},
										},
									],
								},
							});
						},
						'astro:config:done': () => {
							calls.push('astro:config:done');
						},
						'astro:collections:resolved': () => {
							calls.push('astro:collections:resolved');
						},
						'astro:build:start': () => {
							calls.push('astro:build:start');
						},
					},
				},
			],
		});
		await fixture.build({});
	});

	it('runs after astro:config:done, before the build starts and loads any module', () => {
		const order = [
			'astro:config:done',
			'astro:collections:resolved',
			'astro:build:start',
			'vite:load',
		].map((call) => calls.indexOf(call));

		assert.ok(!order.includes(-1), `missing calls: ${calls.join(', ')}`);
		assert.deepEqual(
			order,
			[...order].sort((a, b) => a - b),
		);
	});
});
