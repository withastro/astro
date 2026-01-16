// @ts-check
import assert from 'node:assert/strict';
import { mkdir, rm } from 'node:fs/promises';
import { after, before, describe, it } from 'node:test';
import { BlobsServer } from '@netlify/blobs/server';
import * as devalue from 'devalue';
import { loadFixture } from '../../../../astro/test/test-utils.js';
import netlify from '../../dist/index.js';

const token = 'mock';
const siteID = '1';
const dataDir = '.netlify/sessions';
const options = {
	name: 'test',
	uncachedEdgeURL: `http://localhost:8971`,
	edgeURL: `http://localhost:8971`,
	token,
	siteID,
	region: 'us-east-1',
};

describe('Astro.session', () => {
	describe('Production', () => {
		/** @type {import('../../../../astro/test/test-utils.js').Fixture} */
		let fixture;

		/** @type {BlobsServer} */
		let blobServer;
		before(async () => {
			process.env.NETLIFY = '1';
			await rm(dataDir, { recursive: true, force: true }).catch(() => {});
			await mkdir(dataDir, { recursive: true });
			blobServer = new BlobsServer({
				directory: dataDir,
				token,
				port: 8971,
			});
			await blobServer.start();
			fixture = await loadFixture({
				// @ts-ignore
				root: new URL('./fixtures/sessions/', import.meta.url),
				output: 'server',
				adapter: netlify(),
				// @ts-ignore
				session: { driver: '', options },
			});
			await fixture.build({});
			const entryURL = new URL(
				'./fixtures/sessions/.netlify/v1/functions/ssr/ssr.mjs',
				import.meta.url,
			);
			const mod = await import(entryURL.href);
			handler = mod.default;
		});
		let handler;
		after(async () => {
			await blobServer.stop();
			delete process.env.NETLIFY;
		});
		async function fetchResponse(path, requestInit) {
			return handler(new Request(new URL(path, 'http://example.com'), requestInit), {});
		}

		it('can regenerate session cookies upon request', async () => {
			const firstResponse = await fetchResponse('/regenerate', { method: 'GET' });
			const firstHeaders = firstResponse.headers.get('set-cookie').split(',');
			const firstSessionId = firstHeaders[0].split(';')[0].split('=')[1];

			const secondResponse = await fetchResponse('/regenerate', {
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
			const firstResponse = await fetchResponse('/update', { method: 'GET' });
			const firstValue = await firstResponse.json();
			assert.equal(firstValue.previousValue, 'none');

			const firstHeaders = firstResponse.headers.get('set-cookie').split(',');
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
			const firstHeaders = firstResponse.headers.get('set-cookie').split(',');
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
	});
});
