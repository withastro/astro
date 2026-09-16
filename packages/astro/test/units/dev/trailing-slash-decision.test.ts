import * as assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { evaluateTrailingSlash } from '../../../dist/vite-plugin-astro-server/trailing-slash.js';

// #region internal paths
describe('evaluateTrailingSlash — internal paths', () => {
	it('passes through /@vite/client', () => {
		const result = evaluateTrailingSlash('/@vite/client', '', 'never');
		assert.deepEqual(result, { action: 'next' });
	});

	it('passes through /@fs/ paths', () => {
		const result = evaluateTrailingSlash('/@fs/project/src/main.ts', '', 'always');
		assert.deepEqual(result, { action: 'next' });
	});

	it('passes through /@id/ paths', () => {
		const result = evaluateTrailingSlash('/@id/module', '', 'never');
		assert.deepEqual(result, { action: 'next' });
	});
});
// #endregion

// #region duplicate trailing slashes
describe('evaluateTrailingSlash — duplicate trailing slashes', () => {
	it('redirects /about// to /about/', () => {
		const result = evaluateTrailingSlash('/about//', '', 'ignore');
		assert.equal(result.action, 'redirect');
		if (result.action === 'redirect') {
			assert.equal(result.status, 301);
			assert.equal(result.location, '/about/');
		}
	});

	it('redirects /about/// to /about/', () => {
		const result = evaluateTrailingSlash('/about///', '', 'ignore');
		assert.equal(result.action, 'redirect');
		if (result.action === 'redirect') {
			assert.equal(result.location, '/about/');
		}
	});

	it('preserves query string in redirect', () => {
		const result = evaluateTrailingSlash('/about//', '?foo=bar', 'ignore');
		assert.equal(result.action, 'redirect');
		if (result.action === 'redirect') {
			assert.equal(result.location, '/about/?foo=bar');
		}
	});

	it('collapses only trailing slashes, not internal ones', () => {
		const result = evaluateTrailingSlash('/blog//post//', '', 'ignore');
		assert.equal(result.action, 'redirect');
		if (result.action === 'redirect') {
			// collapseDuplicateTrailingSlashes only collapses trailing slashes
			assert.equal(result.location, '/blog//post/');
		}
	});
});
// #endregion

// #region trailingSlash: 'never'
describe('evaluateTrailingSlash — trailingSlash: "never"', () => {
	it('rejects /about/ (has trailing slash)', () => {
		const result = evaluateTrailingSlash('/about/', '', 'never');
		assert.equal(result.action, 'reject');
		if (result.action === 'reject') {
			assert.equal(result.status, 404);
			assert.equal(result.pathname, '/about/');
		}
	});

	it('passes /about (no trailing slash)', () => {
		const result = evaluateTrailingSlash('/about', '', 'never');
		assert.deepEqual(result, { action: 'next' });
	});

	it('exempts root path / (always allowed)', () => {
		const result = evaluateTrailingSlash('/', '', 'never');
		assert.deepEqual(result, { action: 'next' });
	});

	it('rejects /blog/post/ (nested with trailing slash)', () => {
		const result = evaluateTrailingSlash('/blog/post/', '', 'never');
		assert.equal(result.action, 'reject');
	});
});
// #endregion

// #region trailingSlash: 'always'
describe('evaluateTrailingSlash — trailingSlash: "always"', () => {
	it('rejects /about (no trailing slash)', () => {
		const result = evaluateTrailingSlash('/about', '', 'always');
		assert.equal(result.action, 'reject');
		if (result.action === 'reject') {
			assert.equal(result.status, 404);
			assert.equal(result.pathname, '/about');
		}
	});

	it('passes /about/ (has trailing slash)', () => {
		const result = evaluateTrailingSlash('/about/', '', 'always');
		assert.deepEqual(result, { action: 'next' });
	});

	it('exempts paths with file extension', () => {
		const result = evaluateTrailingSlash('/styles.css', '', 'always');
		assert.deepEqual(result, { action: 'next' });
	});

	it('exempts .html file extension', () => {
		const result = evaluateTrailingSlash('/page.html', '', 'always');
		assert.deepEqual(result, { action: 'next' });
	});

	it('exempts .js file extension', () => {
		const result = evaluateTrailingSlash('/script.js', '', 'always');
		assert.deepEqual(result, { action: 'next' });
	});

	it('passes root path /', () => {
		const result = evaluateTrailingSlash('/', '', 'always');
		assert.deepEqual(result, { action: 'next' });
	});
});
// #endregion

// #region trailingSlash: 'ignore'
describe('evaluateTrailingSlash — trailingSlash: "ignore"', () => {
	it('passes /about', () => {
		const result = evaluateTrailingSlash('/about', '', 'ignore');
		assert.deepEqual(result, { action: 'next' });
	});

	it('passes /about/', () => {
		const result = evaluateTrailingSlash('/about/', '', 'ignore');
		assert.deepEqual(result, { action: 'next' });
	});

	it('passes /', () => {
		const result = evaluateTrailingSlash('/', '', 'ignore');
		assert.deepEqual(result, { action: 'next' });
	});

	it('still redirects duplicate slashes', () => {
		const result = evaluateTrailingSlash('/about//', '', 'ignore');
		assert.equal(result.action, 'redirect');
	});
});
// #endregion
