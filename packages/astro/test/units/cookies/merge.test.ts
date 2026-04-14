// @ts-check
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { AstroCookies } from '../../../dist/core/cookies/index.js';
import {
	attachCookiesToResponse,
	getSetCookiesFromResponse,
} from '../../../dist/core/cookies/response.js';

const req = () => new Request('http://example.com/');

describe('AstroCookies.merge()', () => {
	it('copies all cookies from source into an empty target', () => {
		const source = new AstroCookies(req());
		source.set('foo', 'bar');
		source.set('baz', 'qux');

		const target = new AstroCookies(req());
		target.merge(source);

		const headers = Array.from(target.headers());
		assert.equal(headers.length, 2);
		assert.ok(headers.some((h) => h.startsWith('foo=')));
		assert.ok(headers.some((h) => h.startsWith('baz=')));
	});

	it('overwrites same-key cookies in target', () => {
		const source = new AstroCookies(req());
		source.set('foo', 'new');

		const target = new AstroCookies(req());
		target.set('foo', 'old');
		target.merge(source);

		const headers = Array.from(target.headers());
		assert.equal(headers.length, 1);
		assert.ok(headers[0].startsWith('foo=new'));
	});

	it('preserves non-conflicting keys from target', () => {
		const source = new AstroCookies(req());
		source.set('a', '1');

		const target = new AstroCookies(req());
		target.set('b', '2');
		target.merge(source);

		const headers = Array.from(target.headers());
		assert.equal(headers.length, 2);
		assert.ok(headers.some((h) => h.startsWith('a=')));
		assert.ok(headers.some((h) => h.startsWith('b=')));
	});

	it('is a no-op when source has no outgoing cookies', () => {
		const source = new AstroCookies(req()); // no set() calls

		const target = new AstroCookies(req());
		target.set('foo', 'bar');
		target.merge(source);

		const headers = Array.from(target.headers());
		assert.equal(headers.length, 1);
		assert.ok(headers[0].startsWith('foo='));
	});
});

describe('AstroCookies.headers()', () => {
	it('yields nothing when no cookies have been set', () => {
		const cookies = new AstroCookies(req());
		const headers = Array.from(cookies.headers());
		assert.equal(headers.length, 0);
	});

	it('yields one header string per set cookie', () => {
		const cookies = new AstroCookies(req());
		cookies.set('a', '1');
		cookies.set('b', '2');
		cookies.set('c', '3');

		const headers = Array.from(cookies.headers());
		assert.equal(headers.length, 3);
	});
});

describe('attachCookiesToResponse + getSetCookiesFromResponse', () => {
	it('roundtrip: attached cookies are readable from the response', () => {
		const cookies = new AstroCookies(req());
		cookies.set('session', 'abc');
		cookies.set('theme', 'dark');

		const response = new Response(null);
		attachCookiesToResponse(response, cookies);

		const setCookies = Array.from(getSetCookiesFromResponse(response));
		assert.equal(setCookies.length, 2);
		assert.ok(setCookies.some((h) => h.startsWith('session=')));
		assert.ok(setCookies.some((h) => h.startsWith('theme=')));
	});

	it('getSetCookiesFromResponse returns empty when no cookies attached', () => {
		const response = new Response(null);
		const setCookies = Array.from(getSetCookiesFromResponse(response));
		assert.equal(setCookies.length, 0);
	});
});
