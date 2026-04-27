import * as assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { before, describe, it } from 'node:test';
import { type Fixture, loadFixture } from '../test-utils.ts';

describe('Skew Protection', { timeout: 120000 }, () => {
	let fixture: Fixture;

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
		const { default: handler } = await import(entryURL.href);
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
		// The manifest is embedded in the build output. Rolldown (Vite 8) may inline it
		// into entry.mjs instead of placing it in a separate chunk, so scan both locations.
		const buildDir = new URL('./fixtures/skew-protection/.netlify/build/', import.meta.url);

		const needle = '"internalFetchHeaders":{"X-Netlify-Deploy-ID":"test-deploy-123"}';
		let found = false;

		// Check entry.mjs first
		const entryContents = await readFile(new URL('entry.mjs', buildDir), 'utf-8');
		if (entryContents.includes(needle)) {
			found = true;
		}

		// Also check chunks/ directory
		if (!found) {
			const chunksURL = new URL('chunks/', buildDir);
			const files = await readdir(chunksURL);
			for (const file of files) {
				const contents = await readFile(new URL(file, chunksURL), 'utf-8');
				if (contents.includes(needle)) {
					const thisContents = await readFile(new URL(file, manifestURL), 'utf-8');
					if (
						thisContents.includes(
							'"internalFetchHeaders":{"X-Netlify-Deploy-ID":"test-deploy-123"}',
						)
					) {
						found = true;
						break;
					}
				}
			}
		}
		assert.ok(
			found,
			'Manifest should include internalFetchHeaders field with the correct deploy ID value',
		);
	});
});
