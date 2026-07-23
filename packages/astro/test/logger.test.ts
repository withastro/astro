import assert from 'node:assert/strict';
import { before, describe, it } from 'node:test';
import { type DevServer, type Fixture, loadFixture } from './test-utils.ts';
import testAdapter from './test-adapter.ts';

describe('Logger', () => {
	// The custom logger (`./src/logger.mjs`) is configured through a relative entrypoint,
	// which must be resolved against the project root — not astro core's location — in
	// every context: the config logger used during dev and build, and the bundled
	// `virtual:astro:logger` module used at runtime (SSR).
	describe('relative entrypoint', () => {
		let fixture: Fixture;

		before(async () => {
			fixture = await loadFixture({
				root: './fixtures/ssr-assets/',
				outDir: './dist/logger-relative-entrypoint/',
				cacheDir: './node_modules/.astro-test/logger-relative-entrypoint/',
				output: 'server',
				adapter: testAdapter(),
				// The harness defaults to `silent`, which would filter out the info-level
				// events we assert on. Our custom destination replaces console, so this
				// doesn't produce log spam.
				logLevel: 'info',
				logger: {
					entrypoint: './src/logger.mjs',
				},
			});
		});

		it('resolves and uses the relative logger during dev', async () => {
			// The relative logger records every event it receives on `globalThis`.
			const events = ((globalThis as any).__astroLoggerEvents ??= []);
			const countBefore = events.length;
			let devServer: DevServer | undefined;
			try {
				devServer = await fixture.startDevServer();
				await fixture.fetch('/');
				// If the relative entrypoint had failed to resolve, dev would have thrown
				// before recording any event.
				assert.ok(
					events.length > countBefore,
					'The relative logger should have received dev events',
				);
			} finally {
				await devServer?.stop();
			}
		});

		it('resolves and uses the relative logger during build', async () => {
			const events = ((globalThis as any).__astroLoggerEvents ??= []);
			const countBefore = events.length;
			await fixture.build();
			assert.ok(
				events.length > countBefore,
				'The relative logger should have received build events',
			);
		});

		it('bundles and uses the relative logger at runtime (SSR)', async () => {
			// Relies on the build from the previous test.
			const app = await fixture.loadTestAdapterApp();
			const response = await app.render(new Request('http://example.com/'));
			assert.equal(response.status, 200);

			const destination = app.logger.options.destination;
			assert.ok(destination, 'Logger destination should exist');
			// Proves the relative module was bundled into `virtual:astro:logger`, rather
			// than falling back to a built-in destination.
			// @ts-expect-error __custom is not part of the destination type
			assert.equal(destination.__custom, true, 'Should use the custom relative logger');
		});
	});
});
