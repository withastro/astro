import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { MIDDLEWARE_PATH_SEGMENT_NAME } from '../../../dist/core/constants.js';

/**
 * Mirrors the path-matching logic used by the middleware vite plugin's
 * file watcher to decide whether a changed file should trigger middleware
 * HMR invalidation. See: packages/astro/src/core/middleware/vite-plugin.ts
 */
function isMiddlewarePath(relativePath) {
	return (
		relativePath.startsWith(`${MIDDLEWARE_PATH_SEGMENT_NAME}.`) ||
		relativePath.startsWith(`${MIDDLEWARE_PATH_SEGMENT_NAME}/`)
	);
}

describe('middleware HMR path matching', () => {
	it('matches middleware.ts (single-file pattern)', () => {
		assert.ok(isMiddlewarePath('middleware.ts'));
	});

	it('matches middleware.js', () => {
		assert.ok(isMiddlewarePath('middleware.js'));
	});

	it('matches middleware/index.ts (directory pattern)', () => {
		assert.ok(isMiddlewarePath('middleware/index.ts'));
	});

	it('matches middleware/test.ts (file inside middleware directory)', () => {
		assert.ok(isMiddlewarePath('middleware/test.ts'));
	});

	it('matches middleware/nested/deep.ts (nested file)', () => {
		assert.ok(isMiddlewarePath('middleware/nested/deep.ts'));
	});

	it('does not match middleware-utils.ts (similarly named file)', () => {
		assert.ok(!isMiddlewarePath('middleware-utils.ts'));
	});

	it('does not match pages/middleware.ts (wrong directory)', () => {
		assert.ok(!isMiddlewarePath('pages/middleware.ts'));
	});

	it('does not match other unrelated files', () => {
		assert.ok(!isMiddlewarePath('components/Header.astro'));
	});
});
