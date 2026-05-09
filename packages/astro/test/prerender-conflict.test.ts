import { strict as assert } from 'node:assert';
import { before, describe, it } from 'node:test';
import { type AstroLoggerMessage, AstroLogger } from '../dist/core/logger/core.js';
import { type Fixture, loadFixture } from './test-utils.ts';

/**
 * Dynamic vs dynamic duplication should warn by default and succeed.
 * When prerenderConflictBehavior is set to 'error', it should fail.
 * Static vs dynamic should also warn/fail similarly.
 */

describe('Prerender conflicts', () => {
	describe('dynamic vs dynamic', () => {
		let fixture: Fixture;

		before(async () => {
			fixture = await loadFixture({
				root: './fixtures/prerender-conflict-dynamic-dynamic/',
				outDir: './dist/prerender-conflict-dynamic-vs-dynamic/',
			});
		});

		it('warns by default and succeeds', async () => {
			const logs: AstroLoggerMessage[] = [];
			const logger = new AstroLogger({
				level: 'warn',
				destination: {
					write(chunk: AstroLoggerMessage) {
						logs.push(chunk);
						return true;
					},
				},
			});
			await fixture.build({
				// @ts-expect-error: logger is an internal API
				logger,
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

		it('fails when prerenderConflictBehavior is set to error', async () => {
			let err: unknown;
			try {
				await fixture.build({ prerenderConflictBehavior: 'error' });
			} catch (e) {
				err = e;
			}
			assert.ok(err, 'Build should fail when prerenderConflictBehavior is set to error');
			assert.equal(
				String(err),
				'PrerenderRouteConflict: Could not render `/c` from route `/[foo]` as it conflicts with higher priority route `/[bar]`.',
			);
		});
	});

	describe('static vs dynamic', () => {
		let fixture: Fixture;

		before(async () => {
			fixture = await loadFixture({
				root: './fixtures/prerender-conflict-static-dynamic/',
				outDir: './dist/prerender-conflict-static-vs-dynamic/',
			});
		});

		it('warns by default and succeeds', async () => {
			const logs: AstroLoggerMessage[] = [];
			const logger = new AstroLogger({
				level: 'warn',
				destination: {
					write(chunk: AstroLoggerMessage) {
						logs.push(chunk);
						return true;
					},
				},
			});
			await fixture.build({
				// @ts-expect-error: logger is an internal API
				logger,
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

		it('fails when prerenderConflictBehavior is set to error', async () => {
			let err: unknown;
			try {
				await fixture.build({ prerenderConflictBehavior: 'error' });
			} catch (e) {
				err = e;
			}
			assert.ok(err, 'Build should fail when prerenderConflictBehavior is set to error');
			assert.equal(
				String(err),
				'PrerenderRouteConflict: Could not render `/c` from route `/[foo]` as it conflicts with higher priority route `/c`.',
			);
		});
	});
});
