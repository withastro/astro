import * as assert from 'node:assert/strict';
import { before, describe, it } from 'node:test';
import { loadFixture } from '@astrojs/test-utils';
import cloudflare from '../dist/index.js';

/** @type {import('./test-utils.js').Fixture} */
describe('_routes.json generation', () => {
	describe('of on-demand and prerenderd', () => {
		let fixture;

		before(async () => {
			fixture = await loadFixture({
				root: new URL('./fixtures/routes-json/', import.meta.url).toString(),
				srcDir: './src/mixed',
				adapter: cloudflare({}),
			});
			await fixture.build();
		});

		it('creates `include` for on-demand and `exclude` for prerenderd', async () => {
			const _routesJson = await fixture.readFile('/_routes.json');
			const routes = JSON.parse(_routesJson);

			assert.deepEqual(routes, {
				version: 1,
				include: ['/_image', '/a/*'],
				exclude: ['/a', '/a/redirect', '/404', '/b', '/public.txt', '/_astro/*', '/redirectme'],
			});
		});
	});

	describe('of only on-demand', () => {
		let fixture;

		before(async () => {
			fixture = await loadFixture({
				root: new URL('./fixtures/routes-json/', import.meta.url).toString(),
				srcDir: './src/dynamicOnly',
				adapter: cloudflare({}),
			});
			await fixture.build();
		});

		it('creates a wildcard `include` and `exclude` only for static assets and redirects', async () => {
			const _routesJson = await fixture.readFile('/_routes.json');
			const routes = JSON.parse(_routesJson);

			assert.deepEqual(routes, {
				version: 1,
				include: ['/*'],
				exclude: ['/a/redirect', '/public.txt', '/_astro/*', '/redirectme'],
			});
		});
	});

	describe('of only prerenderd', () => {
		let fixture;

		before(async () => {
			fixture = await loadFixture({
				root: new URL('./fixtures/routes-json/', import.meta.url).toString(),
				srcDir: './src/staticOnly',
				adapter: cloudflare({}),
			});
			await fixture.build();
		});

		it('create only one `include` and `exclude` that are supposed to match nothing', async () => {
			const _routesJson = await fixture.readFile('/_routes.json');
			const routes = JSON.parse(_routesJson);

			assert.deepEqual(routes, {
				version: 1,
				include: ['/_image'],
				exclude: ['/', '/a/redirect', '/404', '/public.txt', '/_astro/*', '/redirectme'],
			});
		});
	});

	describe('with additional `include` entries', () => {
		let fixture;

		before(async () => {
			fixture = await loadFixture({
				root: new URL('./fixtures/routes-json/', import.meta.url).toString(),
				srcDir: './src/mixed',
				adapter: cloudflare({
					routes: {
						extend: {
							include: [{ pattern: '/another' }],
						},
					},
				}),
			});
			await fixture.build();
		});

		it('creates `include` for functions and `exclude` for static files where needed', async () => {
			const _routesJson = await fixture.readFile('/_routes.json');
			const routes = JSON.parse(_routesJson);

			assert.deepEqual(routes, {
				version: 1,
				include: ['/_image', '/a/*', '/another'],
				exclude: ['/a', '/a/redirect', '/404', '/b', '/public.txt', '/_astro/*', '/redirectme'],
			});
		});
	});

	describe('with additional `exclude` entries', () => {
		let fixture;

		before(async () => {
			fixture = await loadFixture({
				root: new URL('./fixtures/routes-json/', import.meta.url).toString(),
				srcDir: './src/mixed',
				adapter: cloudflare({
					routes: {
						extend: {
							exclude: [{ pattern: '/another' }, { pattern: '/a/index.html' }],
						},
					},
				}),
			});
			await fixture.build();
		});

		it('creates `include` for functions and `exclude` for static files where needed', async () => {
			const _routesJson = await fixture.readFile('/_routes.json');
			const routes = JSON.parse(_routesJson);

			assert.deepEqual(routes, {
				version: 1,
				include: ['/_image', '/a/*'],
				exclude: [
					'/a',
					'/a/redirect',
					'/404',
					'/b',
					'/public.txt',
					'/_astro/*',
					'/redirectme',
					'/another',
					'/a/index.html',
				],
			});
		});
	});
});
