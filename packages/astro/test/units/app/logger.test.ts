import assert from 'node:assert/strict';
import { describe, it, before } from 'node:test';
import { App } from '../../../dist/core/app/app.js';
import { createComponent, render } from '../../../dist/runtime/server/index.js';
import { createManifest, createRouteInfo } from './test-helpers.ts';
import { makeRoute, staticPart } from '../routing/test-helpers.ts';
import { loadFixture, type Fixture } from '../../test-utils.ts';
import testAdapter from '../../test-adapter.ts';
import type { LoggerHandlerConfig } from '../../../dist/core/logger/config.js';

const okPage = createComponent(() => {
	return render`<h1>Ok</h1>`;
});

const indexRoute = makeRoute({
	route: '/',
	pathname: '/',
	segments: [[staticPart('')]],
	trailingSlash: 'ignore',
	isIndex: true,
	component: 'src/pages/index.astro',
});

const pageMap = new Map([
	[
		indexRoute.component,
		async () => ({
			page: async () => ({
				default: okPage,
			}),
		}),
	],
]);

function createAppWithLogger(experimentalLogger?: LoggerHandlerConfig) {
	return new App(
		createManifest({
			routes: [createRouteInfo(indexRoute)],
			pageMap,
			experimentalLogger,
		}),
	);
}

describe('SSR Logger', () => {
	it('resolves a custom logger destination from the manifest on first request', async () => {
		const app = createAppWithLogger({ entrypoint: 'astro/logger/json' });

		await app.render(new Request('http://example.com/'));

		const destination = app.logger.options.destination;
		assert.ok(destination, 'Logger destination should exist');
		assert.ok(
			typeof destination.write === 'function',
			'Logger destination should have a write method',
		);
	});

	it('falls back to console logger when no custom logger is configured', async () => {
		const app = createAppWithLogger();

		const response = await app.render(new Request('http://example.com/'));
		assert.equal(response.status, 200);
	});

	it('flush does not throw when destination has no flush method', async () => {
		const app = createAppWithLogger({ entrypoint: 'astro/logger/json' });

		// The json logger destination does not define flush/close.
		// Verify that rendering (which calls flush internally) completes without error.
		const response = await app.render(new Request('http://example.com/'));
		assert.equal(response.status, 200);

		// Explicit flush should also be a safe no-op
		assert.doesNotThrow(() => app.logger.flush());
	});

	it('close does not throw when destination has no close method', async () => {
		const app = createAppWithLogger({ entrypoint: 'astro/logger/json' });

		await app.render(new Request('http://example.com/'));

		// Explicit close should be a safe no-op when the destination doesn't define it
		assert.doesNotThrow(() => app.logger.close());
	});

	describe('build', () => {
		let fixture: Fixture;

		before(async () => {
			fixture = await loadFixture({
				root: './fixtures/ssr-assets/',
				outDir: './dist/ssr-logger/',
				cacheDir: './node_modules/.astro-test/ssr-logger/',
				output: 'server',
				adapter: testAdapter(),
				build: { inlineStylesheets: 'never' },
				experimental: {
					logger: {
						entrypoint: 'astro/logger/json',
					},
				},
			});
			await fixture.build();
		});

		it('bundles the custom logger and resolves it at runtime', async () => {
			const app = await fixture.loadTestAdapterApp();
			const response = await app.render(new Request('http://example.com/'));
			assert.equal(response.status, 200);

			const destination = app.logger.options.destination;
			assert.ok(destination, 'Logger destination should exist');
			assert.ok(destination.write, 'Logger destination should have a write method');
		});
	});
});
