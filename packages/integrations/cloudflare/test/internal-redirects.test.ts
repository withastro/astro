import { describe, it } from 'node:test';
import { type Fixture, loadFixture } from './test-utils.ts';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

describe('Internal Redirects', () => {
	let fixture: Fixture;
	it('should not create a prerendered file for internal redirects', async () => {
		fixture = await loadFixture({
			root: './fixtures/internal-redirects',
		});

		await fixture.build();

		// Check that the redirect file was created and contains the redirect
		const redirectsPath = fileURLToPath(new URL('client/_redirects', fixture.config.outDir));
		const redirectsContent = readFileSync(redirectsPath, 'utf-8');
		assert.match(
			redirectsContent,
			/\/redirect\s+\/page2\s+301/,
			'_redirects file should contain the redirect rule',
		);

		// Check that the destination was not prerendered
		const prerenderedPath = fileURLToPath(
			new URL('client/redirect/index.html', fixture.config.outDir),
		);
		assert.ok(
			!existsSync(prerenderedPath),
			'Should not create prerendered file for internal redirect destination',
		);
	});
});
