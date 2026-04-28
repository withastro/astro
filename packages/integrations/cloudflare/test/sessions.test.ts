import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import * as devalue from 'devalue';
import cloudflare from '../dist/index.js';
import { type Fixture, loadFixture, type PreviewServer } from './test-utils.ts';
import type { AstroInlineConfig } from 'astro';

describe('sessions', () => {
	let fixture: Fixture;
	let previewServer: PreviewServer;
	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/sessions/',
		});
		await fixture.build();
		previewServer = await fixture.preview();
	});

	after(async () => {
		await previewServer.stop();
	});

	it('can regenerate session cookies upon request', async () => {
		const firstResponse = await fixture.fetch('/regenerate', { method: 'GET' });
		const firstHeaders = firstResponse.headers.get('set-cookie')!.split(',');
		const firstSessionId = firstHeaders[0].split(';')[0].split('=')[1];

		const secondResponse = await fixture.fetch('/regenerate', {
			method: 'GET',
			headers: {
				cookie: `astro-session=${firstSessionId}`,
			},
		});
		const secondHeaders = secondResponse.headers.get('set-cookie')!.split(',');
		const secondSessionId = secondHeaders[0].split(';')[0].split('=')[1];
		assert.notEqual(firstSessionId, secondSessionId);
	});

	it('can save session data by value', async () => {
		const firstResponse = await fixture.fetch('/update', { method: 'GET' });
		const firstValue = await firstResponse.json();
		assert.equal(firstValue.previousValue, 'none');

		const firstHeaders = firstResponse.headers.get('set-cookie')!.split(',');
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
		const firstHeaders = firstResponse.headers.get('set-cookie')!.split(',');
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

describe('sessions with custom binding name', () => {
	let fixture: Fixture;
	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/sessions/',
			adapter: cloudflare({
				sessionKVBindingName: 'CUSTOM_SESSION',
			}),
		});
	});

	it('can build with custom session binding name', async () => {
		await assert.doesNotReject(async () => {
			await fixture.build();
		}, 'Building with custom session binding name should not throw an error');
	});
});

describe('session wrangler config', () => {
	it('does not include the SESSION KV binding when sessions are disabled', async () => {
		const fixture = await loadFixture({
			root: './fixtures/static/',
		});

		const config: AstroInlineConfig = {
			session: {
				// @ts-expect-error: the default type of the TDriver in AstroUserConfig must be changed so that this can pass
				driver: {
					entrypoint: 'unstorage/drivers/null',
				},
			},
		};
		await fixture.build(config);

		const wrangler = JSON.parse(await fixture.readFile('/server/wrangler.json')) as {
			kv_namespaces?: Array<{ binding: string }>;
		};
		assert.equal(
			wrangler.kv_namespaces?.some(({ binding }) => binding === 'SESSION'),
			false,
		);
	});

	it('includes the SESSION KV binding when Cloudflare KV is configured explicitly', async () => {
		const fixture = await loadFixture({
			root: './fixtures/static/',
		});

		const config: AstroInlineConfig = {
			session: {
				// @ts-expect-error: the default type of the TDriver in AstroUserConfig must be changed so that this can pass
				driver: {
					entrypoint: 'unstorage/drivers/cloudflare-kv-binding',
				},
			},
		};
		await fixture.build(config);

		const wrangler = JSON.parse(await fixture.readFile('/server/wrangler.json')) as {
			kv_namespaces?: Array<{ binding: string }>;
		};
		assert.deepEqual(wrangler.kv_namespaces, [{ binding: 'SESSION' }]);
	});
});
