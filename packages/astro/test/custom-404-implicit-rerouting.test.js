import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import { loadFixture } from './test-utils.js';

for (const caseNumber of [1, 2, 3, 4]) {
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
		it.skip(
			'dev server handles normal requests',
			{
				todo: 'To re-enabled after we understand why this fails when the test suite is run in parallel',
			},
			async () => {
				const resPromise = fixture.fetch('/');
				const result = await withTimeout(resPromise, 1000);
				assert.notEqual(result, timeout);
				assert.equal(result.status, 200);
			}
		);

		it.skip(
			'dev server stays responsive',
			{
				todo: 'To re-enabled after we understand why this fails when the test suite is run in parallel',
			},
			async () => {
				const resPromise = fixture.fetch('/alvsibdlvjks');
				const result = await withTimeout(resPromise, 1000);
				assert.notEqual(result, timeout);
				assert.equal(result.status, 404);
			}
		);

		after(async () => {
			await devServer.stop();
		});
	});
}

/***** UTILITY FUNCTIONS *****/

const timeout = Symbol('timeout');

/** @template Res */
function withTimeout(
	/** @type Promise<Res> */
	responsePromise,
	/** @type number */
	timeLimit
) {
	/** @type Promise<typeof timeout> */
	const timeoutPromise = new Promise((resolve) => setTimeout(() => resolve(timeout), timeLimit));

	return Promise.race([responsePromise, timeoutPromise]);
}
