import * as assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { getDevServerBase } from '../../../dist/core/app/dev-base.js';
import { evaluateBase, resolveDevRoot } from '../../../dist/vite-plugin-astro-server/base.js';

// #region resolveDevRoot
describe('resolveDevRoot', () => {
	it('resolves /docs base without site', () => {
		const { devRoot } = resolveDevRoot('/docs');
		assert.equal(devRoot, '/docs');
	});

	it('resolves /docs/ base with trailing slash', () => {
		const { devRoot } = resolveDevRoot('/docs/');
		assert.equal(devRoot, '/docs/');
	});

	it('resolves / base (root)', () => {
		const { devRoot } = resolveDevRoot('/');
		assert.equal(devRoot, '/');
	});

	it('resolves empty base as /', () => {
		const { devRoot } = resolveDevRoot('');
		assert.equal(devRoot, '/');
	});

	it('uses site pathname when site is provided', () => {
		const { devRoot } = resolveDevRoot('/docs/', 'https://example.com');
		assert.equal(devRoot, '/docs/');
	});

	it('absolute base overrides site pathname', () => {
		// `/app/` is absolute, so the site's `/prefix/` pathname is irrelevant
		const { devRoot } = resolveDevRoot('/app/', 'https://example.com/prefix/');
		assert.equal(devRoot, '/app/');
	});
});
// #endregion

// #region evaluateBase — next
describe('evaluateBase — next', () => {
	it('leaves base-prefixed URLs for Vite to strip', () => {
		const result = evaluateBase('/docs/about?foo=bar', '/docs/about', undefined, '/docs/');
		assert.deepEqual(result, { action: 'next' });
	});

	it('passes the exact base through', () => {
		const result = evaluateBase('/docs', '/docs', undefined, '/docs');
		assert.deepEqual(result, { action: 'next' });
	});
});
// #endregion

// #region evaluateBase — not-found-subpath
describe('evaluateBase — not-found-subpath', () => {
	it('returns not-found-subpath for / when base is not /', () => {
		const result = evaluateBase('/', '/', undefined, '/docs/');
		assert.equal(result.action, 'not-found-subpath');
		if (result.action === 'not-found-subpath') {
			assert.equal(result.pathname, '/');
			assert.equal(result.devRoot, '/docs/');
		}
	});

	it('returns not-found-subpath for /index.html', () => {
		const result = evaluateBase('/index.html', '/index.html', undefined, '/docs/');
		assert.equal(result.action, 'not-found-subpath');
		if (result.action === 'not-found-subpath') {
			assert.equal(result.pathname, '/index.html');
		}
	});
});
// #endregion

// #region evaluateBase — not-found (HTML)
describe('evaluateBase — not-found', () => {
	it('returns not-found for non-base URL with text/html accept', () => {
		const result = evaluateBase('/other', '/other', 'text/html', '/docs/');
		assert.equal(result.action, 'not-found');
		if (result.action === 'not-found') {
			assert.equal(result.pathname, '/other');
		}
	});

	it('returns not-found when accept includes text/html among others', () => {
		const result = evaluateBase('/other', '/other', 'text/html, application/xhtml+xml', '/docs/');
		assert.equal(result.action, 'not-found');
	});
});
// #endregion

// #region evaluateBase — check-public
describe('evaluateBase — check-public', () => {
	it('returns check-public for non-base URL without HTML accept', () => {
		const result = evaluateBase('/favicon.ico', '/favicon.ico', 'image/*', '/docs/');
		assert.equal(result.action, 'check-public');
	});

	it('returns check-public when accept header is undefined', () => {
		const result = evaluateBase('/script.js', '/script.js', undefined, '/docs/');
		assert.equal(result.action, 'check-public');
	});

	it('returns check-public for non-HTML accept types', () => {
		const result = evaluateBase('/api/data', '/api/data', 'application/json', '/docs/');
		assert.equal(result.action, 'check-public');
	});
});
// #endregion

describe('getDevServerBase', () => {
	it('uses the Astro base by default', () => {
		assert.equal(getDevServerBase('/admin', undefined), '/admin');
	});

	it('preserves an explicit Vite base', () => {
		assert.equal(getDevServerBase('/', '/admin'), '/admin');
	});

	it('composes Astro and Vite bases', () => {
		assert.equal(getDevServerBase('/admin', '/assets'), '/admin/assets');
	});
});
