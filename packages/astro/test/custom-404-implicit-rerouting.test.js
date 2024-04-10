import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import { loadFixture } from './test-utils.js';

for (const caseNumber of [1, 2, 3, 4, 5]) {
	describe(`Custom 404 with implicit rerouting - Case #${caseNumber}`, () => {
		/** @type Awaited<ReturnType<typeof loadFixture>> */
		let fixture;
		/** @type Awaited<ReturnType<typeof fixture['startDevServer']>> */
		let devServer;

		before(async () => {
			fixture = await loadFixture({
				root: `./fixtures/custom-404-loop-case-${caseNumber}/`,
				site: 'http://example.com',
			});

			devServer = await fixture.startDevServer();
		});

		// sanity check
		it('dev server handles normal requests', async () => {
			const response = await fixture.fetch('/', { signal: AbortSignal.timeout(1000) });
			assert.equal(response.status, 200);
		});

		// IMPORTANT: never skip
		it('dev server stays responsive', async () => {
			const response = await fixture.fetch('/alvsibdlvjks', { signal: AbortSignal.timeout(1000) });
			assert.equal(response.status, 404);
		});

		after(async () => {
			await devServer.stop();
		});
	});
}
