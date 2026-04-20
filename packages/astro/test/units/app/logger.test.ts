import assert from 'node:assert/strict';
import { describe, it, before } from 'node:test';
import { App } from '../../../dist/core/app/app.js';
import type { AstroLoggerDestination, AstroLoggerMessage } from '../../../dist/core/logger/core.js';
import { createComponent, render } from '../../../dist/runtime/server/index.js';
import { createManifest, createRouteInfo } from './test-helpers.js';
import { makeRoute, staticPart } from '../routing/test-helpers.js';
import { loadFixture } from '../../test-utils.js';
import testAdapter from '../../test-adapter.js';

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

function createSpyDestination(overrides: Partial<AstroLoggerDestination<AstroLoggerMessage>> = {}) {
	const calls: string[] = [];
	const destination: AstroLoggerDestination<AstroLoggerMessage> = {
		write() {},
		flush() {
			calls.push('flush');
		},
		close() {
			calls.push('close');
		},
		...overrides,
	};
	return { destination, calls };
}

function createAppWithLogger(
	logger?: () => { default: AstroLoggerDestination<AstroLoggerMessage> },
) {
	return new App(
		createManifest({
			routes: [createRouteInfo(indexRoute)],
			pageMap,
			logger,
		}),
	);
}

describe('SSR Logger', () => {
	it('resolves a custom logger destination from the manifest on first request', async () => {
		const { destination } = createSpyDestination();
		const app = createAppWithLogger(() => ({ default: destination }));

		await app.render(new Request('http://example.com/'));

		assert.equal(
			app.logger.options.destination,
			destination,
			'Logger destination should be the custom one after first request',
		);
	});

	it('falls back to console logger when no custom logger is configured', async () => {
		const app = createAppWithLogger();

		const response = await app.render(new Request('http://example.com/'));
		assert.equal(response.status, 200);
	});

	it('calls flush on the logger destination after each response', async () => {
		const { destination, calls } = createSpyDestination();
		const app = createAppWithLogger(() => ({ default: destination }));

		await app.render(new Request('http://example.com/'));
		const flushCountAfterFirst = calls.filter((c) => c === 'flush').length;
		assert.ok(flushCountAfterFirst > 0, 'flush() should have been called');

		await app.render(new Request('http://example.com/'));
		const flushCountAfterSecond = calls.filter((c) => c === 'flush').length;
		assert.ok(
			flushCountAfterSecond > flushCountAfterFirst,
			'flush() should be called on subsequent requests too',
		);
	});

	it('calls close on the logger destination', async () => {
		const { destination, calls } = createSpyDestination();
		const app = createAppWithLogger(() => ({ default: destination }));

		await app.render(new Request('http://example.com/'));
		app.logger.close();

		assert.ok(calls.includes('close'), 'close() should have been called on the destination');
	});

	describe('build', () => {
		let fixture: Fixture;

		before(async () => {
			fixture = await loadFixture({
				root: './fixtures/ssr-assets/',
				outDir: './dist/ssr-logger/',
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
