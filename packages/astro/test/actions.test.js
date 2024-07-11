import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import * as cheerio from 'cheerio';
import testAdapter from './test-adapter.js';
import { loadFixture } from './test-utils.js';

describe('Astro Actions', () => {
	let fixture;
	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/actions/',
			adapter: testAdapter(),
			experimental: {
				rewriting: true,
			},
		});
	});

	describe('dev', () => {
		let devServer;

		before(async () => {
			devServer = await fixture.startDevServer();
		});

		after(async () => {
			await devServer.stop();
		});

		it('Exposes subscribe action', async () => {
			const res = await fixture.fetch('/_actions/subscribe', {
				method: 'POST',
				body: JSON.stringify({ channel: 'bholmesdev' }),
				headers: {
					'Content-Type': 'application/json',
				},
			});

			assert.equal(res.ok, true);
			assert.equal(res.headers.get('Content-Type'), 'application/json');

			const json = await res.json();
			assert.equal(json.channel, 'bholmesdev');
			assert.equal(json.subscribeButtonState, 'smashed');
		});

		it('Exposes comment action', async () => {
			const formData = new FormData();
			formData.append('channel', 'bholmesdev');
			formData.append('comment', 'Hello, World!');
			const res = await fixture.fetch('/_actions/comment', {
				method: 'POST',
				body: formData,
			});

			assert.equal(res.ok, true);
			assert.equal(res.headers.get('Content-Type'), 'application/json');

			const json = await res.json();
			assert.equal(json.channel, 'bholmesdev');
			assert.equal(json.comment, 'Hello, World!');
		});

		it('Raises validation error on bad form data', async () => {
			const formData = new FormData();
			formData.append('channel', 'bholmesdev');
			const res = await fixture.fetch('/_actions/comment', {
				method: 'POST',
				body: formData,
			});

			assert.equal(res.ok, false);
			assert.equal(res.status, 400);
			assert.equal(res.headers.get('Content-Type'), 'application/json');

			const json = await res.json();
			assert.equal(json.type, 'AstroActionInputError');
		});

		it('Exposes plain formData action', async () => {
			const formData = new FormData();
			formData.append('channel', 'bholmesdev');
			formData.append('comment', 'Hello, World!');
			const res = await fixture.fetch('/_actions/commentPlainFormData', {
				method: 'POST',
				body: formData,
			});

			assert.equal(res.ok, true);
			assert.equal(res.headers.get('Content-Type'), 'application/json');

			const json = await res.json();
			assert.equal(json.success, true);
			assert.equal(json.isFormData, true, 'Should receive plain FormData');
		});
	});

	describe('build', () => {
		let app;

		before(async () => {
			await fixture.build();
			app = await fixture.loadTestAdapterApp();
		});

		it('Exposes subscribe action', async () => {
			const req = new Request('http://example.com/_actions/subscribe', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ channel: 'bholmesdev' }),
			});
			const res = await app.render(req);

			assert.equal(res.ok, true);
			assert.equal(res.headers.get('Content-Type'), 'application/json');

			const json = await res.json();
			assert.equal(json.channel, 'bholmesdev');
			assert.equal(json.subscribeButtonState, 'smashed');
		});

		it('Exposes comment action', async () => {
			const formData = new FormData();
			formData.append('channel', 'bholmesdev');
			formData.append('comment', 'Hello, World!');
			const req = new Request('http://example.com/_actions/comment', {
				method: 'POST',
				body: formData,
			});
			const res = await app.render(req);

			assert.equal(res.ok, true);
			assert.equal(res.headers.get('Content-Type'), 'application/json');

			const json = await res.json();
			assert.equal(json.channel, 'bholmesdev');
			assert.equal(json.comment, 'Hello, World!');
		});

		it('Raises validation error on bad form data', async () => {
			const formData = new FormData();
			formData.append('channel', 'bholmesdev');
			const req = new Request('http://example.com/_actions/comment', {
				method: 'POST',
				body: formData,
			});
			const res = await app.render(req);

			assert.equal(res.ok, false);
			assert.equal(res.status, 400);
			assert.equal(res.headers.get('Content-Type'), 'application/json');

			const json = await res.json();
			assert.equal(json.type, 'AstroActionInputError');
		});

		it('Exposes plain formData action', async () => {
			const formData = new FormData();
			formData.append('channel', 'bholmesdev');
			formData.append('comment', 'Hello, World!');
			const req = new Request('http://example.com/_actions/commentPlainFormData', {
				method: 'POST',
				body: formData,
			});
			const res = await app.render(req);

			assert.equal(res.ok, true);
			assert.equal(res.headers.get('Content-Type'), 'application/json');

			const json = await res.json();
			assert.equal(json.success, true);
			assert.equal(json.isFormData, true, 'Should receive plain FormData');
		});

		it('Respects user middleware', async () => {
			const formData = new FormData();
			const url = new URL('http://example.com/user');
			url.searchParams.set('__action', 'getUser');
			const req = new Request(url, {
				method: 'POST',
				body: formData,
			});
			const expectedRedirect = await app.render(req);
			assert.equal(expectedRedirect.status, 302);
			const res = await app.render(new Request(expectedRedirect.headers.get('Location')));
			assert.equal(res.ok, true);

			const html = await res.text();
			console.log('###html', html);
			let $ = cheerio.load(html);
			assert.equal($('#user').text(), 'Houston');
		});

		it('Respects user middleware - deprecated getActionProps', async () => {
			const formData = new FormData();
			formData.append('__action', 'getUser');
			const req = new Request('http://example.com/user', {
				method: 'POST',
				body: formData,
			});
			const res = await app.render(req);
			assert.equal(res.ok, true);

			const html = await res.text();
			let $ = cheerio.load(html);
			assert.equal($('#user').text(), 'Houston');
		});

		it('Respects custom errors', async () => {
			const url = new URL('http://example.com/user-or-throw');
			url.searchParams.set('__action', 'getUserOrThrow');
			const req = new Request(url, {
				method: 'POST',
				body: new FormData(),
				redirect: 'follow',
			});
			const expectedRedirect = await app.render(req);
			assert.equal(expectedRedirect.status, 302);
			const res = await app.render(new Request(expectedRedirect.headers.get('Location')));
			assert.equal(res.ok, false);
			assert.equal(res.status, 401);

			const html = await res.text();
			let $ = cheerio.load(html);
			assert.equal($('#error-message').text(), 'Not logged in');
			assert.equal($('#error-code').text(), 'UNAUTHORIZED');
		});

		it('Respects custom errors - deprecated getActionProps', async () => {
			const formData = new FormData();
			formData.append('__action', 'getUserOrThrow');
			const req = new Request('http://example.com/user-or-throw', {
				method: 'POST',
				body: formData,
			});
			const res = await app.render(req);
			assert.equal(res.ok, false);
			assert.equal(res.status, 401);

			const html = await res.text();
			let $ = cheerio.load(html);
			assert.equal($('#error-message').text(), 'Not logged in');
			assert.equal($('#error-code').text(), 'UNAUTHORIZED');
		});

		it('Sets status to 204 when no content', async () => {
			const req = new Request('http://example.com/_actions/fireAndForget', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Content-Length': '0',
				},
			});
			const res = await app.render(req);
			assert.equal(res.status, 204);
		});

		it('Is callable from the server with rewrite', async () => {
			const req = new Request('http://example.com/rewrite');
			const res = await app.render(req);
			assert.equal(res.ok, true);

			const html = await res.text();
			let $ = cheerio.load(html);
			assert.equal($('[data-url]').text(), '/subscribe');
			assert.equal($('[data-channel]').text(), 'bholmesdev');
		});
	});
});
