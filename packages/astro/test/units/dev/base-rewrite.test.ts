import * as assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
	evaluateBaseRewrite,
	resolveDevRoot,
} from '../../../dist/vite-plugin-astro-server/base.js';

// #region resolveDevRoot
describe('resolveDevRoot', () => {
	it('resolves /docs base without site', () => {
		const { devRoot, devRootReplacement } = resolveDevRoot('/docs');
		assert.equal(devRoot, '/docs');
		assert.equal(devRootReplacement, '');
	});

	it('resolves /docs/ base with trailing slash', () => {
		const { devRoot, devRootReplacement } = resolveDevRoot('/docs/');
		assert.equal(devRoot, '/docs/');
		assert.equal(devRootReplacement, '/');
	});

	it('resolves / base (root)', () => {
		const { devRoot, devRootReplacement } = resolveDevRoot('/');
		assert.equal(devRoot, '/');
		assert.equal(devRootReplacement, '/');
	});

	it('resolves empty base as /', () => {
		const { devRoot, devRootReplacement } = resolveDevRoot('');
		assert.equal(devRoot, '/');
		assert.equal(devRootReplacement, '/');
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

// #region evaluateBaseRewrite — rewrite
describe('evaluateBaseRewrite — rewrite', () => {
	it('rewrites URL starting with base by stripping base', () => {
		const result = evaluateBaseRewrite('/docs/about', '/docs/about', undefined, '/docs/', '/');
		assert.equal(result.action, 'rewrite');
		if (result.action === 'rewrite') {
			assert.equal(result.newUrl, '/about');
		}
	});

	it('rewrites root base request to /', () => {
		const result = evaluateBaseRewrite('/docs/', '/docs/', undefined, '/docs/', '/');
		assert.equal(result.action, 'rewrite');
		if (result.action === 'rewrite') {
			assert.equal(result.newUrl, '/');
		}
	});

	it('preserves query params after rewrite', () => {
		const result = evaluateBaseRewrite(
			'/docs/page?foo=bar',
			'/docs/page',
			undefined,
			'/docs/',
			'/',
		);
		assert.equal(result.action, 'rewrite');
		if (result.action === 'rewrite') {
			assert.equal(result.newUrl, '/page?foo=bar');
		}
	});

	it('ensures rewritten URL starts with /', () => {
		// devRootReplacement is '' (no trailing slash on devRoot), so stripping
		// '/docs' from '/docs/about' yields '/about' which already starts with /
		const result = evaluateBaseRewrite('/docs/about', '/docs/about', undefined, '/docs', '');
		assert.equal(result.action, 'rewrite');
		if (result.action === 'rewrite') {
			assert.ok(result.newUrl.startsWith('/'));
		}
	});

	it('rewrites exact base match (no trailing content)', () => {
		const result = evaluateBaseRewrite('/docs', '/docs', undefined, '/docs', '');
		assert.equal(result.action, 'rewrite');
		if (result.action === 'rewrite') {
			assert.equal(result.newUrl, '/');
		}
	});
});
// #endregion

// #region evaluateBaseRewrite — not-found-subpath
describe('evaluateBaseRewrite — not-found-subpath', () => {
	it('returns not-found-subpath for / when base is not /', () => {
		const result = evaluateBaseRewrite('/', '/', undefined, '/docs/', '/');
		assert.equal(result.action, 'not-found-subpath');
		if (result.action === 'not-found-subpath') {
			assert.equal(result.pathname, '/');
			assert.equal(result.devRoot, '/docs/');
		}
	});

	it('returns not-found-subpath for /index.html', () => {
		const result = evaluateBaseRewrite('/index.html', '/index.html', undefined, '/docs/', '/');
		assert.equal(result.action, 'not-found-subpath');
		if (result.action === 'not-found-subpath') {
			assert.equal(result.pathname, '/index.html');
		}
	});
});
// #endregion

// #region evaluateBaseRewrite — not-found (HTML)
describe('evaluateBaseRewrite — not-found', () => {
	it('returns not-found for non-base URL with text/html accept', () => {
		const result = evaluateBaseRewrite('/other', '/other', 'text/html', '/docs/', '/');
		assert.equal(result.action, 'not-found');
		if (result.action === 'not-found') {
			assert.equal(result.pathname, '/other');
		}
	});

	it('returns not-found when accept includes text/html among others', () => {
		const result = evaluateBaseRewrite(
			'/other',
			'/other',
			'text/html, application/xhtml+xml',
			'/docs/',
			'/',
		);
		assert.equal(result.action, 'not-found');
	});
});
// #endregion

// #region evaluateBaseRewrite — check-public
describe('evaluateBaseRewrite — check-public', () => {
	it('returns check-public for non-base URL without HTML accept', () => {
		const result = evaluateBaseRewrite('/favicon.ico', '/favicon.ico', 'image/*', '/docs/', '/');
		assert.equal(result.action, 'check-public');
	});

	it('returns check-public when accept header is undefined', () => {
		const result = evaluateBaseRewrite('/script.js', '/script.js', undefined, '/docs/', '/');
		assert.equal(result.action, 'check-public');
	});

	it('returns check-public for non-HTML accept types', () => {
		const result = evaluateBaseRewrite('/api/data', '/api/data', 'application/json', '/docs/', '/');
		assert.equal(result.action, 'check-public');
	});
});
// #endregion
