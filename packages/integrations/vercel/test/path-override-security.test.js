import assert from 'node:assert/strict';
import { before, describe, it } from 'node:test';
import { loadFixture } from './test-utils.js';
import { URL } from 'node:url';

async function loadFunctionModule(fixture, functionName) {
	const functionConfig = JSON.parse(
		await fixture.readFile(`../.vercel/output/functions/${functionName}.func/.vc-config.json`),
	);
	const functionEntry = new URL(
		`../.vercel/output/functions/${functionName}.func/${functionConfig.handler}`,
		fixture.config.outDir,
	);

	return import(functionEntry);
}

describe('Vercel serverless path override security', () => {
	/** @type {import('./test-utils.js').Fixture} */
	let fixture;

	before(async () => {
		process.env.PRERENDER = true;
		fixture = await loadFixture({
			root: './fixtures/serverless-with-dynamic-routes/',
			output: 'server',
		});
		await fixture.build();
	});

	it('ignores untrusted x_astro_path query param on _render', async () => {
		const renderFunction = await loadFunctionModule(fixture, '_render');
		const response = await renderFunction.default.fetch(
			new Request('https://example.com/api/public?x_astro_path=/api/private'),
		);
		const body = await response.json();

		assert.equal(body.id, 'public');
	});

	it('ignores untrusted x-astro-path header on _render', async () => {
		const renderFunction = await loadFunctionModule(fixture, '_render');
		const response = await renderFunction.default.fetch(
			new Request('https://example.com/api/public', {
				headers: {
					'x-astro-path': '/api/private',
				},
			}),
		);
		const body = await response.json();

		assert.equal(body.id, 'public');
	});
});

describe('Vercel ISR path override', () => {
	/** @type {import('./test-utils.js').Fixture} */
	let fixture;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/isr/',
			output: 'server',
		});
		await fixture.build();
	});

	it('keeps x_astro_path query param support on _isr', async () => {
		const deploymentConfig = JSON.parse(await fixture.readFile('../.vercel/output/config.json'));
		const isrRoute = deploymentConfig.routes.find((route) => route.dest?.startsWith('/_isr?'));
		assert.ok(isrRoute);

		const isrDest = new URL(`https://example.com${isrRoute.dest}`);
		const middlewareSecret = isrDest.searchParams.get('x_astro_middleware_secret');
		assert.ok(middlewareSecret);

		const isrFunction = await loadFunctionModule(fixture, '_isr');
		const response = await isrFunction.default.fetch(
			new Request(
				`https://example.com/_isr?x_astro_path=/one&x_astro_middleware_secret=${middlewareSecret}`,
			),
		);
		const body = await response.text();

		assert.match(body, /<h1>One<\/h1>/);
	});
});
