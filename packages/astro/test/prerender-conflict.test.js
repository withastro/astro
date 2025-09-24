import { strict as assert } from 'node:assert';
import { before, describe, it } from 'node:test';
import { Logger } from '../dist/core/logger/core.js';
import { loadFixture } from './test-utils.js';

/**
 * Dynamic vs dynamic duplication should warn by default and succeed.
 * When experimental.failOnPrerenderConflict is true, it should fail.
 * Static vs dynamic should also warn/fail similarly.
 */

describe('Prerender conflicts', () => {
	describe('dynamic vs dynamic', () => {
		let fixture;

		before(async () => {
			fixture = await loadFixture({ root: './fixtures/prerender-conflict-dynamic-dynamic/' });
		});

		it('warns by default and succeeds', async () => {
			const logs = [];
			await fixture.build({
				logger: new Logger({
					level: 'warn',
					dest: {
						write(chunk) {
							logs.push(chunk);
						},
					},
				}),
			});

			const relevantLogs = logs
				.filter((log) => log.level === 'warn' && log.label === 'build')
				.map((log) => log.message);

			assert.deepEqual(
				relevantLogs,
				[
					'Could not render `/c` from route `/[foo]` as it conflicts with higher priority route `/[bar]`.',
				],
				'Should warn about prerender conflict between two dynamic routes.',
			);
		});

		it('fails when experimental.failOnPrerenderConflict = true', async () => {
			let err;
			try {
				await fixture.build({ experimental: { failOnPrerenderConflict: true } });
			} catch (e) {
				err = e;
			}
			assert.ok(err, 'Build should fail when failOnPrerenderConflict is true');
			assert.equal(
				String(err),
				'PrerenderRouteConflict: Could not render `/c` from route `/[foo]` as it conflicts with higher priority route `/[bar]`.',
			);
		});
	});

	describe('static vs dynamic', () => {
		let fixture;

		before(async () => {
			fixture = await loadFixture({ root: './fixtures/prerender-conflict-static-dynamic/' });
		});

		it('warns by default and succeeds', async () => {
			const logs = [];
			await fixture.build({
				logger: new Logger({
					level: 'warn',
					dest: {
						write(chunk) {
							logs.push(chunk);
						},
					},
				}),
			});

			const relevantLogs = logs
				.filter((log) => log.level === 'warn' && log.label === 'build')
				.map((log) => log.message);

			assert.deepEqual(
				relevantLogs,
				[
					'Could not render `/c` from route `/[foo]` as it conflicts with higher priority route `/c`.',
				],
				'Should warn about prerender conflict between two dynamic routes.',
			);
		});

		it('fails when experimental.failOnPrerenderConflict = true', async () => {
			let err;
			try {
				await fixture.build({ experimental: { failOnPrerenderConflict: true } });
			} catch (e) {
				err = e;
			}
			assert.ok(err, 'Build should fail when failOnPrerenderConflict is true');
			assert.equal(
				String(err),
				'PrerenderRouteConflict: Could not render `/c` from route `/[foo]` as it conflicts with higher priority route `/c`.',
			);
		});
	});
});
