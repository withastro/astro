import * as assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { AstroCookies } from '../../../dist/core/cookies/index.js';
import { apply as applyPolyfill } from '../../../dist/core/polyfill.js';

applyPolyfill();

describe('astro/src/core/cookies', () => {
	describe('Astro.cookies.delete', () => {
		it('creates a Set-Cookie header to delete it', () => {
			let req = new Request('http://example.com/', {
				headers: {
					cookie: 'foo=bar',
				},
			});
			let cookies = new AstroCookies(req);
			assert.equal(cookies.get('foo').value, 'bar');

			cookies.delete('foo');
			let headers = Array.from(cookies.headers());
			assert.equal(headers.length, 1);
		});

		it('calling cookies.get() after returns undefined', () => {
			let req = new Request('http://example.com/', {
				headers: {
					cookie: 'foo=bar',
				},
			});
			let cookies = new AstroCookies(req);
			assert.equal(cookies.get('foo').value, 'bar');

			cookies.delete('foo');
			assert.equal(cookies.get('foo'), undefined);
		});

		it('calling cookies.has() after returns false', () => {
			let req = new Request('http://example.com/', {
				headers: {
					cookie: 'foo=bar',
				},
			});
			let cookies = new AstroCookies(req);
			assert.equal(cookies.has('foo'), true);

			cookies.delete('foo');
			assert.equal(cookies.has('foo'), false);
		});

		it('can provide a path', () => {
			let req = new Request('http://example.com/');
			let cookies = new AstroCookies(req);
			cookies.delete('foo', {
				path: '/subpath/',
			});
			let headers = Array.from(cookies.headers());
			assert.equal(headers.length, 1);
			assert.equal(/Path=\/subpath\//.test(headers[0]), true);
		});

		it('can provide a domain', () => {
			let req = new Request('http://example.com/');
			let cookies = new AstroCookies(req);
			cookies.delete('foo', {
				domain: '.example.com',
			});
			let headers = Array.from(cookies.headers());
			assert.equal(headers.length, 1);
			assert.equal(/Domain=\.example\.com/.test(headers[0]), true);
		});
	});
});
