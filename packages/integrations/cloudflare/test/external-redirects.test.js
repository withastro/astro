import { describe, it } from 'node:test';
import { loadFixture } from './_test-utils.js';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

describe('External Redirects', () => {
	let fixture;

	it('should not attempt to prerender external redirect destinations', async () => {
		fixture = await loadFixture({
			root: './fixtures/external-redirects',
		});

		// Building should not result in a fetch to the external destination URL.
		// If it does, the fetch will throw and the test will fail.
		await fixture.build();

		// Check that the redirect file was created and contains the redirect
		const redirectsPath = fileURLToPath(new URL('client/_redirects', fixture.config.outDir));
		const redirectsContent = readFileSync(redirectsPath, 'utf-8');
		assert.match(
			redirectsContent,
			/\/redirect\s+http:\/\/test.invalid\/destination\s+301/,
			'_redirects file should contain the redirect rule',
		);

		// Check that the destination was not prerendered
		const prerenderedPath = fileURLToPath(
			new URL('client/redirect/index.html', fixture.config.outDir),
		);
		assert.ok(
			!existsSync(prerenderedPath),
			'Should not create prerendered file for external redirect destination',
		);
	});
});
