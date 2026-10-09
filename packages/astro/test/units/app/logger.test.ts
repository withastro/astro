import assert from 'node:assert/strict';
import { describe, it, before } from 'node:test';
import { App } from '../../../dist/core/app/app.js';
import { createComponent, render } from '../../../dist/runtime/server/index.js';
import { createManifest, createRouteInfo } from './test-helpers.ts';
import { makeRoute, staticPart } from '../routing/test-helpers.ts';
import { loadFixture, type Fixture } from '../../test-utils.ts';
import testAdapter from '../../test-adapter.ts';
import type { SSRManifest } from '../../../dist/core/app/types.js';
import jsonLoggerCreator from '../../../dist/core/logger/impls/json.js';

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

// Mirrors what the `virtual:astro:logger` module exports in a real build.
const jsonLogger: SSRManifest['logger'] = () => ({ default: jsonLoggerCreator() });

function createAppWithLogger(logger?: SSRManifest['logger']) {
	return new App(
		createManifest({
			routes: [createRouteInfo(indexRoute)],
			pageMap,
			logger,
		}),
	);
}

describe('SSR Logger', () => {
	it('adapterLogger stays stable while the logger destination is resolved in place', async () => {
		const app = createAppWithLogger(jsonLogger);

		// Access adapterLogger before getLogger(), caches it with the default options
		const beforeOptions = app.adapterLogger.options;
		const destinationBefore = app.logger.options.destination;

		await app.getLogger();

		// The logger is identity-stable: getLogger() swaps the destination in
		// place via setDestination() instead of replacing the instance, so the
		// cached adapterLogger keeps writing through the same options object.
		assert.notEqual(
			app.logger.options.destination,
			destinationBefore,
			'the custom destination should be swapped in on the same logger instance',
		);
		const afterOptions = app.adapterLogger.options;
		assert.equal(
			beforeOptions,
			afterOptions,
			'adapterLogger should not re-create — the logger identity is stable',
		);
	});

	it('resolves a custom logger destination from the manifest on first request', async () => {
		const app = createAppWithLogger(jsonLogger);

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
		const app = createAppWithLogger(jsonLogger);

		// The json logger destination does not define flush/close.
		// Verify that rendering (which calls flush internally) completes without error.
		const response = await app.render(new Request('http://example.com/'));
		assert.equal(response.status, 200);

		// Explicit flush should also be a safe no-op
		assert.doesNotThrow(() => app.logger.flush());
	});

	it('close does not throw when destination has no close method', async () => {
		const app = createAppWithLogger(jsonLogger);

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
				logger: {
					entrypoint: 'astro/logger/json',
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
