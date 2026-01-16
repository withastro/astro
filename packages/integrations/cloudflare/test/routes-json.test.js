import * as assert from 'node:assert/strict';
import { before, describe, it } from 'node:test';
import cloudflare from '../dist/index.js';
import { loadFixture } from './_test-utils.js';

describe('_routes.json generation', () => {
	describe('of on-demand and prerenderd', () => {
		/** @type {import('../../../astro/test/test-utils').Fixture} */
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
				include: ['/_server-islands/*', '/_image', '/a/*'],
				exclude: ['/_astro/*', '/redirectme', '/public.txt', '/a', '/a/redirect', '/404', '/b'],
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
				exclude: ['/_astro/*', '/redirectme', '/public.txt', '/a/*'],
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

		it(
			'create only one `include` and `exclude` that are supposed to match nothing',
			{ todo: 'Review test, because the expectation is to have empty include and exclude.' },
			async () => {
				const _routesJson = await fixture.readFile('/_routes.json');
				const routes = JSON.parse(_routesJson);

				assert.deepEqual(routes, {
					version: 1,
					include: ['/_server-islands/*'],
					exclude: ['/', '/_astro/*', '/redirectme', '/public.txt', '/a/*', '/404'],
				});
			},
		);
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
				include: ['/_server-islands/*', '/_image', '/a/*', '/another'],
				exclude: ['/_astro/*', '/redirectme', '/public.txt', '/a', '/a/redirect', '/404', '/b'],
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
				include: ['/_server-islands/*', '/_image', '/a/*'],
				exclude: [
					'/_astro/*',
					'/redirectme',
					'/public.txt',
					'/a',
					'/a/redirect',
					'/404',
					'/b',
					'/another',
					'/a/index.html',
				],
			});
		});
	});

	describe('with nested on demand and prerendered routes', () => {
		let fixture;

		before(async () => {
			fixture = await loadFixture({
				root: new URL('./fixtures/routes-json/', import.meta.url).toString(),
				srcDir: './src/reduceComplexity',
				adapter: cloudflare({}),
			});
			await fixture.build();
		});

		it('reduces the amount of include and exclude entries by applying wildcards wherever possible', async () => {
			const _routesJson = await fixture.readFile('/_routes.json');
			const routes = JSON.parse(_routesJson);

			assert.deepEqual(routes, {
				version: 1,
				include: [
					'/',
					'/_server-islands/*',
					'/_image',
					'/dynamicPages/*',
					'/mixedPages/dynamic',
					'/mixedPages/subfolder/dynamic',
				],
				exclude: [
					'/_astro/*',
					'/redirectme',
					'/public.txt',
					'/a/*',
					'/404',
					'/mixedPages/static',
					'/mixedPages/subfolder/static',
					'/staticPages/*',
				],
			});
		});
	});

	describe('with many static files', () => {
		let fixture;

		before(async () => {
			fixture = await loadFixture({
				root: new URL('./fixtures/routes-json/', import.meta.url).toString(),
				srcDir: './src/manyStatic',
				adapter: cloudflare({}),
			});
			await fixture.build();
		});

		it('creates a wildcard `include` and `exclude` for as many static assets and redirects as possible, truncating after 100 rules', async () => {
			const _routesJson = await fixture.readFile('/_routes.json');
			const routes = JSON.parse(_routesJson);

			assert.deepEqual(routes, {
				version: 1,
				include: ['/*'],
				exclude: [
					'/_astro/*',
					'/redirectme',
					'/public.txt',
					'/a/*',
					...Array.from({ length: 95 }, (_, i) => `/${i}`),
				],
			});
		});
	});

	describe('with many static files when a static 404 is present', () => {
		let fixture;

		before(async () => {
			fixture = await loadFixture({
				root: new URL('./fixtures/routes-json/', import.meta.url).toString(),
				srcDir: './src/manyStaticWith404',
				adapter: cloudflare({}),
			});
			await fixture.build();
		});

		it('creates `include` for on-demand and `exclude` that are supposed to match nothing', async () => {
			const _routesJson = await fixture.readFile('/_routes.json');
			const routes = JSON.parse(_routesJson);

			assert.deepEqual(routes, {
				version: 1,
				include: ['/*'],
				exclude: [
					'/_astro/*',
					'/redirectme',
					'/public.txt',
					'/a/*',
					'/404',
					'/0',
					'/1',
					'/2',
					'/3',
					'/4',
					'/5',
					'/6',
					'/7',
					'/8',
					'/9',
					'/10',
					'/11',
					'/12',
					'/13',
					'/14',
					'/15',
					'/16',
					'/17',
					'/18',
					'/19',
					'/20',
					'/21',
					'/22',
					'/23',
					'/24',
					'/25',
					'/26',
					'/27',
					'/28',
					'/29',
					'/30',
					'/31',
					'/32',
					'/33',
					'/34',
					'/35',
					'/36',
					'/37',
					'/38',
					'/39',
					'/40',
					'/41',
					'/42',
					'/43',
					'/44',
					'/45',
					'/46',
					'/47',
					'/48',
					'/49',
					'/50',
					'/51',
					'/52',
					'/53',
					'/54',
					'/55',
					'/56',
					'/57',
					'/58',
					'/59',
					'/60',
					'/61',
					'/62',
					'/63',
					'/64',
					'/65',
					'/66',
					'/67',
					'/68',
					'/69',
					'/70',
					'/71',
					'/72',
					'/73',
					'/74',
					'/75',
					'/76',
					'/77',
					'/78',
					'/79',
					'/80',
					'/81',
					'/82',
					'/83',
					'/84',
					'/85',
					'/86',
					'/87',
					'/88',
					'/89',
					'/90',
					'/91',
					'/92',
					'/93',
				],
			});
		});
	});
});
