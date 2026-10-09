import assert from 'node:assert/strict';
import { before, describe, it } from 'node:test';
import { type Fixture, loadFixture } from './test-utils.ts';

describe('Dynamic endpoint collision', () => {
	describe('build', () => {
		let fixture: Fixture;
		let errorMsg: Error | null = null;
		before(async () => {
			fixture = await loadFixture({
				root: './fixtures/dynamic-endpoint-collision/',
				outDir: './dist/dynamic-endpoint-collision-build/',
			});
			try {
				await fixture.build();
			} catch (error) {
				errorMsg = error as Error;
			}
		});

		it('throw error when dynamic endpoint has path collision', async () => {
			assert.equal(errorMsg!.name, 'PrerenderDynamicEndpointPathCollide');
		});
	});
});
