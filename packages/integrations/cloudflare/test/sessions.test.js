import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';
import * as devalue from 'devalue';
import cloudflare from '../dist/index.js';
import { astroCli, loadFixture, wranglerCli } from './_test-utils.js';

const root = new URL('./fixtures/sessions/', import.meta.url);

describe('sessions', () => {
	let wrangler;

	before(async () => {
		await astroCli(fileURLToPath(root), 'build');

		wrangler = wranglerCli(fileURLToPath(root));
		await new Promise((resolve) => {
			wrangler.stdout.on('data', (data) => {
				// console.log('[stdout]', data.toString());
				if (data.toString().includes('http://127.0.0.1:8788')) resolve();
			});
			wrangler.stderr.on('data', (_data) => {
				// console.log('[stderr]', _data.toString());
			});
		});
	});

	after(() => {
		wrangler.kill();
	});

	it('can regenerate session cookies upon request', async () => {
		const firstResponse = await fetch('http://127.0.0.1:8788/regenerate', { method: 'GET' });
		const firstHeaders = firstResponse.headers.get('set-cookie').split(',');
		const firstSessionId = firstHeaders[0].split(';')[0].split('=')[1];

		const secondResponse = await fetch('http://127.0.0.1:8788/regenerate', {
			method: 'GET',
			headers: {
				cookie: `astro-session=${firstSessionId}`,
			},
		});
		const secondHeaders = secondResponse.headers.get('set-cookie').split(',');
		const secondSessionId = secondHeaders[0].split(';')[0].split('=')[1];
		assert.notEqual(firstSessionId, secondSessionId);
	});

	it('can save session data by value', async () => {
		const firstResponse = await fetch('http://127.0.0.1:8788/update', { method: 'GET' });
		const firstValue = await firstResponse.json();
		assert.equal(firstValue.previousValue, 'none');

		const firstHeaders = firstResponse.headers.get('set-cookie').split(',');
		const firstSessionId = firstHeaders[0].split(';')[0].split('=')[1];
		const secondResponse = await fetch('http://127.0.0.1:8788/update', {
			method: 'GET',
			headers: {
				cookie: `astro-session=${firstSessionId}`,
			},
		});
		const secondValue = await secondResponse.json();
		assert.equal(secondValue.previousValue, 'expected');
	});

	it('can save and restore URLs in session data', async () => {
		const firstResponse = await fetch('http://127.0.0.1:8788/_actions/addUrl', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({ favoriteUrl: 'https://domain.invalid' }),
		});

		assert.equal(firstResponse.ok, true);
		const firstHeaders = firstResponse.headers.get('set-cookie').split(',');
		const firstSessionId = firstHeaders[0].split(';')[0].split('=')[1];

		const data = devalue.parse(await firstResponse.text());
		assert.equal(data.message, 'Favorite URL set to https://domain.invalid/ from nothing');
		const secondResponse = await fetch('http://127.0.0.1:8788/_actions/addUrl', {
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

describe('sessions with custom options', () => {
	it('can build with custom options', async () => {
		let fixture;

		await assert.doesNotReject(
			async () => {
				fixture = await loadFixture({
					root,
					adapter: cloudflare({}),
					session: {
						cookie: 'custom-session',
					},
				});
				await fixture.build();
			},
			undefined,
			'Building with custom session options should not throw an error',
		);
	});
});
