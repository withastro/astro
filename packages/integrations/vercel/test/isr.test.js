import assert from 'node:assert/strict';
import { before, describe, it } from 'node:test';
import { loadFixture } from './test-utils.js';

describe('ISR', () => {
	/** @type {import('./test-utils.js').Fixture} */
	let fixture;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/isr/',
		});
		await fixture.build();
	});

	it('generates expected prerender config', async () => {
		const vcConfig = JSON.parse(
			await fixture.readFile('../.vercel/output/functions/_isr.prerender-config.json'),
		);
		assert.deepEqual(vcConfig, {
			expiration: 120,
			bypassToken: '1c9e601d-9943-4e7c-9575-005556d774a8',
			allowQuery: ['x_astro_path', 'x_astro_middleware_secret'],
			passQuery: true,
		});
	});

	it('generates expected routes', async () => {
		const deploymentConfig = JSON.parse(await fixture.readFile('../.vercel/output/config.json'));
		// the first two are /_astro/*, and filesystem routes
		const isrRoutes = deploymentConfig.routes.slice(2);
		for (const route of isrRoutes) {
			if (route.dest?.startsWith('/_isr?')) {
				assert.match(
					route.dest,
					/^\/_isr\?x_astro_path=\$0&x_astro_middleware_secret=[0-9a-f-]{36}$/,
				);
			}
		}
		assert.deepEqual(
			isrRoutes.map((route) => ({
				...route,
				dest: route.dest?.replace(
					/x_astro_middleware_secret=[^&]+/,
					'x_astro_middleware_secret=<secret>',
				),
			})),
			[
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
					dest: '/_isr?x_astro_path=$0&x_astro_middleware_secret=<secret>',
				},
				{
					src: '^/404/?$',
					dest: '/_isr?x_astro_path=$0&x_astro_middleware_secret=<secret>',
				},
				{
					dest: '_render',
					src: '^/.*$',
					status: 404,
				},
			],
		);
	});
});
