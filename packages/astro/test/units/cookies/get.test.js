import { expect } from 'chai';
import { AstroCookies } from '../../../dist/core/cookies/index.js';
import { apply as applyPolyfill } from '../../../dist/core/polyfill.js';

applyPolyfill();

describe('astro/src/core/cookies', () => {
	describe('Astro.cookies.get', () => {
		it('gets the cookie value', () => {
			const req = new Request('http://example.com/', {
				headers: {
					cookie: 'foo=bar',
				},
			});
			const cookies = new AstroCookies(req);
			expect(cookies.get('foo').value).to.equal('bar');
		});

		it("Returns undefined is the value doesn't exist", () => {
			const req = new Request('http://example.com/');
			let cookies = new AstroCookies(req);
			let cookie = cookies.get('foo');
			expect(cookie).to.equal(undefined);
		});

		describe('.json()', () => {
			it('returns a JavaScript object', () => {
				const req = new Request('http://example.com/', {
					headers: {
						cookie: 'foo=%7B%22key%22%3A%22value%22%7D',
					},
				});
				let cookies = new AstroCookies(req);

				const json = cookies.get('foo').json();
				expect(json).to.be.an('object');
				expect(json.key).to.equal('value');
			});
		});

		describe('.number()', () => {
			it('Coerces into a number', () => {
				const req = new Request('http://example.com/', {
					headers: {
						cookie: 'foo=22',
					},
				});
				let cookies = new AstroCookies(req);

				const value = cookies.get('foo').number();
				expect(value).to.be.an('number');
				expect(value).to.equal(22);
			});

			it('Coerces non-number into NaN', () => {
				const req = new Request('http://example.com/', {
					headers: {
						cookie: 'foo=bar',
					},
				});
				let cookies = new AstroCookies(req);

				const value = cookies.get('foo').number();
				expect(value).to.be.an('number');
				expect(Number.isNaN(value)).to.equal(true);
			});
		});

		describe('.boolean()', () => {
			it('Coerces true into `true`', () => {
				const req = new Request('http://example.com/', {
					headers: {
						cookie: 'foo=true',
					},
				});
				let cookies = new AstroCookies(req);

				const value = cookies.get('foo').boolean();
				expect(value).to.be.an('boolean');
				expect(value).to.equal(true);
			});

			it('Coerces false into `false`', () => {
				const req = new Request('http://example.com/', {
					headers: {
						cookie: 'foo=false',
					},
				});
				let cookies = new AstroCookies(req);

				const value = cookies.get('foo').boolean();
				expect(value).to.be.an('boolean');
				expect(value).to.equal(false);
			});

			it('Coerces 1 into `true`', () => {
				const req = new Request('http://example.com/', {
					headers: {
						cookie: 'foo=1',
					},
				});
				let cookies = new AstroCookies(req);

				const value = cookies.get('foo').boolean();
				expect(value).to.be.an('boolean');
				expect(value).to.equal(true);
			});

			it('Coerces 0 into `false`', () => {
				const req = new Request('http://example.com/', {
					headers: {
						cookie: 'foo=0',
					},
				});
				let cookies = new AstroCookies(req);

				const value = cookies.get('foo').boolean();
				expect(value).to.be.an('boolean');
				expect(value).to.equal(false);
			});

			it('Coerces truthy strings into `true`', () => {
				const req = new Request('http://example.com/', {
					headers: {
						cookie: 'foo=bar',
					},
				});
				let cookies = new AstroCookies(req);

				const value = cookies.get('foo').boolean();
				expect(value).to.be.an('boolean');
				expect(value).to.equal(true);
			});
		});
	});
});
