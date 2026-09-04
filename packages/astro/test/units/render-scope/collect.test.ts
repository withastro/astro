import assert from 'node:assert/strict';
import { afterEach, describe, it } from 'node:test';
import { collectPrerenderMetadata } from '../../../dist/core/render-scope/collect.js';
import { uninstallRenderScope } from '../../../dist/core/render-scope/scope.js';
import { ensureAsyncRenderScope } from '../../../dist/core/render-scope/node-scope.js';
import {
	recordContentEntryRender,
	recordStaticImage,
} from '../../../dist/core/render-scope/record.js';
import type { SerializedStaticImage } from '../../../dist/assets/types.js';
import { defaultLogger, SpyLogger } from '../test-utils.ts';

function image(hash: string): SerializedStaticImage {
	return {
		originalPath: '/_astro/penguin.png',
		hash,
		finalPath: `/_astro/penguin.${hash}.webp`,
		originalSrcPath: 'src/assets/penguin.png',
		transform: { src: '/_astro/penguin.png' },
	};
}

describe('collectPrerenderMetadata', () => {
	afterEach(() => {
		uninstallRenderScope();
	});

	it('with no scope installed: warns once per process, runs fn bare, metadata undefined', async () => {
		// Unit tests share one process; import a fresh module instance so the
		// warn-once latch is deterministically unset for this test.
		const freshSpecifier = '../../../dist/core/render-scope/collect.js?warn-once';
		const { collectPrerenderMetadata: collect } = (await import(
			freshSpecifier
		)) as typeof import('../../../dist/core/render-scope/collect.js');
		const logger = new SpyLogger();
		const first = await collect(async () => 'first', logger);
		assert.equal(first.value, 'first');
		assert.equal(first.metadata, undefined);
		assert.equal(logger.logs.length, 1);
		assert.equal(logger.logs[0].label, 'build');
		assert.match(logger.logs[0].message, /no render scope is installed/);

		const second = await collect(async () => 'second', logger);
		assert.equal(second.value, 'second');
		assert.equal(second.metadata, undefined);
		assert.equal(logger.logs.length, 1);
	});

	it('an empty collecting run yields empty arrays, never undefined', async () => {
		ensureAsyncRenderScope();
		const { value, metadata } = await collectPrerenderMetadata(async () => 42, defaultLogger);
		assert.equal(value, 42);
		assert.deepEqual(metadata, { contentEntryKeys: [], staticImages: [] });
	});

	it('attributes concurrent runs exactly, shared keys included', async () => {
		ensureAsyncRenderScope();
		const N = 8;
		const results = await Promise.all(
			Array.from({ length: N }, (_, i) =>
				collectPrerenderMetadata(async () => {
					// Randomized await depths so runs interleave arbitrarily.
					for (let d = 0, depth = 1 + Math.floor(Math.random() * 4); d < depth; d++) {
						await new Promise((resolve) => setTimeout(resolve, Math.random() * 5));
					}
					recordContentEntryRender(`entry-${i}`);
					recordStaticImage(image(`img-${i}`));
					await new Promise((resolve) => setTimeout(resolve, Math.random() * 5));
					// One key shared by every run: each store still gets its own copy.
					recordContentEntryRender('entry-shared');
					recordStaticImage(image('img-shared'));
					return i;
				}, defaultLogger),
			),
		);
		for (const { value: i, metadata } of results) {
			assert.deepEqual(metadata?.contentEntryKeys, [`entry-${i}`, 'entry-shared']);
			assert.deepEqual(
				metadata?.staticImages.map((img) => img.hash),
				[`img-${i}`, 'img-shared'],
			);
		}
	});

	it('the returned snapshot is immune to post-resolve records', async () => {
		ensureAsyncRenderScope();
		let releaseLateRecord!: () => void;
		let lateRecordDone!: Promise<void>;
		const { metadata } = await collectPrerenderMetadata(async () => {
			recordContentEntryRender('on-time');
			recordStaticImage(image('on-time'));
			// A floating promise created inside the scope carries the async context
			// past the bracket; its late records must not mutate the snapshot.
			lateRecordDone = new Promise<void>((resolve) => {
				releaseLateRecord = resolve;
			}).then(() => {
				recordContentEntryRender('late');
				recordStaticImage(image('late'));
			});
		}, defaultLogger);
		releaseLateRecord();
		await lateRecordDone;
		assert.deepEqual(metadata?.contentEntryKeys, ['on-time']);
		assert.deepEqual(
			metadata?.staticImages.map((img) => img.hash),
			['on-time'],
		);
	});

	it('a throwing fn propagates and the next run collects cleanly', async () => {
		ensureAsyncRenderScope();
		await assert.rejects(
			collectPrerenderMetadata(async () => {
				recordContentEntryRender('doomed');
				throw new Error('render failed');
			}, defaultLogger),
			/render failed/,
		);
		const { metadata } = await collectPrerenderMetadata(async () => {
			recordContentEntryRender('clean');
		}, defaultLogger);
		assert.deepEqual(metadata?.contentEntryKeys, ['clean']);
	});
});
