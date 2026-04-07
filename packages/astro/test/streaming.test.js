import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import * as cheerio from 'cheerio';
import testAdapter from './test-adapter.js';
import { loadFixture, streamAsyncIterator } from './test-utils.js';

describe('Streaming', () => {
	/** @type {import('./test-utils').Fixture} */
	let fixture;

	let decoder = new TextDecoder();

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/streaming/',
			adapter: testAdapter(),
			output: 'server',
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
			for await (const bytes of streamAsyncIterator(res.body)) {
				let chunk = decoder.decode(bytes);
				chunks.push(chunk);
			}
			assert.equal(chunks.length > 5, true);
		});

		it('Body of slots is chunked', async () => {
			let res = await fixture.fetch('/slot');
			let chunks = [];
			for await (const bytes of streamAsyncIterator(res.body)) {
				let chunk = decoder.decode(bytes);
				chunks.push(chunk);
			}
			assert.ok(chunks.length >= 2);
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
			assert.equal($('header h1').length, 1);
			assert.equal($('ul li').length, 10);
		});

		it('Body is chunked', async () => {
			const app = await fixture.loadTestAdapterApp();
			const request = new Request('http://example.com/');
			const response = await app.render(request);
			let chunks = [];
			for await (const bytes of streamAsyncIterator(response.body)) {
				let chunk = decoder.decode(bytes);
				chunks.push(chunk);
			}
			assert.equal(chunks.length > 1, true);
		});

		// if the offshoot promise goes unhandled, this test will pass immediately but fail the test suite
		it('Stays alive on failed component renders initiated by failed render templates', async () => {
			const app = await fixture.loadTestAdapterApp();
			const request = new Request('http://example.com/multiple-errors');
			const response = await app.render(request);
			assert.equal(response.status, 500);
			const text = await response.text();
			assert.equal(text, '');
		});
	});
});

describe('Fragment streaming (issue #13283)', () => {
	/** @type {import('./test-utils').Fixture} */
	let fixture;
	const decoder = new TextDecoder();

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/streaming/',
			adapter: testAdapter(),
			output: 'server',
		});
		await fixture.build();
	});

	it('sync sibling inside Fragment streams before async child resolves', async () => {
		const app = await fixture.loadTestAdapterApp();
		const request = new Request('http://example.com/fragment-streaming');
		const response = await app.render(request);

		// Collect chunks in arrival order
		const chunks = [];
		for await (const bytes of streamAsyncIterator(response.body)) {
			chunks.push(decoder.decode(bytes));
		}

		const combined = chunks.join('');

		// Both elements must be present in the final output
		assert.ok(combined.includes('sync-in-fragment'), 'sync sibling inside Fragment is present');
		assert.ok(combined.includes('async-in-fragment'), 'async child inside Fragment is present');

		// The sync sibling must appear before the async child in the stream
		assert.ok(
			combined.indexOf('sync-in-fragment') < combined.indexOf('async-in-fragment'),
			'sync sibling appears before async child in output',
		);

		// Verify the fix: sync content inside Fragment should arrive in an earlier
		// chunk than async content, just like bare template expressions do.
		const syncChunkIndex = chunks.findIndex((c) => c.includes('sync-in-fragment'));
		const asyncChunkIndex = chunks.findIndex((c) => c.includes('async-in-fragment'));
		assert.ok(syncChunkIndex !== -1, 'sync-in-fragment found in chunks');
		assert.ok(asyncChunkIndex !== -1, 'async-in-fragment found in chunks');
		assert.ok(
			syncChunkIndex < asyncChunkIndex,
			`sync content (chunk ${syncChunkIndex}) should stream before async content (chunk ${asyncChunkIndex})`,
		);
	});

	it('final HTML contains all Fragment content in correct order', async () => {
		const app = await fixture.loadTestAdapterApp();
		const request = new Request('http://example.com/fragment-streaming');
		const response = await app.render(request);
		const html = await response.text();
		const $ = cheerio.load(html);

		assert.equal($('#sync-in-fragment').length, 1, 'sync sibling renders');
		assert.equal($('#async-in-fragment').length, 1, 'async child renders');
		// Verify document order is preserved
		const syncPos = html.indexOf('sync-in-fragment');
		const asyncPos = html.indexOf('async-in-fragment');
		assert.ok(syncPos < asyncPos, 'sync appears before async in final HTML');
	});
});

describe('Streaming disabled', () => {
	/** @type {import('./test-utils').Fixture} */
	let fixture;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/streaming/',
			adapter: testAdapter(),
			output: 'server',
			server: {
				streaming: false,
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
			for await (const bytes of streamAsyncIterator(res.body)) {
				let chunk = bytes.toString('utf-8');
				chunks.push(chunk);
			}
			assert.equal(chunks.length > 1, true);
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

			assert.equal(response.status, 200);
			assert.equal(response.headers.get('content-type'), 'text/html');
			assert.equal(response.headers.has('content-length'), true);
			assert.equal(Number.parseInt(response.headers.get('content-length')) > 0, true);

			const html = await response.text();
			const $ = cheerio.load(html);

			assert.equal($('header h1').length, 1);
			assert.equal($('ul li').length, 10);
		});
	});
});
