import assert from 'node:assert/strict';
import { afterEach, describe, it } from 'node:test';
import type { SerializedStaticImage } from '../../../dist/assets/types.js';
import {
	uninstallRenderScope,
	type RenderCollectors,
} from '../../../dist/core/render-scope/scope.js';
import { ensureAsyncRenderScope } from '../../../dist/core/render-scope/node-scope.js';
import {
	recordContentEntryRender,
	recordStaticImage,
} from '../../../dist/core/render-scope/record.js';

function image(hash: string): SerializedStaticImage {
	return {
		originalPath: '/_astro/penguin.png',
		hash,
		finalPath: `/_astro/penguin.${hash}.webp`,
		originalSrcPath: 'src/assets/penguin.png',
		transform: { src: '/_astro/penguin.png' },
	};
}

describe('render scope record helpers', () => {
	afterEach(() => {
		uninstallRenderScope();
	});

	it('no-op without a scope installed', () => {
		recordContentEntryRender('src/content/docs/one.mdx');
		recordStaticImage(image('h1'));
	});

	it('no-op with a scope installed but no store in scope', () => {
		ensureAsyncRenderScope();
		recordContentEntryRender('src/content/docs/one.mdx');
		recordStaticImage(image('h1'));
	});

	it('tolerates a store lacking a field (version skew), recording nothing', () => {
		const scope = ensureAsyncRenderScope();
		const store: RenderCollectors = {};
		scope.run(store, () => {
			recordContentEntryRender('src/content/docs/one.mdx');
			recordStaticImage(image('h1'));
		});
		assert.deepEqual(store, {});
	});

	it('records into the active store', () => {
		const scope = ensureAsyncRenderScope();
		const store: RenderCollectors = { contentEntries: new Set(), staticImages: [] };
		scope.run(store, () => {
			recordContentEntryRender('src/content/docs/one.mdx');
			recordContentEntryRender('src/content/docs/one.mdx');
			recordContentEntryRender(undefined);
			recordStaticImage(image('h1'));
			// Dedup hits are recorded too: duplicates are preserved by array push.
			recordStaticImage(image('h1'));
		});
		assert.deepEqual([...store.contentEntries!], ['src/content/docs/one.mdx']);
		assert.equal(store.staticImages!.length, 2);
	});

	it('never cross-records between interleaved async flows', async () => {
		const scope = ensureAsyncRenderScope();
		const storeA: RenderCollectors = { contentEntries: new Set(), staticImages: [] };
		const storeB: RenderCollectors = { contentEntries: new Set(), staticImages: [] };

		const tick = () => new Promise((resolve) => setTimeout(resolve, 1));
		await Promise.all([
			scope.run(storeA, async () => {
				recordContentEntryRender('a-1');
				await tick();
				recordStaticImage(image('a'));
				await tick();
				recordContentEntryRender('a-2');
			}),
			scope.run(storeB, async () => {
				await tick();
				recordContentEntryRender('b-1');
				recordStaticImage(image('b'));
				await tick();
				recordContentEntryRender('b-2');
			}),
		]);

		assert.deepEqual([...storeA.contentEntries!], ['a-1', 'a-2']);
		assert.deepEqual([...storeB.contentEntries!], ['b-1', 'b-2']);
		assert.deepEqual(
			storeA.staticImages!.map((i) => i.hash),
			['a'],
		);
		assert.deepEqual(
			storeB.staticImages!.map((i) => i.hash),
			['b'],
		);
	});
});
