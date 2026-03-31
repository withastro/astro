import { describe, it, before, after } from 'node:test';
import { strict as assert } from 'node:assert';
import { promises as fs } from 'node:fs';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import * as devalue from 'devalue';
import { MutableDataStore } from '../../../dist/content/mutable-data-store.js';
import { imageSrcToImportId } from '../../../dist/assets/utils/resolveImports.js';

describe('MutableDataStore', () => {
	let tmpDir: string;

	before(async () => {
		tmpDir = await mkdtemp(path.join(tmpdir(), 'astro-test-'));
	});

	after(async () => {
		try {
			await rm(tmpDir, { recursive: true, force: true });
		} catch {
			// Ignore cleanup errors
		}
	});

	it('removes stale image asset import after entry image path is updated (issue #16097)', async () => {
		const assetsFilePath = path.join(tmpDir, 'content-assets.mjs');
		const entryFilePath = 'src/content/categories/example.json';
		const store = new MutableDataStore();
		const scoped = store.scopedStore('categories');

		scoped.set({
			id: 'example',
			data: {},
			filePath: entryFilePath,
			assetImports: ['./images/seed.webp'],
		});

		scoped.set({
			id: 'example',
			data: {},
			filePath: entryFilePath,
			assetImports: ['./images/non-existing.jpg'],
		});

		scoped.set({
			id: 'example',
			data: {},
			filePath: entryFilePath,
			assetImports: ['./images/seed.webp'],
		});

		await store.writeAssetImports(assetsFilePath);

		const content = await fs.readFile(assetsFilePath, 'utf-8');

		const validId = imageSrcToImportId('./images/seed.webp', entryFilePath);
		const staleId = imageSrcToImportId('./images/non-existing.jpg', entryFilePath);

		assert.ok(!!validId);
		assert.ok(
			content.includes(validId),
			`content-assets.mjs should reference the valid image import "${validId}"`,
		);
		assert.ok(
			!content.includes('non-existing.jpg'),
			`content-assets.mjs must NOT reference the stale invalid import "${staleId}" after the path is restored`,
		);
	});

	it('removes asset imports when an entry is deleted', async () => {
		const assetsFilePath = path.join(tmpDir, 'content-assets-delete.mjs');
		const entryFilePath = 'src/content/categories/deleted.json';
		const store = new MutableDataStore();
		const scoped = store.scopedStore('categories');

		scoped.set({
			id: 'deleted-entry',
			data: {},
			filePath: entryFilePath,
			assetImports: ['./images/to-be-removed.webp'],
		});

		await store.writeAssetImports(assetsFilePath);
		const contentBefore = await fs.readFile(assetsFilePath, 'utf-8');
		assert.ok(
			contentBefore.includes('to-be-removed.webp'),
			'should contain the image before deletion',
		);

		scoped.delete('deleted-entry');
		await store.writeAssetImports(assetsFilePath);
		await store.waitUntilSaveComplete();

		const contentAfter = await fs.readFile(assetsFilePath, 'utf-8');
		assert.ok(
			!contentAfter.includes('to-be-removed.webp'),
			'should NOT contain the image after the entry is deleted',
		);
	});

	it('removes asset imports when a collection is cleared', async () => {
		const assetsFilePath = path.join(tmpDir, 'content-assets-clear.mjs');
		const entryFilePath = 'src/content/blog/post.json';
		const store = new MutableDataStore();
		const scoped = store.scopedStore('blog');

		scoped.set({
			id: 'post-1',
			data: {},
			filePath: entryFilePath,
			assetImports: ['./images/cover.webp'],
		});

		await store.writeAssetImports(assetsFilePath);
		const contentBefore = await fs.readFile(assetsFilePath, 'utf-8');
		assert.ok(contentBefore.includes('cover.webp'), 'should contain the image before clear');

		scoped.clear();
		await store.writeAssetImports(assetsFilePath);
		await store.waitUntilSaveComplete();

		const contentAfter = await fs.readFile(assetsFilePath, 'utf-8');
		assert.ok(
			!contentAfter.includes('cover.webp'),
			'should NOT contain the image after the collection is cleared',
		);
	});

	it('reproduces race condition: concurrent writeToDisk() calls lose data', async () => {
		const filePath = pathToFileURL(path.join(tmpDir, 'data-store.json'));
		const store = await MutableDataStore.fromFile(filePath);

		store.set('c', 'key1', { id: 'key1', data: {} });
		const p1 = store.writeToDisk();

		store.set('c', 'key2', { id: 'key2', data: {} });
		const p2 = store.writeToDisk();

		await Promise.all([p1, p2]);

		const raw = await fs.readFile(filePath, 'utf-8');
		const collections = devalue.parse(raw);
		const collection = collections.get('c');

		assert.ok(collection.has('key1'), 'key1 should be present in the written file');
		assert.ok(
			collection.has('key2'),
			'key2 should be present in the written file (this will FAIL before the fix)',
		);
	});
});
