import * as assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { before, describe, it } from 'node:test';
import { loadFixture } from '../../../../astro/test/test-utils.js';

describe(
	'Skew Protection',
	() => {
		let fixture;

		before(async () => {
			// Set DEPLOY_ID env var for the test
			process.env.DEPLOY_ID = 'test-deploy-123';

			fixture = await loadFixture({
				root: new URL('./fixtures/skew-protection/', import.meta.url),
			});
			await fixture.build();

			// Clean up
			delete process.env.DEPLOY_ID;
		});

		it('Server islands inline adapter headers', async () => {
			// Render a page with server islands and check the HTML contains inline headers
			const entryURL = new URL(
				'./fixtures/skew-protection/.netlify/v1/functions/ssr/ssr.mjs',
				import.meta.url,
			);
			const { default: handler } = await import(entryURL);
			const resp = await handler(new Request('http://example.com/server-island'), {});
			const html = await resp.text();

			// Check that the HTML contains the inline headers in the server island script
			// Should have something like: const headers = new Headers({"X-Netlify-Deploy-ID":"test-deploy-123"});
			assert.ok(
				html.includes('test-deploy-123'),
				'Expected server island HTML to include deploy ID in inline script',
			);
		});

		it('Manifest contains internalFetchHeaders', async () => {
			// The manifest is embedded in the build output
			// Check the manifest file which contains the serialized manifest
			const manifestURL = new URL('./fixtures/skew-protection/.netlify/build/', import.meta.url);

			// Find the manifest file (it has a hash in the name)
			const { readdir } = await import('node:fs/promises');
			const files = await readdir(manifestURL);
			const manifestFile = files.find((f) => f.startsWith('manifest_') && f.endsWith('.mjs'));
			assert.ok(manifestFile, 'Expected to find a manifest file');

			const manifestContent = await readFile(new URL(manifestFile, manifestURL), 'utf-8');

			// The manifest should be serialized with internalFetchHeaders
			assert.ok(
				manifestContent.includes('internalFetchHeaders'),
				'Expected manifest to include internalFetchHeaders field',
			);
			assert.ok(
				manifestContent.includes('test-deploy-123'),
				'Expected manifest to include deploy ID value',
			);
		});
	},
	{
		timeout: 120000,
	},
);
