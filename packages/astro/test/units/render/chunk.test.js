import * as assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';
import * as cheerio from 'cheerio';
import { createFs, createRequestAndResponse, runInContainer } from '../test-utils.js';

const root = new URL('../../fixtures/alias/', import.meta.url);

describe('core/render chunk', () => {
	it('does not throw on user object with type', async () => {
		const fs = createFs(
			{
				'/src/pages/index.astro': `
				---
				const value = { type: 'foobar' }
				---
				<div id="chunk">{value}</div>
			`,
			},
			root
		);

		await runInContainer(
			{
				fs,
				inlineConfig: {
					root: fileURLToPath(root),
					logLevel: 'silent',
					integrations: [],
				},
			},
			async (container) => {
				const { req, res, done, text } = createRequestAndResponse({
					method: 'GET',
					url: '/',
				});
				container.handle(req, res);

				await done;
				try {
					const html = await text();
					const $ = cheerio.load(html);
					const target = $('#chunk');

					assert.ok(target);
					assert.equal(target.text(), '[object Object]');
				} catch (e) {
					assert.fail();
				}
			}
		);
	});
});
