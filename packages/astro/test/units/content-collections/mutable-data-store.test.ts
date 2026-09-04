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

	it('removes stale module imports when an entry is deleted (via debounced write trigger)', async () => {
		const modulesFilePath = path.join(tmpDir, 'content-modules-delete.mjs');
		const store = new MutableDataStore();
		const scoped = store.scopedStore('docs');

		scoped.set({
			id: 'page-a',
			data: {},
			filePath: 'src/content/docs/page-a.mdx',
			deferredRender: true,
		});

		scoped.set({
			id: 'page-b',
			data: {},
			filePath: 'src/content/docs/page-b.mdx',
			deferredRender: true,
		});

		await store.writeModuleImports(modulesFilePath);
		const contentBefore = await fs.readFile(modulesFilePath, 'utf-8');
		assert.ok(contentBefore.includes('page-a.mdx'), 'should contain page-a before deletion');
		assert.ok(contentBefore.includes('page-b.mdx'), 'should contain page-b before deletion');

		// Do NOT call writeModuleImports() again here: that would rebuild and write
		// synchronously regardless of whether delete() actually schedules a rewrite.
		// Rely solely on the debounced trigger that delete() is supposed to schedule,
		// flushed via waitUntilSaveComplete(), so this test exercises the real
		// dev-server code path (a filesystem delete triggers a rewrite on its own).
		scoped.delete('page-a');
		await store.waitUntilSaveComplete();

		const contentAfter = await fs.readFile(modulesFilePath, 'utf-8');
		assert.ok(
			!contentAfter.includes('page-a.mdx'),
			'should NOT contain page-a after the entry is deleted',
		);
		assert.ok(contentAfter.includes('page-b.mdx'), 'should still contain page-b');
	});

	it('removes stale module imports when a collection is cleared (via debounced write trigger)', async () => {
		const modulesFilePath = path.join(tmpDir, 'content-modules-clear.mjs');
		const store = new MutableDataStore();
		const scoped = store.scopedStore('docs');

		scoped.set({
			id: 'page-1',
			data: {},
			filePath: 'src/content/docs/page-1.mdx',
			deferredRender: true,
		});

		await store.writeModuleImports(modulesFilePath);
		const contentBefore = await fs.readFile(modulesFilePath, 'utf-8');
		assert.ok(contentBefore.includes('page-1.mdx'), 'should contain page-1 before clear');

		scoped.clear();
		await store.waitUntilSaveComplete();

		const contentAfter = await fs.readFile(modulesFilePath, 'utf-8');
		assert.ok(
			!contentAfter.includes('page-1.mdx'),
			'should NOT contain page-1 after the collection is cleared',
		);
	});

	it('removes stale module imports when the entire store is cleared via clearAll (via debounced write trigger)', async () => {
		const modulesFilePath = path.join(tmpDir, 'content-modules-clear-all.mjs');
		const store = new MutableDataStore();
		const docsScoped = store.scopedStore('docs');
		const blogScoped = store.scopedStore('blog');

		docsScoped.set({
			id: 'page-1',
			data: {},
			filePath: 'src/content/docs/page-1.mdx',
			deferredRender: true,
		});
		blogScoped.set({
			id: 'post-1',
			data: {},
			filePath: 'src/content/blog/post-1.mdx',
			deferredRender: true,
		});

		await store.writeModuleImports(modulesFilePath);
		const contentBefore = await fs.readFile(modulesFilePath, 'utf-8');
		assert.ok(contentBefore.includes('page-1.mdx'), 'should contain page-1 before clearAll');
		assert.ok(contentBefore.includes('post-1.mdx'), 'should contain post-1 before clearAll');

		store.clearAll();
		await store.waitUntilSaveComplete();

		const contentAfter = await fs.readFile(modulesFilePath, 'utf-8');
		assert.ok(!contentAfter.includes('page-1.mdx'), 'should NOT contain page-1 after clearAll');
		assert.ok(!contentAfter.includes('post-1.mdx'), 'should NOT contain post-1 after clearAll');
	});

	it('removes the old module import and adds the new one when an entry is renamed (issue #17707)', async () => {
		// A rename is how glob.ts actually models it: delete the old id, then set the new one.
		const modulesFilePath = path.join(tmpDir, 'content-modules-rename.mjs');
		const store = new MutableDataStore();
		const scoped = store.scopedStore('docs');

		scoped.set({
			id: 'otp',
			data: {},
			filePath: 'src/content/docs/otp.mdx',
			deferredRender: true,
		});

		await store.writeModuleImports(modulesFilePath);
		const contentBefore = await fs.readFile(modulesFilePath, 'utf-8');
		assert.ok(contentBefore.includes('otp.mdx'), 'should contain the original file before rename');

		// Rename: delete the old entry, then set the new one under a new id/filePath.
		scoped.delete('otp');
		scoped.set({
			id: 'the-otp',
			data: {},
			filePath: 'src/content/docs/the-otp.mdx',
			deferredRender: true,
		});
		await store.waitUntilSaveComplete();

		const contentAfter = await fs.readFile(modulesFilePath, 'utf-8');
		assert.ok(
			!contentAfter.includes('"src/content/docs/otp.mdx"'),
			'should NOT reference the old (renamed-away) file path',
		);
		assert.ok(
			contentAfter.includes('the-otp.mdx'),
			'should reference the new (renamed-to) file path',
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

	it('strips image prefixes and records their paths as out-of-band imageImports', () => {
		const store = new MutableDataStore();
		const scoped = store.scopedStore('blog');
		const entryFilePath = 'src/content/blog/post.md';

		scoped.set({
			id: 'post',
			filePath: entryFilePath,
			data: {
				cover: '__ASTRO_IMAGE_./hero.png',
				gallery: ['__ASTRO_IMAGE_./a.png'],
				nested: { icon: '__ASTRO_IMAGE_./icon.png' },
				title: 'Hello',
			},
		});

		const entry = store.get('blog', 'post') as any;

		// The stored data holds plain, serializable src strings — no prefixes.
		assert.equal(entry.data.cover, './hero.png');
		assert.equal(entry.data.gallery[0], './a.png');
		assert.equal(entry.data.nested.icon, './icon.png');
		assert.equal(entry.data.title, 'Hello');

		// The image field locations are recorded out-of-band.
		assert.deepEqual(entry.imageImports, [['cover'], ['gallery', 0], ['nested', 'icon']]);
		assert.deepEqual(new Set(entry.assetImports), new Set(['./hero.png', './a.png', './icon.png']));
	});

	it('does not set imageImports when the entry has no images', () => {
		const store = new MutableDataStore();
		const scoped = store.scopedStore('blog');

		scoped.set({ id: 'plain', data: { title: 'Hello' } });

		const entry = store.get('blog', 'plain') as any;
		assert.equal(entry.imageImports, undefined);
	});
});
