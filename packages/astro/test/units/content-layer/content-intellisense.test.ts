import assert from 'node:assert/strict';
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { after, describe, it } from 'node:test';
import { ContentLayer } from '../../../dist/content/content-layer.js';
import { MutableDataStore } from '../../../dist/content/mutable-data-store.js';
import { AstroLogger } from '../../../dist/core/logger/core.js';
import { createMinimalSettings, createTempDir, createTestConfigObserver } from './test-helpers.ts';

/**
 * Creates a ContentLayer with a pre-populated data store and a seed collections.json manifest.
 * Useful for testing regenerateCollectionFileManifest() in isolation.
 */
function setupIntellisenseTest(options: {
	storeEntries: Array<{ collection: string; id: string; filePath: string }>;
	collections: Array<{ hasSchema: boolean; name: string }>;
	existingManifestEntries?: Record<string, string>;
}) {
	const root = createTempDir('astro-intellisense-test-');
	const settings = createMinimalSettings(root, {
		config: {
			experimental: { contentIntellisense: true },
		},
	});

	const logger = new AstroLogger({
		destination: { write: () => true },
		level: 'silent',
	});

	const store = new MutableDataStore();

	// Populate store with entries
	for (const entry of options.storeEntries) {
		store.set(entry.collection, entry.id, {
			id: entry.id,
			data: {},
			filePath: entry.filePath,
		});
	}

	// Create .astro/collections/ directory and seed collections.json
	const collectionsDir = new URL('.astro/collections/', root);
	mkdirSync(collectionsDir, { recursive: true });

	const manifest = {
		collections: options.collections,
		entries: options.existingManifestEntries ?? {},
	};
	writeFileSync(new URL('collections.json', collectionsDir), JSON.stringify(manifest, null, 2));

	// Create ContentLayer without a watcher (unit test, no file system watching)
	const contentLayer = new ContentLayer({
		settings,
		logger,
		store,
		contentConfigObserver: createTestConfigObserver({}),
	});

	const manifestPath = new URL('collections.json', collectionsDir);

	return { root, settings, store, contentLayer, manifestPath };
}

function readManifest(manifestPath: URL) {
	return JSON.parse(readFileSync(manifestPath, 'utf-8'));
}

describe('Content Intellisense - regenerateCollectionFileManifest', () => {
	const cleanupDirs: URL[] = [];

	after(() => {
		for (const dir of cleanupDirs) {
			rmSync(dir, { recursive: true, force: true });
		}
	});

	it('populates manifest entries from the data store', async () => {
		const { root, contentLayer, manifestPath } = setupIntellisenseTest({
			storeEntries: [
				{ collection: 'blog', id: 'post-1', filePath: 'src/content/blog/post-1.md' },
				{ collection: 'blog', id: 'post-2', filePath: 'src/content/blog/post-2.md' },
			],
			collections: [{ hasSchema: true, name: 'blog' }],
		});
		cleanupDirs.push(root);

		await contentLayer.regenerateCollectionFileManifest();

		const manifest = readManifest(manifestPath);
		const entryKeys = Object.keys(manifest.entries);

		assert.equal(entryKeys.length, 2, 'Should have 2 entries');
		assert.ok(
			entryKeys.some((k: string) => k.includes('src/content/blog/post-1.md')),
			'Should include post-1.md',
		);
		assert.ok(
			entryKeys.some((k: string) => k.includes('src/content/blog/post-2.md')),
			'Should include post-2.md',
		);
		// All entries should map to the 'blog' collection
		assert.ok(
			Object.values(manifest.entries).every((v: unknown) => v === 'blog'),
			'All entries should map to blog collection',
		);
	});

	it('removes stale entries for deleted files', async () => {
		const { root, contentLayer, manifestPath } = setupIntellisenseTest({
			// Only post-1 exists in the store
			storeEntries: [{ collection: 'blog', id: 'post-1', filePath: 'src/content/blog/post-1.md' }],
			collections: [{ hasSchema: true, name: 'blog' }],
			// But the manifest has both post-1 and a stale post-2
			existingManifestEntries: {
				'file:///old/path/src/content/blog/post-1.md': 'blog',
				'file:///old/path/src/content/blog/post-2.md': 'blog',
			},
		});
		cleanupDirs.push(root);

		await contentLayer.regenerateCollectionFileManifest();

		const manifest = readManifest(manifestPath);
		const entryKeys = Object.keys(manifest.entries);

		assert.equal(entryKeys.length, 1, 'Should have only 1 entry after removing stale entries');
		assert.ok(
			entryKeys.some((k: string) => k.includes('src/content/blog/post-1.md')),
			'Should still include post-1.md',
		);
		assert.ok(
			!entryKeys.some((k: string) => k.includes('post-2.md')),
			'Should NOT include the stale post-2.md',
		);
	});

	it('handles adding a new entry to the store and regenerating', async () => {
		const { root, store, contentLayer, manifestPath } = setupIntellisenseTest({
			storeEntries: [{ collection: 'blog', id: 'post-1', filePath: 'src/content/blog/post-1.md' }],
			collections: [{ hasSchema: true, name: 'blog' }],
		});
		cleanupDirs.push(root);

		// Initial regeneration
		await contentLayer.regenerateCollectionFileManifest();

		let manifest = readManifest(manifestPath);
		assert.equal(Object.keys(manifest.entries).length, 1, 'Should start with 1 entry');

		// Simulate adding a new file to the store (as the glob loader would)
		store.set('blog', 'post-2', {
			id: 'post-2',
			data: {},
			filePath: 'src/content/blog/post-2.md',
		});

		// Regenerate manifest
		await contentLayer.regenerateCollectionFileManifest();

		manifest = readManifest(manifestPath);
		const entryKeys = Object.keys(manifest.entries);

		assert.equal(entryKeys.length, 2, 'Should now have 2 entries');
		assert.ok(
			entryKeys.some((k: string) => k.includes('post-2.md')),
			'Should include the newly added post-2.md',
		);
	});

	it('handles removing an entry from the store and regenerating', async () => {
		const { root, store, contentLayer, manifestPath } = setupIntellisenseTest({
			storeEntries: [
				{ collection: 'blog', id: 'post-1', filePath: 'src/content/blog/post-1.md' },
				{ collection: 'blog', id: 'post-2', filePath: 'src/content/blog/post-2.md' },
			],
			collections: [{ hasSchema: true, name: 'blog' }],
		});
		cleanupDirs.push(root);

		// Initial regeneration
		await contentLayer.regenerateCollectionFileManifest();

		let manifest = readManifest(manifestPath);
		assert.equal(Object.keys(manifest.entries).length, 2, 'Should start with 2 entries');

		// Simulate file deletion (as the glob loader would)
		store.delete('blog', 'post-2');

		// Regenerate manifest
		await contentLayer.regenerateCollectionFileManifest();

		manifest = readManifest(manifestPath);
		const entryKeys = Object.keys(manifest.entries);

		assert.equal(entryKeys.length, 1, 'Should now have 1 entry after deletion');
		assert.ok(
			!entryKeys.some((k: string) => k.includes('post-2.md')),
			'Should NOT include the deleted post-2.md',
		);
		assert.ok(
			entryKeys.some((k: string) => k.includes('post-1.md')),
			'Should still include post-1.md',
		);
	});

	it('skips collections without schemas', async () => {
		const { root, contentLayer, manifestPath } = setupIntellisenseTest({
			storeEntries: [
				{ collection: 'blog', id: 'post-1', filePath: 'src/content/blog/post-1.md' },
				{ collection: 'data', id: 'item-1', filePath: 'src/content/data/item-1.json' },
			],
			collections: [
				{ hasSchema: true, name: 'blog' },
				{ hasSchema: false, name: 'data' },
			],
		});
		cleanupDirs.push(root);

		await contentLayer.regenerateCollectionFileManifest();

		const manifest = readManifest(manifestPath);
		const entryKeys = Object.keys(manifest.entries);

		assert.equal(entryKeys.length, 1, 'Should only have entries for collections with schemas');
		assert.ok(
			entryKeys.some((k: string) => k.includes('post-1.md')),
			'Should include blog entry (has schema)',
		);
		assert.ok(
			!entryKeys.some((k: string) => k.includes('item-1.json')),
			'Should NOT include data entry (no schema)',
		);
	});

	it('lowercases entry keys for case-insensitive matching', async () => {
		const { root, contentLayer, manifestPath } = setupIntellisenseTest({
			storeEntries: [{ collection: 'blog', id: 'post-1', filePath: 'src/Content/Blog/Post-1.md' }],
			collections: [{ hasSchema: true, name: 'blog' }],
		});
		cleanupDirs.push(root);

		await contentLayer.regenerateCollectionFileManifest();

		const manifest = readManifest(manifestPath);
		const entryKeys = Object.keys(manifest.entries);

		assert.equal(entryKeys.length, 1);
		// The key should be lowercased
		assert.ok(
			entryKeys[0].includes('src/content/blog/post-1.md'),
			`Entry key should be lowercased, got: ${entryKeys[0]}`,
		);
	});

	it('preserves collections array when regenerating entries', async () => {
		const collections = [
			{ hasSchema: true, name: 'blog' },
			{ hasSchema: true, name: 'docs' },
		];

		const { root, contentLayer, manifestPath } = setupIntellisenseTest({
			storeEntries: [{ collection: 'blog', id: 'post-1', filePath: 'src/content/blog/post-1.md' }],
			collections,
		});
		cleanupDirs.push(root);

		await contentLayer.regenerateCollectionFileManifest();

		const manifest = readManifest(manifestPath);

		assert.deepEqual(
			manifest.collections,
			collections,
			'Collections array should be preserved unchanged',
		);
	});
});
