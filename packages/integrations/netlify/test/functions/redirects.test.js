import { createServer } from 'http';
import { loadFixture } from '@astrojs/test-utils';
import { expect } from 'chai';

describe('SSR - Redirects', () => {
	let fixture;

	before(async () => {
		fixture = await loadFixture({ root: new URL('./fixtures/redirects/', import.meta.url) });
		await fixture.build();
	});

	it('Creates a redirects file', async () => {
		const redirects = await fixture.readFile('./_redirects');
		const parts = redirects.split(/\s+/);
		expect(parts).to.deep.equal(['', '/other', '/', '301', '']);
		expect(redirects).to.matchSnapshot();
	});

	it('Does not create .html files', async () => {
		let hasErrored = false;
		try {
			await fixture.readFile('/other/index.html');
		} catch {
			hasErrored = true;
		}
		expect(hasErrored).to.equal(true, 'this file should not exist');
	});

	it('renders static 404 page', async () => {
		const entryURL = new URL(
			'./fixtures/redirects/.netlify/functions-internal/ssr/ssr.mjs',
			import.meta.url
		);
		const { default: handler } = await import(entryURL);
		const resp = await handler(new Request('http://example.com/nonexistant-page'), {});
		expect(resp.status).to.equal(404);
		expect(resp.headers.get("content-type")).to.equal("text/html; charset=utf-8")
		const text = await resp.text();
		expect(text).to.contain('This is my static 404 page');
	});

	it('does not pass through 404 request', async () => {
		let testServerCalls = 0;
		const testServer = createServer((req, res) => {
			testServerCalls++;
			res.writeHead(200);
			res.end();
		});
		testServer.listen(5678);
		const entryURL = new URL(
			'./fixtures/redirects/.netlify/functions-internal/ssr/ssr.mjs',
			import.meta.url
		);
		const { default: handler } = await import(entryURL);
		const resp = await handler(new Request('http://localhost:5678/nonexistant-page'), {});
		expect(resp.status).to.equal(404);
		expect(testServerCalls).to.equal(0);
		testServer.close();
	});
});
