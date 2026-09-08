import assert from 'node:assert/strict';
import { before, describe, it } from 'node:test';
import { type Fixture, loadFixture } from './test-utils.ts';

describe('ISR', () => {
	let fixture: Fixture;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/isr/',
		});
		await fixture.build({});
	});

	it('generates expected prerender config', { timeout: 30000 }, async () => {
		const vcConfig = JSON.parse(
			await fixture.readFile('../.vercel/output/functions/_isr.prerender-config.json'),
		);
		assert.deepEqual(vcConfig, {
			expiration: 120,
			bypassToken: '1c9e601d-9943-4e7c-9575-005556d774a8',
			allowQuery: ['x_astro_path', 'x_astro_path_token'],
			passQuery: true,
		});
	});

	it('generates expected routes', { timeout: 30000 }, async () => {
		const deploymentConfig = JSON.parse(await fixture.readFile('../.vercel/output/config.json'));
		// The path token embedded in the ISR rewrites is a random per-build value,
		// so normalize it to a stable placeholder before comparing.
		const routes = deploymentConfig.routes.slice(2).map((route: Record<string, unknown>) => {
			if (typeof route.dest === 'string') {
				return {
					...route,
					dest: route.dest.replace(/x_astro_path_token=[^&]+/, 'x_astro_path_token=$TOKEN'),
				};
			}
			return route;
		});
		// the first two are /_astro/*, and filesystem routes
		assert.deepEqual(routes, [
			{
				src: '^/two$',
				dest: '_render',
			},
			{
				src: '^/excluded/([^/]+?)$',
				dest: '_render',
			},
			{
				src: '^/excluded(?:/(.*?))?$',
				dest: '_render',
			},
			{
				src: '^/api/([^/]+?)$',
				dest: '_render',
			},
			{
				src: '^/api$',
				dest: '_render',
			},
			{
				src: '^/_server-islands/([^/]+?)/?$',
				dest: '_render',
			},
			{
				src: '^/_image/?$',
				dest: '_render',
			},
			{
				src: '^/one/?$',
				dest: '/_isr?x_astro_path=$0&x_astro_path_token=$TOKEN',
			},
			{
				src: '^/404/?$',
				dest: '/_isr?x_astro_path=$0&x_astro_path_token=$TOKEN',
			},
			{
				dest: '_render',
				src: '^/.*$',
				status: 404,
			},
		]);
	});

	it('allow-lists every query param used in the ISR rewrite', { timeout: 30000 }, async () => {
		// Vercel strips any query param not present in `allowQuery` before invoking
		// the ISR function. If the rewrite `dest` references a param that isn't
		// allow-listed (e.g. the path token), that param never reaches the
		// entrypoint and every ISR route 404s. Assert the two stay in sync.
		const prerenderConfig = JSON.parse(
			await fixture.readFile('../.vercel/output/functions/_isr.prerender-config.json'),
		);
		const token = await readPathToken();
		const isrRoute = new URL(
			`https://example.com/_isr?x_astro_path=/one&x_astro_path_token=${token}`,
		);
		for (const param of isrRoute.searchParams.keys()) {
			assert.ok(
				prerenderConfig.allowQuery.includes(param),
				`ISR rewrite param "${param}" must be present in allowQuery`,
			);
		}
	});

	async function loadIsrFunction() {
		const functionConfig = JSON.parse(
			await fixture.readFile('../.vercel/output/functions/_isr.func/.vc-config.json'),
		);
		const functionEntry = new URL(
			`../.vercel/output/functions/_isr.func/${functionConfig.handler}`,
			fixture.config.outDir,
		);
		return import(functionEntry.href);
	}

	async function readPathToken() {
		const deploymentConfig = JSON.parse(await fixture.readFile('../.vercel/output/config.json'));
		const isrRoute = deploymentConfig.routes.find(
			(route: { dest?: string }) =>
				typeof route.dest === 'string' && route.dest.startsWith('/_isr?'),
		);
		return new URL(isrRoute.dest, 'https://example.com').searchParams.get('x_astro_path_token');
	}

	it('ignores x_astro_path without a valid path token', { timeout: 30000 }, async () => {
		const isrFunction = await loadIsrFunction();
		const response = await isrFunction.default.fetch(
			new Request('https://example.com/_isr?x_astro_path=/one'),
		);
		// Without the build's token the override is ignored, so `/_isr` matches no
		// route and does not render the target page.
		assert.equal(response.status, 404);
		assert.equal((await response.text()).includes('<h1>One</h1>'), false);
	});

	it('ignores x_astro_path when only the x-vercel-isr header is set', {
		timeout: 30000,
	}, async () => {
		const isrFunction = await loadIsrFunction();
		const response = await isrFunction.default.fetch(
			new Request('https://example.com/_isr?x_astro_path=/one', {
				headers: { 'x-vercel-isr': '1' },
			}),
		);
		assert.equal(response.status, 404);
		assert.equal((await response.text()).includes('<h1>One</h1>'), false);
	});

	it('honors x_astro_path when the valid path token is present', { timeout: 30000 }, async () => {
		const isrFunction = await loadIsrFunction();
		const token = await readPathToken();
		const response = await isrFunction.default.fetch(
			new Request(`https://example.com/_isr?x_astro_path=/one&x_astro_path_token=${token}`),
		);
		assert.equal(response.status, 200);
		assert.equal((await response.text()).includes('<h1>One</h1>'), true);
	});
});
