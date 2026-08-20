import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import fs from 'node:fs/promises';
import { MutableDataStore } from '../../../dist/content/mutable-data-store.js';
import { createTempDir } from './test-helpers.ts';

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
});
