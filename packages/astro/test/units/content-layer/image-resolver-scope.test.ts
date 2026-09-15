import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { defineCollection } from '../../../dist/content/config.js';
import { ContentLayer } from '../../../dist/content/content-layer.js';
import { MutableDataStore } from '../../../dist/content/mutable-data-store.js';
import { AstroLogger } from '../../../dist/core/logger/core.js';
import { createMinimalSettings, createTempDir, createTestConfigObserver } from './test-helpers.ts';

/**
 * `image()` reads its resolver off `globalThis.astroAsset`, because `content.config.ts` loads
 * `astro/content/image` through Vite while `ContentLayer` is loaded by Node. These cover the
 * lifetime of that ambient slot: a sync must not be able to leave a resolver behind, including
 * when syncs from separate `ContentLayer` instances overlap.
 */

/** Only `resolveId` is ever reached, and only if a loader actually resolves an image. */
const fakeViteServer: any = {
	environments: { ssr: { pluginContainer: { resolveId: async () => null } } },
};

function deferred() {
	let resolve!: () => void;
	const promise = new Promise<void>((r) => {
		resolve = r;
	});
	return { promise, resolve };
}

function currentResolver() {
	return (globalThis as any).astroAsset?.contentImageResolver;
}

function createLayer(load: () => Promise<void>, viteServer?: any) {
	return new ContentLayer({
		settings: createMinimalSettings(createTempDir()),
		logger: new AstroLogger({ destination: { write: () => true }, level: 'silent' }),
		store: new MutableDataStore(),
		contentConfigObserver: createTestConfigObserver({
			posts: defineCollection({ loader: { name: 'test', load } }),
		}),
		viteServer,
	});
}

/** Runs `fn` with a recognisable resolver already in the slot, and puts it back afterwards. */
async function withSentinel(fn: (sentinel: any) => Promise<void>) {
	const sentinel = async () => undefined;
	(globalThis as any).astroAsset ??= {};
	const previous = currentResolver();
	(globalThis as any).astroAsset.contentImageResolver = sentinel;
	try {
		await fn(sentinel);
	} finally {
		(globalThis as any).astroAsset.contentImageResolver = previous;
	}
}

describe('Content Layer - image resolver scope', () => {
	it('installs a resolver for the duration of a sync, then restores the slot', async () => {
		await withSentinel(async (sentinel) => {
			let duringSync: unknown;
			const layer = createLayer(async () => {
				duringSync = currentResolver();
			}, fakeViteServer);

			await layer.sync();

			assert.equal(typeof duringSync, 'function', 'loader must see a resolver');
			assert.notEqual(duringSync, sentinel, 'the sync must install its own resolver');
			assert.equal(currentResolver(), sentinel, 'the slot must be restored after the sync');
		});
	});

	it('leaves the slot untouched when there is no vite server', async () => {
		await withSentinel(async (sentinel) => {
			let duringSync: unknown;
			const layer = createLayer(async () => {
				duringSync = currentResolver();
			});

			await layer.sync();

			assert.equal(duringSync, sentinel);
			assert.equal(currentResolver(), sentinel);
		});
	});

	it('restores the slot when overlapping syncs finish out of order', async () => {
		await withSentinel(async (sentinel) => {
			const firstStarted = deferred();
			const secondStarted = deferred();
			const firstFinished = deferred();
			let firstResolver: unknown;
			let secondResolverAtStart: unknown;
			let secondResolverAtEnd: unknown;

			// Starts first, finishes first — while the second sync is still running.
			const first = createLayer(async () => {
				firstResolver = currentResolver();
				firstStarted.resolve();
				await secondStarted.promise;
			}, fakeViteServer);

			const second = createLayer(async () => {
				secondResolverAtStart = currentResolver();
				secondStarted.resolve();
				await firstFinished.promise;
				secondResolverAtEnd = currentResolver();
			}, fakeViteServer);

			const firstSync = first.sync().then(() => firstFinished.resolve());
			// Only start the second sync once the first is inside its loader, so the two are
			// known to overlap and the second is unambiguously the one that started last.
			await firstStarted.promise;
			const secondSync = second.sync();
			await Promise.all([firstSync, secondSync]);

			assert.equal(typeof secondResolverAtStart, 'function');
			assert.notEqual(
				secondResolverAtStart,
				firstResolver,
				'the second sync must install its own resolver over the first one',
			);
			assert.equal(
				secondResolverAtEnd,
				secondResolverAtStart,
				'an overlapping sync finishing first must not pull the resolver out from under this one',
			);
			assert.equal(currentResolver(), sentinel, 'neither sync may leave a resolver installed');
		});
	});
});
