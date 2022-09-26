import { expect } from 'chai';
import { AstroCookies } from '../../../dist/core/cookies/index.js';
import { apply as applyPolyfill } from '../../../dist/core/polyfill.js';

applyPolyfill();

describe('astro/src/core/cookies', () => {
	describe('Astro.cookies.set', () => {
		it('Sets a cookie value that can be serialized', () => {
			let req = new Request('http://example.com/');
			let cookies = new AstroCookies(req);
			cookies.set('foo', 'bar');
			let headers = Array.from(cookies.headers());
			expect(headers).to.have.a.lengthOf(1);
			expect(headers[0]).to.equal('foo=bar');
		});

		it('Can set cookie options', () => {
			let req = new Request('http://example.com/');
			let cookies = new AstroCookies(req);
			cookies.set('foo', 'bar', {
				httpOnly: true,
				path: '/subpath/'
			});
			let headers = Array.from(cookies.headers());
			expect(headers).to.have.a.lengthOf(1);
			expect(headers[0]).to.equal('foo=bar; Path=/subpath/; HttpOnly');
		});

		it('Can pass a JavaScript object that will be serialized', () => {
			let req = new Request('http://example.com/');
			let cookies = new AstroCookies(req);
			cookies.set('options', { one: 'two', three: 4 });
			let headers = Array.from(cookies.headers());
			expect(headers).to.have.a.lengthOf(1);
			expect(JSON.parse(decodeURIComponent(headers[0].slice(8))).one).to.equal('two');
		});

		it('Can pass a number', () => {
			let req = new Request('http://example.com/');
			let cookies = new AstroCookies(req);
			cookies.set('one', 2);
			let headers = Array.from(cookies.headers());
			expect(headers).to.have.a.lengthOf(1);
			expect(headers[0]).to.equal('one=2');
		});

		it('can pass a string distance from now as expires', () => {
			let req = new Request('http://example.com/');
			let cookies = new AstroCookies(req);
			cookies.set('one', 2, {
				expires: '1 week'
			});
			let headers = Array.from(cookies.headers());
			expect(headers).to.have.a.lengthOf(1);
			expect(headers[0]).to.match(/one=2/);
			expect(headers[0]).to.match(/Expires/);
		});

		it('can pass a date as a number to expires', () => {
			let req = new Request('http://example.com/');
			let expiration = new Date('Fri, 01 Jan 2044 00:00:00 GMT');
			let cookies = new AstroCookies(req);
			cookies.set('one', 2, {
				expires: expiration.valueOf()
			});
			let headers = Array.from(cookies.headers());
			expect(headers).to.have.a.lengthOf(1);
			expect(headers[0]).to.equal('one=2; Expires=Fri, 01 Jan 2044 00:00:00 GMT');
		});

		it('throws if passing a string to expires that ms does not convert', () => {
			let req = new Request('http://example.com/');
			let cookies = new AstroCookies(req);
			expect(() => {
				cookies.set('one', 2, {
					expires: 'unknown date'
				});
			}).to.throw(`Unable to convert expires expression [unknown date]`);
		});

		it('Can get the value after setting', () => {
			let req = new Request('http://example.com/');
			let cookies = new AstroCookies(req);
			cookies.set('foo', 'bar');
			let r = cookies.get('foo');
			expect(r.value).to.equal('bar');
		});

		it('Can get the JavaScript object after setting', () => {
			let req = new Request('http://example.com/');
			let cookies = new AstroCookies(req);
			cookies.set('options', { one: 'two', three: 4 });
			let cook = cookies.get('options');
			let value = cook.json();
			expect(value).to.be.an('object');
			expect(value.one).to.equal('two');
			expect(value.three).to.be.a('number');
			expect(value.three).to.equal(4);
		});

		it('Overrides a value in the request', () => {
			let req = new Request('http://example.com/', {
				headers: {
					'cookie': 'foo=bar'
				}
			});
			let cookies = new AstroCookies(req);
			expect(cookies.get('foo').value).to.equal('bar');
			
			// Set a new value
			cookies.set('foo', 'baz');
			expect(cookies.get('foo').value).to.equal('baz');
		});
	});
});
