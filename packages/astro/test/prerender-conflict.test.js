import { strict as assert } from 'node:assert';
import { before, describe, it } from 'node:test';
import { AstroLogger } from '../dist/core/logger/core.js';
import { loadFixture } from './test-utils.js';

/**
 * Dynamic vs dynamic duplication should warn by default and succeed.
 * When prerenderConflictBehavior is set to 'error', it should fail.
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
				logger: new AstroLogger({
					level: 'warn',
					destination: {
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
					'Could not render `/c` from route `/[foo]` (src/pages/[foo].astro) as it conflicts with higher priority route `/[bar]` (src/pages/[bar].astro).',
				],
				'Should warn about prerender conflict between two dynamic routes.',
			);
		});

		it('fails when prerenderConflictBehavior is set to error', async () => {
			let err;
			try {
				await fixture.build({ prerenderConflictBehavior: 'error' });
			} catch (e) {
				err = e;
			}
			assert.ok(err, 'Build should fail when prerenderConflictBehavior is set to error');
			assert.equal(
				String(err),
				'PrerenderRouteConflict: Could not render `/c` from route `/[foo]` (src/pages/[foo].astro) as it conflicts with higher priority route `/[bar]` (src/pages/[bar].astro).',
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
				logger: new AstroLogger({
					level: 'warn',
					destination: {
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
					'Could not render `/c` from route `/[foo]` (src/pages/[foo].astro) as it conflicts with higher priority route `/c` (src/pages/c.astro).',
				],
				'Should warn about prerender conflict between two dynamic routes.',
			);
		});

		it('fails when prerenderConflictBehavior is set to error', async () => {
			let err;
			try {
				await fixture.build({ prerenderConflictBehavior: 'error' });
			} catch (e) {
				err = e;
			}
			assert.ok(err, 'Build should fail when prerenderConflictBehavior is set to error');
			assert.equal(
				String(err),
				'PrerenderRouteConflict: Could not render `/c` from route `/[foo]` (src/pages/[foo].astro) as it conflicts with higher priority route `/c` (src/pages/c.astro).',
			);
		});
	});

	describe('same pattern from different files (e.g. archive.astro vs archive/index.astro)', () => {
		let fixture;

		before(async () => {
			fixture = await loadFixture({ root: './fixtures/prerender-conflict-same-pattern/' });
		});

		it('warns early about the collision during route creation', async () => {
			const logs = [];
			await fixture.build({
				logger: new AstroLogger({
					level: 'warn',
					destination: {
						write(chunk) {
							logs.push(chunk);
						},
					},
				}),
			});

			const routerLogs = logs
				.filter((log) => log.level === 'warn' && log.label === 'router')
				.map((log) => log.message);

			assert.ok(
				routerLogs.some(
					(msg) =>
						msg.includes('The route "/[locale]/post/archive" is defined in both') &&
						msg.includes('archive/index.astro') &&
						msg.includes('archive.astro'),
				),
				'Should warn early about same-pattern collision with both file paths mentioned.',
			);
		});

		it('includes component file paths in the build conflict warning', async () => {
			const logs = [];
			await fixture.build({
				logger: new AstroLogger({
					level: 'warn',
					destination: {
						write(chunk) {
							logs.push(chunk);
						},
					},
				}),
			});

			const buildLogs = logs
				.filter((log) => log.level === 'warn' && log.label === 'build')
				.map((log) => log.message);

			assert.ok(
				buildLogs.some(
					(msg) =>
						msg.includes('from route `/[locale]/post/archive`') &&
						msg.includes('archive.astro') &&
						msg.includes('archive/index.astro'),
				),
				'Build conflict warning should include component file paths to disambiguate.',
			);
		});
	});
});
