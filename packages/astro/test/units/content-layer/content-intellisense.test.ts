import { strict as assert } from 'node:assert';
import { promises as fs } from 'node:fs';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';
import { ContentLayer } from '../../../dist/content/content-layer.js';
import { MutableDataStore } from '../../../dist/content/mutable-data-store.js';
import { AstroLogger } from '../../../dist/core/logger/core.js';
import { createMinimalSettings, createTempDir, createTestConfigObserver } from './test-helpers.ts';

const COLLECTIONS_MANIFEST_FILE = 'collections/collections.json';

function silentLogger() {
	return new AstroLogger({
		destination: { write: () => true },
		level: 'silent',
	});
}

/**
 * Writes an initial collections manifest (the shape the language server consumes)
 * into the `.astro` dir, declaring `blog` as a schema-bearing collection.
 */
async function seedManifest(dotAstroDir: URL) {
	const manifestUrl = new URL(COLLECTIONS_MANIFEST_FILE, dotAstroDir);
	await fs.mkdir(new URL('./', manifestUrl), { recursive: true });
	await fs.writeFile(
		manifestUrl,
		JSON.stringify({ collections: [{ name: 'blog', hasSchema: true }], entries: {} }, null, 2),
	);
	return manifestUrl;
}

async function readManifest(manifestUrl: URL) {
	return JSON.parse(await fs.readFile(manifestUrl, 'utf-8'));
}

function entryKey(root: URL, filePath: string) {
	return new URL(filePath, root).href.toLowerCase();
}

describe('Content Layer - contentIntellisense manifest', () => {
	it('adds entries for content files present in the store', async () => {
		const root = createTempDir();
		const dotAstroDir = new URL('./.astro/', root);
		const manifestUrl = await seedManifest(dotAstroDir);

		const store = new MutableDataStore();
		store.set('blog', 'first', { id: 'first', data: {}, filePath: 'src/content/blog/first.md' });

		const contentLayer = new ContentLayer({
			settings: createMinimalSettings(root),
			logger: silentLogger(),
			store,
			contentConfigObserver: createTestConfigObserver({}),
		});

		await contentLayer.regenerateCollectionFileManifest();

		const manifest = await readManifest(manifestUrl);
		assert.ok(
			manifest.entries[entryKey(root, 'src/content/blog/first.md')],
			'manifest should include the present content file',
		);
	});

	it('removes entries for content files deleted from the store on regeneration', async () => {
		const root = createTempDir();
		const dotAstroDir = new URL('./.astro/', root);
		const manifestUrl = await seedManifest(dotAstroDir);

		const store = new MutableDataStore();
		store.set('blog', 'first', { id: 'first', data: {}, filePath: 'src/content/blog/first.md' });
		store.set('blog', 'second', { id: 'second', data: {}, filePath: 'src/content/blog/second.md' });

		const contentLayer = new ContentLayer({
			settings: createMinimalSettings(root),
			logger: silentLogger(),
			store,
			contentConfigObserver: createTestConfigObserver({}),
		});

		await contentLayer.regenerateCollectionFileManifest();

		// The author deletes `second.md` — the store no longer holds it.
		store.delete('blog', 'second');
		await contentLayer.regenerateCollectionFileManifest();

		const manifest = await readManifest(manifestUrl);
		assert.ok(
			manifest.entries[entryKey(root, 'src/content/blog/first.md')],
			'remaining file should stay in the manifest',
		);
		assert.equal(
			manifest.entries[entryKey(root, 'src/content/blog/second.md')],
			undefined,
			'deleted file should be removed from the manifest',
		);
	});

	it('regenerates the manifest when a content file changes during dev', async () => {
		const root = createTempDir();
		const dotAstroDir = new URL('./.astro/', root);
		const manifestUrl = await seedManifest(dotAstroDir);

		// Minimal mock of vite's FSWatcher capturing the registered listeners.
		const handlers: Record<string, Array<(path: string) => void>> = {};
		const watcher: any = {
			on(event: string, cb: (path: string) => void) {
				(handlers[event] ??= []).push(cb);
				return watcher;
			},
			off() {
				return watcher;
			},
		};

		const store = new MutableDataStore();
		const settings = createMinimalSettings(root, {
			config: { experimental: { contentIntellisense: true } },
		});

		const contentLayer = new ContentLayer({
			settings,
			logger: silentLogger(),
			store,
			watcher,
			contentConfigObserver: createTestConfigObserver({
				blog: { type: 'content_layer', loader: () => [] },
			}),
		});

		await contentLayer.sync();

		// The sync should have registered add/unlink listeners on the watcher.
		assert.ok(handlers.add?.length, 'an "add" listener should be registered');
		assert.ok(handlers.unlink?.length, 'an "unlink" listener should be registered');

		// A new content file appears; the store now holds it.
		store.set('blog', 'fresh', { id: 'fresh', data: {}, filePath: 'src/content/blog/fresh.md' });
		for (const cb of handlers.add) {
			cb(fileURLToPath(new URL('src/content/blog/fresh.md', root)));
		}

		// Wait out the debounce window, then confirm the manifest was regenerated.
		await new Promise((resolve) => setTimeout(resolve, 80));

		const manifest = await readManifest(manifestUrl);
		assert.ok(
			manifest.entries[entryKey(root, 'src/content/blog/fresh.md')],
			'manifest should pick up the new file without a restart',
		);
	});

	it('ignores writes inside the .astro dir to avoid an infinite loop', async () => {
		const root = createTempDir();
		const dotAstroDir = new URL('./.astro/', root);
		await seedManifest(dotAstroDir);

		const handlers: Record<string, Array<(path: string) => void>> = {};
		const watcher: any = {
			on(event: string, cb: (path: string) => void) {
				(handlers[event] ??= []).push(cb);
				return watcher;
			},
			off() {
				return watcher;
			},
		};

		const store = new MutableDataStore();
		const settings = createMinimalSettings(root, {
			config: { experimental: { contentIntellisense: true } },
		});

		const contentLayer = new ContentLayer({
			settings,
			logger: silentLogger(),
			store,
			watcher,
			contentConfigObserver: createTestConfigObserver({
				blog: { type: 'content_layer', loader: () => [] },
			}),
		});

		await contentLayer.sync();

		let regenerated = false;
		const original = contentLayer.regenerateCollectionFileManifest.bind(contentLayer);
		contentLayer.regenerateCollectionFileManifest = async () => {
			regenerated = true;
			return original();
		};

		// A write inside `.astro` (e.g. the manifest itself) must NOT trigger regeneration.
		for (const cb of handlers.add) {
			cb(fileURLToPath(new URL('collections/collections.json', dotAstroDir)));
		}
		await new Promise((resolve) => setTimeout(resolve, 80));

		assert.equal(regenerated, false, '.astro writes should not trigger regeneration');
	});
});
