import assert from 'node:assert/strict';
import { before, describe, it } from 'node:test';
import { loadFixture } from './test-utils.js';

describe('Content Intellisense', () => {
	/** @type {import("./test-utils.js").Fixture} */
	let fixture;

	/** @type {string[]} */
	let collectionsDir = [];

	/** @type {{collections: {hasSchema: boolean, name: string}[], entries: Record<string, string>}} */
	let manifest = undefined;

	/** @type {Record<string, Array<{ id: string; data: any; filePath: string; collection: string }>>} */
	let collections;

	before(async () => {
		fixture = await loadFixture({ root: './fixtures/content-intellisense/' });
		await fixture.build();

		collectionsDir = await fixture.readdir('../.astro/collections');
		manifest = JSON.parse(await fixture.readFile('../.astro/collections/collections.json'));
		collections = JSON.parse(await fixture.readFile('index.json'));
	});

	it('generate JSON schemas for content collections', async () => {
		assert.equal(collectionsDir.includes('blog-cc.schema.json'), true);
	});

	it('generate JSON schemas for content layer', async () => {
		assert.equal(collectionsDir.includes('blog-cl.schema.json'), true);
	});

	it('generate JSON schemas for file loader', async () => {
		assert.equal(collectionsDir.includes('data-cl.schema.json'), true);
	});

	it('generates a record JSON schema for the file loader', async () => {
		const schema = JSON.parse(await fixture.readFile('../.astro/collections/data-cl.schema.json'));
		assert.equal(schema.definitions['data-cl'].type, 'object');
		assert.equal(schema.definitions['data-cl'].additionalProperties.type, 'object');
		assert.deepEqual(schema.definitions['data-cl'].additionalProperties.properties, {
			name: { type: 'string' },
			color: { type: 'string' },
		});
	});

	it('manifest exists', async () => {
		assert.notEqual(manifest, undefined);
	});

	it('manifest has content collections', async () => {
		const manifestCollections = manifest.collections.map((collection) => collection.name);
		assert.equal(
			manifestCollections.includes('blog-cc'),
			true,
			"Expected 'blog-cc' collection in manifest",
		);
	});

	it('manifest has content layer', async () => {
		const manifestCollections = manifest.collections.map((collection) => collection.name);
		assert.equal(
			manifestCollections.includes('blog-cl'),
			true,
			"Expected 'blog-cl' collection in manifest",
		);
	});

	it('has entries for content collections', async () => {
		const collectionEntries = Object.entries(manifest.entries).filter((entry) =>
			entry[0].includes(
				'/astro/packages/astro/test/fixtures/content-intellisense/src/content/blog-cc/',
			),
		);
		assert.equal(collectionEntries.length, 3, "Expected 3 entries for 'blog-cc' collection");
		assert.equal(
			collectionEntries.every((entry) => entry[1] === 'blog-cc'),
			true,
			"Expected 3 entries for 'blog-cc' collection to have 'blog-cc' as collection",
		);
	});

	it('has entries for content layer', async () => {
		const collectionEntries = Object.entries(manifest.entries).filter((entry) =>
			entry[0].includes('/astro/packages/astro/test/fixtures/content-intellisense/src/blog-cl/'),
		);

		assert.equal(collectionEntries.length, 3, "Expected 3 entries for 'blog-cl' collection");
		assert.equal(
			collectionEntries.every((entry) => entry[1] === 'blog-cl'),
			true,
			"Expected 3 entries for 'blog-cl' collection to have 'blog-cl' as collection name",
		);
	});

	it('doesn’t generate a `$schema` entry for file loader if `$schema` value is a string', async () => {
		assert.equal(collections['data-cl-json'].map((entry) => entry.id).includes('$schema'), false);
	});

	it('generates a `$schema` entry for file loader if `$schema` value isn’t a string', async () => {
		assert.equal(
			collections['data-schema-misuse'].map((entry) => entry.id).includes('$schema'),
			true,
		);
	});
});
