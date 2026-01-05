// @ts-check
import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import * as devalue from 'devalue';
import nodejs from '../dist/index.js';
import { loadFixture } from './test-utils.js';

describe('Astro.session', () => {
	describe('Production', () => {
		/** @type {import('./test-utils').Fixture} */
		let fixture;
		/** @type {import('../../../astro/src/types/public/preview.js').PreviewServer} */
		let app;

		before(async () => {
			fixture = await loadFixture({
				root: './fixtures/sessions/',
				output: 'server',
				adapter: nodejs({ mode: 'middleware' }),
			});
			await fixture.build({});
			app = await fixture.preview({});
		});

		after(async () => {
			await app.stop();
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

	describe('Development', () => {
		/** @type {import('./test-utils').Fixture} */
		let fixture;
		let devServer;
		before(async () => {
			fixture = await loadFixture({
				root: './fixtures/sessions/',
				output: 'server',
				adapter: nodejs({ mode: 'middleware' }),
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
