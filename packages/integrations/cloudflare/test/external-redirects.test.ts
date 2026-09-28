import { describe, it } from 'node:test';
import { type Fixture, loadFixture } from './test-utils.ts';
import assert from 'node:assert/strict';

describe('External Redirects', () => {
	let fixture: Fixture;
	it('should not attempt to prerender external redirect destinations', async () => {
		fixture = await loadFixture({
			root: './fixtures/external-redirects',
		});

		// Building should not result in a fetch to the external destination URL.
		// If it does, the fetch will throw and the test will fail.
		await fixture.build();

		// Check that the redirect file was created and contains the redirect
		const redirectsContent = await fixture.readFile('client/_redirects');
		assert.match(
			redirectsContent,
			/\/redirect\s+http:\/\/test.invalid\/destination\s+301/,
			'_redirects file should contain the redirect rule',
		);

		// Check that the destination was not prerendered
		assert.ok(
			!fixture.pathExists('client/redirect/index.html'),
			'Should not create prerendered file for external redirect destination',
		);
	});
});
