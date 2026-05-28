import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import * as cheerio from 'cheerio';
import * as devalue from 'devalue';
import { serializeActionResult } from '../dist/actions/runtime/server.js';
import { REDIRECT_STATUS_CODES } from '../dist/core/constants.js';
import testAdapter from './test-adapter.ts';
import { type App, type DevServer, type Fixture, loadFixture } from './test-utils.ts';

describe('Astro Actions', () => {
	let fixture: Fixture;
	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/actions/',
			adapter: testAdapter(),
			outDir: './dist/actions-astro-actions/',
		});
	});

	describe('dev', () => {
		let devServer: DevServer;

		before(async () => {
			devServer = await fixture.startDevServer();
		});

		after(async () => {
			await devServer.stop();
		});

		it('Does not process middleware cookie for prerendered routes', async () => {
			const cookie = new URLSearchParams();
			cookie.append(
				'_astroActionPayload',
				JSON.stringify({
					actionName: 'subscribe',
					actionResult: serializeActionResult({
						data: { channel: 'bholmesdev', subscribeButtonState: 'smashed' },
						error: undefined,
					}),
				}),
			);
			const res = await fixture.fetch('/subscribe-prerendered', {
				headers: {
					Cookie: cookie.toString(),
				},
			});
			const html = await res.text();
			const $ = cheerio.load(html);
			assert.equal($('body').text().trim(), 'No cookie found.');
		});
	});

	describe('build', () => {
		let app: App;

		before(async () => {
			await fixture.build();
			app = await fixture.loadTestAdapterApp();
		});

		it('Should fail when calling an action without using Astro.callAction', async () => {
			const req = new Request('http://example.com/invalid');
			const res = await app.render(req);
			assert.equal(res.status, 500);
		});

		it('Response middleware fallback - POST', async () => {
			const req = new Request('http://example.com/user?_action=getUser', {
				method: 'POST',
				body: new FormData(),
				headers: {
					Referer: 'http://example.com/user',
				},
			});
			const res = await app.render(req);
			assert.equal(res.ok, true);

			const html = await res.text();
			let $ = cheerio.load(html);
			assert.equal($('#user').text(), 'Houston');
		});

		it('Response middleware fallback - cookie forwarding', async () => {
			const req = new Request(
				'http://example.com/user?_action=getUser&actionCookieForwarding=true',
				{
					method: 'POST',
					body: new FormData(),
					headers: {
						Referer: 'http://example.com/user',
					},
				},
			);
			const res = await followExpectedRedirect(req, app);
			assert.equal(res.ok, true);

			const html = await res.text();
			let $ = cheerio.load(html);
			assert.equal($('#user').text(), 'Houston');
		});

		it('Respects custom errors - POST', async () => {
			const req = new Request('http://example.com/user-or-throw?_action=getUserOrThrow', {
				method: 'POST',
				body: new FormData(),
				headers: {
					Referer: 'http://example.com/user-or-throw',
				},
			});
			const res = await app.render(req);
			assert.equal(res.status, 401);

			const html = await res.text();
			let $ = cheerio.load(html);
			assert.equal($('#error-message').text(), 'Not logged in');
			assert.equal($('#error-code').text(), 'UNAUTHORIZED');
		});

		it('Respects custom errors - cookie forwarding', async () => {
			const req = new Request(
				'http://example.com/user-or-throw?_action=getUserOrThrow&actionCookieForwarding=true',
				{
					method: 'POST',
					body: new FormData(),
					headers: {
						Referer: 'http://example.com/user-or-throw',
					},
				},
			);
			const res = await followExpectedRedirect(req, app);
			assert.equal(res.status, 401);

			const html = await res.text();
			let $ = cheerio.load(html);
			assert.equal($('#error-message').text(), 'Not logged in');
			assert.equal($('#error-code').text(), 'UNAUTHORIZED');
		});

		it('Ignores action name for GET requests', async () => {
			const req = new Request('http://example.com/user-or-throw?_action=getUserOrThrow', {
				method: 'GET',
			});
			const res = await app.render(req);
			assert.equal(res.ok, true);

			const html = await res.text();
			let $ = cheerio.load(html);
			assert.ok($('#user'));
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

describe('Astro Actions in static mode with prerender = false routes', () => {
	let fixture: Fixture;
	let devServer: DevServer;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/actions-static-prerender-false/',
			outDir: './dist/actions-astro-actions-in-static-mode-with-preren/',
		});
		devServer = await fixture.startDevServer();
	});

	after(async () => {
		await devServer?.stop();
	});

	it('starts in dev and exposes action RPC routes', async () => {
		assert.ok(devServer, 'Expected dev server to start');

		const res = await fixture.fetch('/_actions/ping', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: '{}',
		});

		assert.equal(res.ok, true);
		assert.equal(res.headers.get('Content-Type'), 'application/json+devalue');

		const data = devalue.parse(await res.text());
		assert.equal(data.ok, true);
	});
});

it('Works with adapter and all pages prerendered', async () => {
	const fixture = await loadFixture({
		root: './fixtures/actions/',
		output: 'static',
		adapter: testAdapter(),
		outDir: './dist/actions-astro-actions-in-static-mode-with-preren/',
	});
	const devServer = await fixture.startDevServer();
	const res = await fixture.fetch('/_actions/subscribe', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({ channel: 'bholmesdev' }),
	});

	assert.equal(res.ok, true);
	await devServer.stop();
});

/**
 * Follow an expected redirect response.
 */
async function followExpectedRedirect(req: Request, app: App): Promise<Response> {
	const redirect = await app.render(req, { addCookieHeader: true });
	assert.ok(
		(REDIRECT_STATUS_CODES as readonly number[]).includes(redirect.status),
		`Expected redirect status, got ${redirect.status}`,
	);

	const redirectUrl = new URL(redirect.headers.get('Location')!, req.url);
	const redirectReq = new Request(redirectUrl, {
		headers: {
			Cookie: redirect.headers.get('Set-Cookie')!,
		},
	});
	return app.render(redirectReq);
}
