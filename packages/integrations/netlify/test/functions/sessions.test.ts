import assert from 'node:assert/strict';
import { mkdir, rm } from 'node:fs/promises';
import { after, before, describe, it } from 'node:test';
import { BlobsServer } from '@netlify/blobs/server';
import { sessionDrivers } from 'astro/config';
import * as devalue from 'devalue';
import netlify from '../../dist/index.js';
import { type Fixture, loadFixture } from '../test-utils.ts';

const token = 'mock';
const siteID = '1';
const dataDir = '.netlify/sessions';

describe('Astro.session', () => {
	describe('Production', () => {
		let fixture: Fixture;

		let blobServer: BlobsServer;
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
				root: new URL('./fixtures/sessions/', import.meta.url),
				output: 'server',
				adapter: netlify(),
				session: {
					// @ts-expect-error: the default type of the TDriver in AstroUserConfig must be changed so that this can pass
					driver: sessionDrivers.netlifyBlobs({
						name: 'test',
						uncachedEdgeURL: `http://localhost:8971`,
						edgeURL: `http://localhost:8971`,
						token,
						siteID,
					}),
				},
			});
			await fixture.build({});
			const entryURL = new URL(
				'./fixtures/sessions/.netlify/v1/functions/ssr/ssr.mjs',
				import.meta.url,
			);
			const mod = await import(entryURL.href);
			handler = mod.default;
		});
		let handler: (request: Request, options: object) => Promise<Response>;
		after(async () => {
			await blobServer.stop();
			delete process.env.NETLIFY;
		});
		function fetchResponse(path: string, requestInit: RequestInit) {
			return handler(new Request(new URL(path, 'http://example.com'), requestInit), {});
		}

		it('can regenerate session cookies upon request', async () => {
			const firstResponse = await fetchResponse('/regenerate', { method: 'GET' });
			const firstHeaders = firstResponse.headers.get('set-cookie')?.split(',') ?? '';
			const firstSessionId = firstHeaders[0]!.split(';')[0]!.split('=')[1];

			const secondResponse = await fetchResponse('/regenerate', {
				method: 'GET',
				headers: {
					cookie: `astro-session=${firstSessionId}`,
				},
			});
			const secondHeaders = secondResponse.headers.get('set-cookie')?.split(',') ?? '';
			const secondSessionId = secondHeaders[0]!.split(';')[0]!.split('=')[1];
			assert.notEqual(firstSessionId, secondSessionId);
		});

		it('can save session data by value', async () => {
			const firstResponse = await fetchResponse('/update', { method: 'GET' });
			const firstValue = await firstResponse.json();
			assert.equal(firstValue.previousValue, 'none');

			const firstHeaders = firstResponse.headers.get('set-cookie')?.split(',') ?? '';
			const firstSessionId = firstHeaders[0]!.split(';')[0]!.split('=')[1];
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
			const firstHeaders = firstResponse.headers.get('set-cookie')?.split(',') ?? '';
			const firstSessionId = firstHeaders[0]!.split(';')[0]!.split('=')[1];

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
