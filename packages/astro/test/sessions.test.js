import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import * as devalue from 'devalue';
import testAdapter from './test-adapter.js';
import { loadFixture } from './test-utils.js';

describe('Astro.session', () => {
	describe('Production', () => {
		/** @type {import('./test-utils').Fixture} */
		let fixture;
		/** @type {import('../src/core/app/index').App} response */
		let app;

		before(async () => {
			fixture = await loadFixture({
				root: './fixtures/sessions/',
				output: 'server',
				adapter: testAdapter(),
				session: {
					driver: 'fs',
					ttl: 20,
				},
			});
			await fixture.build({});
			app = await fixture.loadTestAdapterApp();
		});

		async function fetchResponse(path, requestInit) {
			const request = new Request('http://example.com' + path, requestInit);
			const response = await app.render(request);
			return response;
		}

		it('can regenerate session cookies upon request', async () => {
			const firstResponse = await fetchResponse('/regenerate');
			const firstHeaders = Array.from(app.setCookieHeaders(firstResponse));
			const firstSessionId = firstHeaders[0].split(';')[0].split('=')[1];

			const secondResponse = await fetchResponse('/regenerate', {
				method: 'GET',
				headers: {
					cookie: `astro-session=${firstSessionId}`,
				},
			});
			const secondHeaders = Array.from(app.setCookieHeaders(secondResponse));
			const secondSessionId = secondHeaders[0].split(';')[0].split('=')[1];
			assert.notEqual(firstSessionId, secondSessionId);
		});

		it('defaults to secure cookies in production', async () => {
			const firstResponse = await fetchResponse('/regenerate');
			const firstHeaders = Array.from(app.setCookieHeaders(firstResponse));
			assert.ok(firstHeaders[0].includes('Secure'), 'Secure cookie not set in production');
			assert.ok(firstHeaders[0].includes('HttpOnly'), 'HttpOnly cookie not set in production');
		});

		it('can save session data by value', async () => {
			const firstResponse = await fetchResponse('/update');
			const firstValue = await firstResponse.json();
			assert.equal(firstValue.previousValue, 'none');

			const firstHeaders = Array.from(app.setCookieHeaders(firstResponse));
			const firstSessionId = firstHeaders[0].split(';')[0].split('=')[1];
			const secondResponse = await fetchResponse('/update', {
				method: 'GET',
				headers: {
					cookie: `astro-session=${firstSessionId}`,
				},
			});
			const secondValue = await secondResponse.json();
			assert.equal(secondValue.previousValue, 'expected');
		});

		it('can save and restore URLs in session data', async () => {
			const firstResponse = await fetchResponse('/_actions/addUrl', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ favoriteUrl: 'https://domain.invalid' }),
			});

			assert.equal(firstResponse.ok, true);
			const firstHeaders = Array.from(app.setCookieHeaders(firstResponse));
			const firstSessionId = firstHeaders[0].split(';')[0].split('=')[1];

			const data = devalue.parse(await firstResponse.text());
			assert.equal(data.message, 'Favorite URL set to https://domain.invalid/ from nothing');
			const secondResponse = await fetchResponse('/_actions/addUrl', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					cookie: `astro-session=${firstSessionId}`,
				},
				body: JSON.stringify({ favoriteUrl: 'https://example.com' }),
			});
			const secondData = devalue.parse(await secondResponse.text());
			assert.equal(
				secondData.message,
				'Favorite URL set to https://example.com/ from https://domain.invalid/',
			);
		});

		it('can load a session by ID', async () => {
			const firstResponse = await fetchResponse('/_actions/addToCart', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/x-www-form-urlencoded',
					Origin: 'http://example.com',
				},
				body: new URLSearchParams({ productId: 'item1' }),
			});
			const firstResponseData = devalue.parse(await firstResponse.text());
			assert.equal(firstResponseData.cart.includes('item1'), true);

			const firstHeaders = Array.from(app.setCookieHeaders(firstResponse));
			const firstSessionId = firstHeaders[0].split(';')[0].split('=')[1];

			//  Load without a cookie, but with the session ID for the action to load
			const secondResponse = await fetchResponse('/_actions/loadCart', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ id: firstSessionId }),
			});
			const cartData = devalue.parse(await secondResponse.text());
			assert.deepEqual(cartData.cart, firstResponseData.cart);
		});
	});

	describe('Development', () => {
		/** @type {import('./test-utils').Fixture} */
		let fixture;
		let devServer;
		before(async () => {
			fixture = await loadFixture({
				root: './fixtures/sessions/',
				output: 'server',
				adapter: testAdapter(),
				session: {
					driver: 'fs',
					ttl: 20,
				},
			});
			devServer = await fixture.startDevServer();
		});

		after(async () => {
			await devServer.stop();
		});

		it('can regenerate session cookies upon request', async () => {
			const firstResponse = await fixture.fetch('/regenerate');
			// @ts-ignore
			const firstHeaders = firstResponse.headers.get('set-cookie').split(',');
			const firstSessionId = firstHeaders[0].split(';')[0].split('=')[1];

			const secondResponse = await fixture.fetch('/regenerate', {
				method: 'GET',
				headers: {
					cookie: `astro-session=${firstSessionId}`,
				},
			});
			// @ts-ignore
			const secondHeaders = secondResponse.headers.get('set-cookie').split(',');
			const secondSessionId = secondHeaders[0].split(';')[0].split('=')[1];
			assert.notEqual(firstSessionId, secondSessionId);
		});

		it('defaults to non-secure cookies in development', async () => {
			const response = await fixture.fetch('/regenerate');
			const setCookieHeader = response.headers.get('set-cookie');
			assert.ok(!setCookieHeader.includes('Secure'));
		});

		it('can save session data by value', async () => {
			const firstResponse = await fixture.fetch('/update');
			const firstValue = await firstResponse.json();
			assert.equal(firstValue.previousValue, 'none');

			// @ts-ignore
			const firstHeaders = firstResponse.headers.get('set-cookie').split(',');
			const firstSessionId = firstHeaders[0].split(';')[0].split('=')[1];
			const secondResponse = await fixture.fetch('/update', {
				method: 'GET',
				headers: {
					cookie: `astro-session=${firstSessionId}`,
				},
			});
			const secondValue = await secondResponse.json();
			assert.equal(secondValue.previousValue, 'expected');
		});

		it('can save and restore URLs in session data', async () => {
			const firstResponse = await fixture.fetch('/_actions/addUrl', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ favoriteUrl: 'https://domain.invalid' }),
			});

			assert.equal(firstResponse.ok, true);
			// @ts-ignore
			const firstHeaders = firstResponse.headers.get('set-cookie').split(',');
			const firstSessionId = firstHeaders[0].split(';')[0].split('=')[1];

			const data = devalue.parse(await firstResponse.text());
			assert.equal(data.message, 'Favorite URL set to https://domain.invalid/ from nothing');
			const secondResponse = await fixture.fetch('/_actions/addUrl', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					cookie: `astro-session=${firstSessionId}`,
				},
				body: JSON.stringify({ favoriteUrl: 'https://example.com' }),
			});
			const secondData = devalue.parse(await secondResponse.text());
			assert.equal(
				secondData.message,
				'Favorite URL set to https://example.com/ from https://domain.invalid/',
			);
		});
	});
});
