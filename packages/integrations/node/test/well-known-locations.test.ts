import * as assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import type { PreviewServer } from '../../../astro/src/types/public/preview.js';
import nodejs from '../dist/index.js';
import { createRequestAndResponse, type Fixture, loadFixture } from './test-utils.ts';

describe('test URIs beginning with a dot', () => {
	let fixture: Fixture;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/well-known-locations/',
			output: 'server',
			adapter: nodejs({ mode: 'standalone' }),
		});
		await fixture.build();
	});

	describe('can load well-known URIs', async () => {
		let devPreview: PreviewServer;

		before(async () => {
			devPreview = await fixture.preview();
		});

		after(async () => {
			await devPreview.stop();
		});

		it('can load a valid well-known URI', async () => {
			const res = await fixture.fetch('/.well-known/apple-app-site-association');

			assert.equal(res.status, 200);

			const json = await res.json();

			assert.notEqual(json.applinks, {});
		});

		it('cannot load a dot folder that is not a well-known URI', async () => {
			const res = await fixture.fetch('/.hidden/file.json');

			assert.equal(res.status, 404);
		});
	});

	describe('dotfile access via unnormalized paths', async () => {
		it('denies dotfile access when path contains .well-known/../ traversal', async () => {
			const handler = await fixture.loadNodeAdapterHandler();
			const { req, res, done } = createRequestAndResponse({
				method: 'GET',
				url: '/.well-known/../.hidden-file',
			});

			handler(req, res);
			req.send();

			await done;
			assert.notEqual(
				res.statusCode,
				200,
				'dotfile should not be served via .well-known path traversal',
			);
		});

		it('denies dotfolder file access when path contains .well-known/../ traversal', async () => {
			const handler = await fixture.loadNodeAdapterHandler();
			const { req, res, done } = createRequestAndResponse({
				method: 'GET',
				url: '/.well-known/../.hidden/file.json',
			});

			handler(req, res);
			req.send();

			await done;
			assert.notEqual(
				res.statusCode,
				200,
				'dotfolder file should not be served via .well-known path traversal',
			);
		});
	});
});
