import * as assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { wrapId } from '../../../dist/core/util.js';

/**
 * Tests for the cache key alignment in the dev CSS collection pipeline.
 *
 * The `cssContentCache` in vite-plugin-css stores CSS content keyed by the raw
 * module ID from the transform hook. The load handler must use the same raw ID
 * (not the `wrapId()`-transformed version) when looking up cached content.
 *
 * Virtual modules (prefixed with `\0`) are affected because `wrapId()` transforms
 * the `\0` prefix to `/@id/__x00__`, creating a cache key mismatch if used for lookup.
 *
 * See: https://github.com/withastro/astro/issues/17267
 */
describe('dev CSS cache key alignment for virtual modules', () => {
	it('wrapId transforms null-byte prefix of virtual module IDs', () => {
		const virtualId = '\0virtual:astro:image-styles.css';
		const wrapped = wrapId(virtualId);

		// wrapId replaces \0 with /@id/__x00__
		assert.notEqual(wrapped, virtualId);
		assert.equal(wrapped, '/@id/__x00__virtual:astro:image-styles.css');
	});

	it('wrapId is a no-op for filesystem path IDs', () => {
		const fsId = '/home/user/project/src/pages/index.astro?astro&type=style&index=0&lang.css';
		const wrapped = wrapId(fsId);

		// Filesystem paths don't start with \0, so wrapId is identity
		assert.equal(wrapped, fsId);
	});

	it('cache lookup must use raw ID, not wrapped ID, for virtual modules', () => {
		// Simulates the cssContentCache behavior
		const cache = new Map<string, string>();
		const rawId = '\0virtual:astro:image-styles.css';
		const cssContent = '@layer astro.images { :where([data-astro-image]) { height: auto; } }';

		// Transform hook stores with raw ID
		cache.set(rawId, cssContent);

		// Load handler must look up with raw ID (idKey), not wrapId(rawId) (id)
		const wrappedId = wrapId(rawId);

		// Bug: using wrapped ID causes cache miss
		assert.equal(cache.get(wrappedId), undefined);

		// Fix: using raw ID finds the cached content
		assert.equal(cache.get(rawId), cssContent);
	});
});
