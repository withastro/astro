import * as assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { getAssetsPrefix } from '../../../dist/assets/utils/getAssetsPrefix.js';
import { etag } from '../../../dist/assets/utils/etag.js';
import { deterministicString } from '../../../dist/assets/utils/deterministic-string.js';
import { getOrigQueryParams } from '../../../dist/assets/utils/queryParams.js';
import { createPlaceholderURL, stringifyPlaceholderURL } from '../../../dist/assets/utils/url.js';
import { isESMImportedImage, isRemoteImage } from '../../../dist/assets/utils/imageKind.js';
import { dropAttributes } from '../../../dist/assets/runtime.js';

// #region getAssetsPrefix
describe('getAssetsPrefix', () => {
	it('returns empty string when no prefix configured', () => {
		assert.equal(getAssetsPrefix('.css', undefined), '');
	});

	it('returns the string prefix directly', () => {
		assert.equal(getAssetsPrefix('.css', 'https://cdn.example.com'), 'https://cdn.example.com');
	});

	it('returns per-type prefix for matching extension', () => {
		const prefix = {
			js: 'https://js.cdn.com',
			css: 'https://css.cdn.com',
			fallback: 'https://cdn.com',
		};
		assert.equal(getAssetsPrefix('.css', prefix), 'https://css.cdn.com');
		assert.equal(getAssetsPrefix('.js', prefix), 'https://js.cdn.com');
	});

	it('returns fallback for unknown extension', () => {
		const prefix = { js: 'https://js.cdn.com', fallback: 'https://cdn.com' };
		assert.equal(getAssetsPrefix('.webp', prefix), 'https://cdn.com');
	});

	it('strips leading dot from extension when looking up', () => {
		const prefix = { mjs: 'https://mjs.cdn.com', fallback: 'https://cdn.com' };
		assert.equal(getAssetsPrefix('.mjs', prefix), 'https://mjs.cdn.com');
	});
});
// #endregion

// #region etag
describe('etag', () => {
	it('returns a deterministic hash for the same input', () => {
		const a = etag('hello world');
		const b = etag('hello world');
		assert.equal(a, b);
	});

	it('returns different hashes for different inputs', () => {
		assert.notEqual(etag('hello'), etag('world'));
	});

	it('wraps in double quotes by default (strong etag)', () => {
		const result = etag('test');
		assert.ok(result.startsWith('"'));
		assert.ok(result.endsWith('"'));
	});

	it('wraps with W/ prefix for weak etags', () => {
		const result = etag('test', true);
		assert.ok(result.startsWith('W/"'));
		assert.ok(result.endsWith('"'));
	});

	it('produces different output for strong vs weak', () => {
		assert.notEqual(etag('test', false), etag('test', true));
	});
});
// #endregion

// #region deterministicString
describe('deterministicString', () => {
	it('orders object keys deterministically', () => {
		const a = deterministicString({ b: 2, a: 1 });
		const b = deterministicString({ a: 1, b: 2 });
		assert.equal(a, b);
	});

	it('handles nested objects', () => {
		const result = deterministicString({ outer: { z: 1, a: 2 } });
		assert.ok(result.includes('"a"'));
		assert.ok(result.includes('"z"'));
	});

	it('handles strings', () => {
		assert.equal(deterministicString('hello'), '"hello"');
	});

	it('handles numbers', () => {
		assert.equal(deterministicString(42), '42');
	});

	it('handles booleans', () => {
		assert.equal(deterministicString(true), 'true');
		assert.equal(deterministicString(false), 'false');
	});

	it('handles null and undefined', () => {
		assert.equal(deterministicString(null), 'null');
		assert.equal(deterministicString(undefined), 'undefined');
	});

	it('handles arrays', () => {
		const result = deterministicString([1, 'two', 3]);
		assert.ok(result.includes('Array'));
	});

	it('handles Date objects', () => {
		const d = new Date('2024-01-01T00:00:00Z');
		const result = deterministicString(d);
		assert.ok(result.includes('Date'));
		assert.ok(result.includes(String(d.getTime())));
	});

	it('handles Map', () => {
		const m = new Map<string, number>([
			['b', 2],
			['a', 1],
		]);
		const result = deterministicString(m);
		assert.ok(result.includes('Map'));
	});

	it('handles Set', () => {
		const s = new Set([3, 1, 2]);
		const result = deterministicString(s);
		assert.ok(result.includes('Set'));
	});

	it('handles RegExp', () => {
		const result = deterministicString(/foo/gi);
		assert.ok(result.includes('RegExp'));
		assert.ok(result.includes('foo'));
	});

	it('handles bigint', () => {
		assert.equal(deterministicString(BigInt(42)), '42n');
	});
});
// #endregion

// #region getOrigQueryParams
describe('getOrigQueryParams', () => {
	it('returns parsed width, height, format when all present', () => {
		const params = new URLSearchParams('origWidth=800&origHeight=600&origFormat=png');
		const result = getOrigQueryParams(params);
		assert.deepEqual(result, { width: 800, height: 600, format: 'png' });
	});

	it('returns undefined when width is missing', () => {
		const params = new URLSearchParams('origHeight=600&origFormat=png');
		assert.equal(getOrigQueryParams(params), undefined);
	});

	it('returns undefined when height is missing', () => {
		const params = new URLSearchParams('origWidth=800&origFormat=png');
		assert.equal(getOrigQueryParams(params), undefined);
	});

	it('returns undefined when format is missing', () => {
		const params = new URLSearchParams('origWidth=800&origHeight=600');
		assert.equal(getOrigQueryParams(params), undefined);
	});

	it('returns undefined for empty params', () => {
		assert.equal(getOrigQueryParams(new URLSearchParams()), undefined);
	});
});
// #endregion

// #region createPlaceholderURL / stringifyPlaceholderURL
describe('placeholder URL utilities', () => {
	it('createPlaceholderURL creates URL from relative path', () => {
		const url = createPlaceholderURL('/images/photo.jpg');
		assert.ok(url instanceof URL);
		assert.equal(url.pathname, '/images/photo.jpg');
	});

	it('createPlaceholderURL preserves query params', () => {
		const url = createPlaceholderURL('/img.jpg?w=100');
		assert.equal(url.searchParams.get('w'), '100');
	});

	it('stringifyPlaceholderURL removes placeholder base', () => {
		const url = createPlaceholderURL('/images/photo.jpg');
		const str = stringifyPlaceholderURL(url);
		assert.equal(str, '/images/photo.jpg');
		assert.ok(!str.includes('astro://'));
	});

	it('roundtrips path with query and hash', () => {
		const url = createPlaceholderURL('/img.jpg?w=100#frag');
		const str = stringifyPlaceholderURL(url);
		assert.equal(str, '/img.jpg?w=100#frag');
	});
});
// #endregion

// #region isESMImportedImage / isRemoteImage
describe('image kind detection', () => {
	it('isESMImportedImage returns true for objects', () => {
		assert.equal(
			isESMImportedImage({ src: '/img.jpg', width: 100, height: 100, format: 'jpg' }),
			true,
		);
	});

	it('isESMImportedImage returns false for strings', () => {
		assert.equal(isESMImportedImage('https://example.com/img.jpg'), false);
	});

	it('isRemoteImage returns true for strings', () => {
		assert.equal(isRemoteImage('https://example.com/img.jpg'), true);
	});

	it('isRemoteImage returns false for objects', () => {
		assert.equal(isRemoteImage({ src: '/img.jpg', width: 100, height: 100, format: 'jpg' }), false);
	});
});
// #endregion

// #region dropAttributes
describe('dropAttributes', () => {
	it('removes xmlns, xmlns:xlink, and version', () => {
		const attrs = {
			xmlns: 'http://www.w3.org/2000/svg',
			'xmlns:xlink': 'http://www.w3.org/1999/xlink',
			version: '1.1',
			viewBox: '0 0 100 100',
			fill: 'red',
		};
		const result = dropAttributes(attrs);
		assert.equal(result.xmlns, undefined);
		assert.equal(result['xmlns:xlink'], undefined);
		assert.equal(result.version, undefined);
	});

	it('preserves other attributes', () => {
		const attrs = {
			xmlns: 'http://www.w3.org/2000/svg',
			viewBox: '0 0 100 100',
			fill: 'red',
			class: 'icon',
		};
		const result = dropAttributes(attrs);
		assert.equal(result.viewBox, '0 0 100 100');
		assert.equal(result.fill, 'red');
		assert.equal(result.class, 'icon');
	});

	it('handles empty object', () => {
		const result = dropAttributes({});
		assert.deepEqual(result, {});
	});

	it('handles object without any droppable attributes', () => {
		const attrs = { viewBox: '0 0 50 50', fill: 'blue' };
		const result = dropAttributes(attrs);
		assert.deepEqual(result, { viewBox: '0 0 50 50', fill: 'blue' });
	});

	it('mutates and returns the same object', () => {
		const attrs = { xmlns: 'test', fill: 'red' };
		const result = dropAttributes(attrs);
		assert.equal(result, attrs);
	});
});
// #endregion
