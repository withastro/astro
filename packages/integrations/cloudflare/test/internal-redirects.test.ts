import { describe, it } from 'node:test';
import { type Fixture, loadFixture } from './test-utils.ts';
import assert from 'node:assert/strict';

describe('Internal Redirects', () => {
	let fixture: Fixture;
	it('should not create a prerendered file for internal redirects', async () => {
		fixture = await loadFixture({
			root: './fixtures/internal-redirects',
		});

		await fixture.build();

		// Check that the redirect file was created and contains the redirect
		const redirectsContent = await fixture.readFile('client/_redirects');
		assert.match(
			redirectsContent,
			/\/redirect\s+\/page2\s+301/,
			'_redirects file should contain the redirect rule',
		);

		// Check that the destination was not prerendered
		assert.ok(
			!fixture.pathExists('client/redirect/index.html'),
			'Should not create prerendered file for internal redirect destination',
		);
	});
});
