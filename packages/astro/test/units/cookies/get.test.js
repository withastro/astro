import { expect } from 'chai';
import { AstroCookies } from '../../../dist/core/cookies/index.js';
import { apply as applyPolyfill } from '../../../dist/core/polyfill.js';

applyPolyfill();

describe('astro/src/core/cookies', () => {
	describe('Astro.cookies.get', () => {
		it('gets the cookie value', () => {
			const req = new Request('http://example.com/', {
				headers: {
					'cookie': 'foo=bar'
				}
			});
			const cookies = new AstroCookies(req);
			expect(cookies.get('foo').value).to.equal('bar');
		});

		describe('.json()', () => {
			it('returns a JavaScript object', () => {
				const req = new Request('http://example.com/', {
					headers: {
						'cookie': 'foo=%7B%22key%22%3A%22value%22%7D'
					}
				});
				let cookies = new AstroCookies(req);

				const json = cookies.get('foo').json();
				expect(json).to.be.an('object');
				expect(json.key).to.equal('value');
			});

			it('throws if the value is undefined', () => {
				const req = new Request('http://example.com/');
				let cookies = new AstroCookies(req);
				let cookie = cookies.get('foo');
				expect(() => cookie.json()).to.throw('Cannot convert undefined to an object.');
			});
		});

		describe('.number()', () => {
			it('Coerces into a number', () => {
				const req = new Request('http://example.com/', {
					headers: {
						'cookie': 'foo=22'
					}
				});
				let cookies = new AstroCookies(req);

				const value = cookies.get('foo').number();
				expect(value).to.be.an('number');
				expect(value).to.equal(22);
			});
		});
	});
});
