import assert from 'node:assert/strict';
import { afterEach, beforeEach, describe, it, mock } from 'node:test';
import {
	hasBeenPrefetched,
	normalizePrefetchUrl,
	recordPrefetch,
	wasPrefetchedRecently,
} from '../../../dist/prefetch/registry.js';

// Matches Chromium's `kPrefetchReuseMins` (see `packages/astro/src/prefetch/registry.ts`)
const PREFETCH_REUSE_WINDOW = 5 * 60 * 1000;

describe('prefetch registry', () => {
	// The registry runs in the browser and resolves partial URLs against the current page,
	// just like the prefetch script and the view transitions router do.
	const originalLocation = (globalThis as any).location;

	beforeEach(() => {
		(globalThis as any).location = { href: 'https://example.com/page/' };
	});

	afterEach(() => {
		if (originalLocation === undefined) {
			delete (globalThis as any).location;
		} else {
			(globalThis as any).location = originalLocation;
		}
		mock.timers.reset();
	});

	describe('normalizePrefetchUrl()', () => {
		it('resolves partial URLs against the current page', () => {
			assert.equal(normalizePrefetchUrl('/about'), 'https://example.com/about');
			assert.equal(normalizePrefetchUrl('sibling'), 'https://example.com/page/sibling');
		});

		it('strips the hash', () => {
			assert.equal(normalizePrefetchUrl('/about#team'), 'https://example.com/about');
			assert.equal(
				normalizePrefetchUrl('https://example.com/about#team'),
				'https://example.com/about',
			);
		});

		it('keeps the query string', () => {
			assert.equal(normalizePrefetchUrl('/search?q=astro'), 'https://example.com/search?q=astro');
		});
	});

	describe('wasPrefetchedRecently()', () => {
		it('matches an absolute URL with a hash after prefetching a relative URL', () => {
			// `prefetch()` can be handed a relative URL, while the router looks up
			// `preparationEvent.to.href`, which is absolute and may carry a hash.
			recordPrefetch('/relative-vs-absolute');
			assert.equal(wasPrefetchedRecently('https://example.com/relative-vs-absolute#section'), true);
		});

		it('matches a relative URL after prefetching an absolute URL', () => {
			recordPrefetch('https://example.com/absolute-vs-relative');
			assert.equal(wasPrefetchedRecently('/absolute-vs-relative'), true);
		});

		it('does not match URLs that were never prefetched', () => {
			assert.equal(wasPrefetchedRecently('/never-prefetched'), false);
		});

		it('does not match a URL with a different query string', () => {
			recordPrefetch('/list?page=1');
			assert.equal(wasPrefetchedRecently('/list?page=2'), false);
		});

		it('stops matching once the reuse window has passed', () => {
			const start = 1_000_000;
			mock.timers.enable({ apis: ['Date'], now: start });
			recordPrefetch('/expires');

			mock.timers.setTime(start + PREFETCH_REUSE_WINDOW - 1);
			assert.equal(wasPrefetchedRecently('/expires'), true);

			mock.timers.setTime(start + PREFETCH_REUSE_WINDOW);
			assert.equal(wasPrefetchedRecently('/expires'), false);
		});
	});

	describe('hasBeenPrefetched()', () => {
		it('shares the normalization with recordPrefetch()', () => {
			recordPrefetch('/dedupe#top');
			assert.equal(hasBeenPrefetched('https://example.com/dedupe#bottom'), true);
			assert.equal(hasBeenPrefetched('/elsewhere'), false);
		});

		it('keeps tracking a URL after the reuse window has passed', () => {
			const start = 2_000_000;
			mock.timers.enable({ apis: ['Date'], now: start });
			recordPrefetch('/old-prefetch');

			mock.timers.setTime(start + PREFETCH_REUSE_WINDOW + 1);
			// Still deduplicated by the prefetch script...
			assert.equal(hasBeenPrefetched('/old-prefetch'), true);
			// ...but too old for the router to reuse without revalidation.
			assert.equal(wasPrefetchedRecently('/old-prefetch'), false);
		});
	});
});
