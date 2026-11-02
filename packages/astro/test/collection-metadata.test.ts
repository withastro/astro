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

	it('throws from getCollectionsMetadata()', async () => {
		const response = await app.render(new Request('http://example.com/metadata.json'));

		assert.equal(response.status, 500);
	});
});
