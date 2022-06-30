import { isWindows, loadFixture } from './test-utils.js';
import { expect } from 'chai';
import testAdapter from './test-adapter.js';
import * as cheerio from 'cheerio';

describe('Streaming', () => {
	if (isWindows) return;

	/** @type {import('./test-utils').Fixture} */
	let fixture;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/streaming/',
			adapter: testAdapter(),
			experimental: {
				ssr: true,
			},
		});
	});

	describe('Development', () => {
		/** @type {import('./test-utils').DevServer} */
		let devServer;

		before(async () => {
			devServer = await fixture.startDevServer();
		});

		after(async () => {
			await devServer.stop();
		});

		it('Body is chunked', async () => {
			let res = await fixture.fetch('/');
			let chunks = [];
			for await (const bytes of res.body) {
				let chunk = bytes.toString('utf-8');
				chunks.push(chunk);
			}
			expect(chunks.length).to.be.greaterThan(1);
		});
	});

	describe('Production', () => {
		before(async () => {
			await fixture.build();
		});

		it('Can get the full html body', async () => {
			const app = await fixture.loadTestAdapterApp();
			const request = new Request('http://example.com/');
			const response = await app.render(request);
			const html = await response.text();
			const $ = cheerio.load(html);
			expect($('header h1')).to.have.a.lengthOf(1);
			expect($('ul li')).to.have.a.lengthOf(10);
		});

		it('Body is chunked', async () => {
			const app = await fixture.loadTestAdapterApp();
			const request = new Request('http://example.com/');
			const response = await app.render(request);
			let chunks = [];
			let decoder = new TextDecoder();
			for await (const bytes of response.body) {
				let chunk = decoder.decode(bytes);
				chunks.push(chunk);
			}
			expect(chunks.length).to.be.greaterThan(1);
		});
	});
});

describe('Streaming disabled', () => {
	if (isWindows) return;

	/** @type {import('./test-utils').Fixture} */
	let fixture;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/streaming/',
			adapter: testAdapter(),
			experimental: {
				ssr: true,
			},
			server: {
				streaming: false,
			}
		});
	});

	describe('Development', () => {
		/** @type {import('./test-utils').DevServer} */
		let devServer;

		before(async () => {
			devServer = await fixture.startDevServer();
		});

		after(async () => {
			await devServer.stop();
		});

		it('Body is chunked', async () => {
			let res = await fixture.fetch('/');
			let chunks = [];
			for await (const bytes of res.body) {
				let chunk = bytes.toString('utf-8');
				chunks.push(chunk);
			}
			expect(chunks.length).to.be.greaterThan(1);
		});
	});

	// TODO: find a different solution for the test-adapter,
	// currently there's no way to resolve two different versions with one
	// having streaming disabled
	describe('Production', () => {
		before(async () => {
			await fixture.build();
		});

		it('Can get the full html body', async () => {
			const app = await fixture.loadTestAdapterApp(false);
			const request = new Request('http://example.com/');
			const response = await app.render(request);

			expect(response.status).to.equal(200);
			expect(response.headers.get('content-type')).to.equal('text/html');
			expect(response.headers.has('content-length')).to.equal(true);
			expect(parseInt(response.headers.get('content-length'))).to.be.greaterThan(0);

			const html = await response.text();
			const $ = cheerio.load(html);

			expect($('header h1')).to.have.a.lengthOf(1);
			expect($('ul li')).to.have.a.lengthOf(10);
		});
	});
});
