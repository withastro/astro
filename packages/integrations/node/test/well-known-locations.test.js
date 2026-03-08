import * as assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import nodejs from '../dist/index.js';
import { createRequestAndResponse, loadFixture } from './test-utils.js';

describe('test URIs beginning with a dot', () => {
	/** @type {import('./test-utils').Fixture} */
	let fixture;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/well-known-locations/',
			output: 'server',
			adapter: nodejs({ mode: 'standalone' }),
		});
		await fixture.build();
	});

	describe('can load well-known URIs', async () => {
		let devPreview;

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
			const { handler } = await import('./fixtures/well-known-locations/dist/server/entry.mjs');
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
			const { handler } = await import('./fixtures/well-known-locations/dist/server/entry.mjs');
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
