import { expect } from 'chai';
import { AstroCookies } from '../../../dist/core/cookies/index.js';
import { apply as applyPolyfill } from '../../../dist/core/polyfill.js';

applyPolyfill();

describe('astro/src/core/cookies', () => {
	describe('Astro.cookies.delete', () => {
		it('creates a Set-Cookie header to delete it', () => {
			let req = new Request('http://example.com/', {
				headers: {
					'cookie': 'foo=bar'
				}
			});
			let cookies = new AstroCookies(req);
			expect(cookies.get('foo').value).to.equal('bar');

			cookies.delete('foo');
			let headers = Array.from(cookies.headers());
			expect(headers).to.have.a.lengthOf(1);
		});

		it('calling cookies.get() after returns undefined', () => {
			let req = new Request('http://example.com/', {
				headers: {
					'cookie': 'foo=bar'
				}
			});
			let cookies = new AstroCookies(req);
			expect(cookies.get('foo').value).to.equal('bar');

			cookies.delete('foo');
			expect(cookies.get('foo').value).to.equal(undefined);
		});

		it('calling cookies.has() after returns false', () => {
			let req = new Request('http://example.com/', {
				headers: {
					'cookie': 'foo=bar'
				}
			});
			let cookies = new AstroCookies(req);
			expect(cookies.has('foo')).to.equal(true);

			cookies.delete('foo');
			expect(cookies.has('foo')).to.equal(false);
		});

		it('can provide a path', () => {
			let req = new Request('http://example.com/');
			let cookies = new AstroCookies(req);
			cookies.delete('foo', {
				path: '/subpath/'
			});
			let headers = Array.from(cookies.headers());
			expect(headers).to.have.a.lengthOf(1);
			expect(headers[0]).to.match(/Path=\/subpath\//);
		});
	});
});
