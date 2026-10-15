import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { describe, it } from 'node:test';
import { z } from 'zod';
import { imageSrcToImportId } from '../../../dist/assets/utils/resolveImports.js';
import { defineCollection } from '../../../dist/content/config.js';
import { ContentLayer } from '../../../dist/content/content-layer.js';
import { MutableDataStore } from '../../../dist/content/mutable-data-store.js';
import { resolveEntryData } from '../../../dist/content/runtime.js';
import { AstroLogger } from '../../../dist/core/logger/core.js';
import { createMinimalSettings, createTempDir, createTestConfigObserver } from './test-helpers.ts';

const FILE_PATH = 'src/data/posts/shuttle/index.md';

const SRCS: Record<string, string> = {
	dotSlash: './shuttle.jpg',
	dotDot: '../data/shuttle.jpg',
	bare: 'shuttle.jpg',
	bareNested: 'nested/shuttle.jpg',
	absolute: '/src/data/shuttle.jpg',
	alias: '@images/shuttle.jpg',
};

// Both a top-level and a nested image field, so the recorded paths cover both
// shapes: `['image']` and `['banner', 'image']`.
const EXPECTED_IMAGE_PATHS = [['image'], ['banner', 'image']];

const RESOLVED: any = { src: '/_astro/shuttle.hash.jpg', width: 100, height: 100, format: 'jpg' };

const imageSchema = ({ image }: any) =>
	z.object({
		id: z.string(),
		image: image(),
		banner: z.object({ image: image(), alt: z.string() }),
		enriched: z.boolean().optional(),
	});

function makeEntryData(id: string, image: string) {
	return { id, image, banner: { image, alt: `${id} banner` } };
}

async function syncCollection(loader: any) {
	const root = new URL('../../fixtures/content-layer/', import.meta.url);
	const store = new MutableDataStore();
	const contentLayer = new ContentLayer({
		settings: createMinimalSettings(root),
		logger: new AstroLogger({ destination: { write: () => true }, level: 'silent' }),
		store,
		contentConfigObserver: createTestConfigObserver({
			imgs: defineCollection({ loader, schema: imageSchema }),
		}),
	});
	await contentLayer.sync();
	return store.values('imgs');
}

/**
 * Mirrors what the build does: every `assetImports` src becomes a Vite import id
 * that resolves to the built `ImageMetadata`.
 */
function buildAssetMap(entries: Array<any>) {
	const map = new Map<string, any>();
	for (const entry of entries) {
		for (const src of entry.assetImports ?? []) {
			const id = imageSrcToImportId(src, entry.filePath);
			if (id) map.set(id, RESOLVED);
		}
	}
	return map;
}

function assertImagesResolve(entries: Array<any>) {
	assert.equal(entries.length, Object.keys(SRCS).length);
	const map = buildAssetMap(entries);

	for (const entry of entries) {
		const src = SRCS[entry.id];

		// 7.2.3 stores the plain src and records where the image fields live,
		// instead of keeping an `__ASTRO_IMAGE_`-prefixed string in the data.
		assert.equal(entry.data.image, src, `${entry.id}: stored src`);
		assert.equal(entry.data.banner.image, src, `${entry.id}: stored nested src`);
		assert.deepEqual(
			entry.imageImports,
			EXPECTED_IMAGE_PATHS,
			`${entry.id}: image field paths must be recorded on the entry`,
		);

		const data: any = resolveEntryData(entry, map);
		assert.equal(data.image, RESOLVED, `${entry.id}: image must resolve to ImageMetadata`);
		assert.equal(
			data.banner.image,
			RESOLVED,
			`${entry.id}: nested image must resolve to ImageMetadata`,
		);
		// Untouched siblings are passed through.
		assert.equal(data.banner.alt, `${entry.id} banner`);
	}
}

describe('Content Layer - Asset Imports', () => {
	it('generates unique symbol names for imports with colliding shorthashes', async () => {
		// "Aa" and "BB" produce identical Java-style hashCode values (both = 2112),
		// so image paths differing only by this substitution previously generated
		// duplicate import identifiers via shorthash().
		const tempDir = createTempDir();
		const assetsFile = new URL('./content-assets.mjs', tempDir);

		const store = new MutableDataStore();
		const filePath = 'src/content/blog/post-1/index.md';

		// Add entries with asset imports that would collide under shorthash
		store.set('blog', 'post-1', {
			id: 'post-1',
			data: { title: 'Post 1' },
			filePath,
			assetImports: ['imgAa.jpg', 'imgBB.jpg'],
		});

		await store.writeAssetImports(assetsFile);

		const code = await fs.readFile(assetsFile, 'utf-8');

		// Extract all import identifier names
		const importNames = [...code.matchAll(/import (\w+) from/g)].map((m) => m[1]);

		assert.equal(importNames.length, 2, 'should have exactly 2 imports');
		assert.notEqual(importNames[0], importNames[1], 'import identifiers must be unique');
	});

	it('resolves images for entries the loader stores once', async () => {
		const entries = await syncCollection({
			name: 'store-once',
			async load(context: any) {
				for (const [id, image] of Object.entries(SRCS)) {
					const data = await context.parseData({
						id,
						data: makeEntryData(id, image),
						filePath: FILE_PATH,
					});
					context.store.set({ id, data, filePath: FILE_PATH });
				}
			},
		});

		assertImagesResolve(entries);
	});

	it('resolves images for entries the loader reads back and re-stores', async () => {
		const entries = await syncCollection({
			name: 'read-modify-write',
			async load(context: any) {
				for (const [id, image] of Object.entries(SRCS)) {
					const data = await context.parseData({
						id,
						data: makeEntryData(id, image),
						filePath: FILE_PATH,
					});
					context.store.set({ id, data, filePath: FILE_PATH });
				}

				// Second pass: a loader that enriches an entry after the initial store
				// (attaching a sibling file's contents, a computed field, ...) reads the
				// stored entry back and re-stores it. `set()` strips the image prefix in
				// place on the first pass, so on this pass there is no prefix left to
				// re-discover — the entry's recorded `imageImports` are the only record
				// of where the images live, and must survive the round-trip.
				for (const entry of context.store.values()) {
					context.store.set({ ...entry, data: { ...entry.data, enriched: true } });
				}
			},
		});

		// Guard: the second pass really did re-store every entry.
		for (const entry of entries) {
			assert.equal(entry.data.enriched, true, `${entry.id}: entry was re-stored`);
		}

		assertImagesResolve(entries);
	});
});
