import { loadFixture } from '@astrojs/test-utils';
import { expect } from 'chai';

describe('Cookies', () => {
	let fixture;

	before(async () => {
		fixture = await loadFixture({ root: new URL('./fixtures/cookies/', import.meta.url) });
		await fixture.build();
	});

	it('Can set multiple', async () => {
		const entryURL = new URL(
			'./fixtures/cookies/.netlify/functions-internal/ssr/ssr.mjs',
			import.meta.url
		);
		const { default: handler } = await import(entryURL);
		const resp = await handler(
			new Request('http://example.com/login', { method: 'POST', body: '{}' }),
			{}
		);
		expect(resp.status).to.equal(301);
		expect(resp.headers.get('location')).to.equal('/');
		expect(resp.headers.getSetCookie()).to.eql(['foo=foo; HttpOnly', 'bar=bar; HttpOnly']);
	});

	it("renders dynamic 404 page", async () => {
		const entryURL = new URL(
			'./fixtures/cookies/.netlify/functions-internal/ssr/ssr.mjs',
			import.meta.url
		);
		const { default: handler } = await import(entryURL);
		const resp = await handler(
			new Request('http://example.com/nonexistant-page', {
				headers: {
					"x-test": "bar"
				}
			}),
			{}
		);
		expect(resp.status).to.equal(404);
		const text = await resp.text()
		expect(text).to.contain("This is my custom 404 page");
		expect(text).to.contain("x-test: bar");
	})
});
