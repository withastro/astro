import { expect } from 'chai';
import { AstroCookies } from '../../../dist/core/cookies/index.js';
import { apply as applyPolyfill } from '../../../dist/core/polyfill.js';

applyPolyfill();

describe('astro/src/core/cookies', () => {
	describe('Astro.cookies.has', () => {
		it('returns true if the request has the cookie', () => {
			let req = new Request('http://example.com/', {
				headers: {
					'cookie': 'foo=bar'
				}
			});
			let cookies = new AstroCookies(req);
			expect(cookies.has('foo')).to.equal(true);
		});

		it('returns false if the request does not have the cookie', () => {
			let req = new Request('http://example.com/');
			let cookies = new AstroCookies(req);
			expect(cookies.has('foo')).to.equal(false);
		});

		it('returns true if the cookie has been set', () => {
			let req = new Request('http://example.com/');
			let cookies = new AstroCookies(req);
			cookies.set('foo', 'bar');
			expect(cookies.has('foo')).to.equal(true);
		});
	});
});
