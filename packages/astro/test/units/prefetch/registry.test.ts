import assert from 'node:assert/strict';
import { afterEach, beforeEach, describe, it, mock } from 'node:test';
import {
	hasBeenPrefetched,
	normalizePrefetchUrl,
	recordPrefetch,
	consumePrefetchReuse,
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

	describe('consumePrefetchReuse()', () => {
		it('matches an absolute URL with a hash after prefetching a relative URL', () => {
			// `prefetch()` can be handed a relative URL, while the router looks up
			// `preparationEvent.to.href`, which is absolute and may carry a hash.
			recordPrefetch('/relative-vs-absolute');
			assert.equal(consumePrefetchReuse('https://example.com/relative-vs-absolute#section'), true);
		});

		it('matches a relative URL after prefetching an absolute URL', () => {
			recordPrefetch('https://example.com/absolute-vs-relative');
			assert.equal(consumePrefetchReuse('/absolute-vs-relative'), true);
		});

		it('does not match URLs that were never prefetched', () => {
			assert.equal(consumePrefetchReuse('/never-prefetched'), false);
		});

		it('does not match a URL with a different query string', () => {
			recordPrefetch('/list?page=1');
			assert.equal(consumePrefetchReuse('/list?page=2'), false);
		});

		it('stops matching once the reuse window has passed', () => {
			const start = 1_000_000;
			mock.timers.enable({ apis: ['Date'], now: start });
			recordPrefetch('/expires-in-window');
			recordPrefetch('/expires-out-of-window');

			mock.timers.setTime(start + PREFETCH_REUSE_WINDOW - 1);
			assert.equal(consumePrefetchReuse('/expires-in-window'), true);

			mock.timers.setTime(start + PREFETCH_REUSE_WINDOW);
			assert.equal(consumePrefetchReuse('/expires-out-of-window'), false);
		});

		it('consumes the entry: only the first navigation reuses the prefetched response', () => {
			// Anything else would freeze on-demand rendered pages on the first prefetched
			// body for the whole window (carts, inboxes, dashboards).
			recordPrefetch('/consume-once');
			assert.equal(consumePrefetchReuse('/consume-once'), true);
			assert.equal(consumePrefetchReuse('/consume-once'), false);
		});

		it('keeps a consumed entry deduplicated for the prefetch script', () => {
			recordPrefetch('/consumed-but-deduped');
			assert.equal(consumePrefetchReuse('/consumed-but-deduped'), true);
			assert.equal(hasBeenPrefetched('/consumed-but-deduped'), true);
		});

		it('does not resurrect a consumed entry via re-recording within the same window', () => {
			// recordPrefetch() after consumption restores reusability, which is correct:
			// it means the prefetch script actually fetched a fresh copy.
			recordPrefetch('/re-prefetched');
			assert.equal(consumePrefetchReuse('/re-prefetched'), true);
			recordPrefetch('/re-prefetched');
			assert.equal(consumePrefetchReuse('/re-prefetched'), true);
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
			assert.equal(consumePrefetchReuse('/old-prefetch'), false);
		});
	});
});
