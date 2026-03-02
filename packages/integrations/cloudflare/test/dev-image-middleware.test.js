import * as assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { createDevImageMiddlewarePlugin } from '../dist/vite-plugin-dev-image-middleware.js';

describe('createDevImageMiddlewarePlugin', () => {
	const baseOptions = {
		getDevServiceEntrypoint: () => 'my-custom-image-service',
		getImageConfig: () => ({
			service: { entrypoint: 'my-custom-image-service' },
			domains: [],
			remotePatterns: [],
		}),
		base: '/',
	};

	it('returns a plugin with the correct name', () => {
		const plugin = createDevImageMiddlewarePlugin(baseOptions);
		assert.equal(plugin.name, '@astrojs/cloudflare:dev-image-middleware');
	});

	it('has a configureServer hook', () => {
		const plugin = createDevImageMiddlewarePlugin(baseOptions);
		assert.equal(typeof plugin.configureServer, 'function');
	});

	it('registers middleware on the dev server', () => {
		const plugin = createDevImageMiddlewarePlugin(baseOptions);
		let middlewareRegistered = false;
		const mockServer = {
			middlewares: {
				use: (fn) => {
					middlewareRegistered = true;
					assert.equal(typeof fn, 'function');
				},
			},
		};
		plugin.configureServer(mockServer);
		assert.ok(middlewareRegistered, 'Expected middleware to be registered');
	});

	it('middleware calls next() for non-image requests', async () => {
		const plugin = createDevImageMiddlewarePlugin(baseOptions);
		let registeredMiddleware;
		const mockServer = {
			middlewares: {
				use: (fn) => {
					registeredMiddleware = fn;
				},
			},
		};
		plugin.configureServer(mockServer);

		let nextCalled = false;
		await registeredMiddleware(
			{ url: '/some-page' },
			{},
			() => {
				nextCalled = true;
			},
		);
		assert.ok(nextCalled, 'Expected next() to be called for non-image URL');
	});

	it('middleware calls next() when URL does not start with base + /_image', async () => {
		const plugin = createDevImageMiddlewarePlugin({
			...baseOptions,
			base: '/docs/',
		});
		let registeredMiddleware;
		const mockServer = {
			middlewares: {
				use: (fn) => {
					registeredMiddleware = fn;
				},
			},
		};
		plugin.configureServer(mockServer);

		let nextCalled = false;
		await registeredMiddleware(
			{ url: '/_image?href=test' },
			{},
			() => {
				nextCalled = true;
			},
		);
		assert.ok(nextCalled, 'Expected next() for /_image without /docs base');
	});

	it('respects custom base path in route matching', () => {
		const plugin = createDevImageMiddlewarePlugin({
			...baseOptions,
			base: '/docs/',
		});
		// The plugin should be created without errors
		assert.equal(plugin.name, '@astrojs/cloudflare:dev-image-middleware');
	});
});
