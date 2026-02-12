import * as assert from 'node:assert/strict';
import { before, describe, it } from 'node:test';
import node from '../dist/index.js';
import { createRequestAndResponse, loadFixture } from './test-utils.js';

describe('Node Adapter Headers', () => {
	/** @type {import('./test-utils').Fixture} */
	let fixture;

	describe('streaming', () => {
		before(async () => {
			fixture = await loadFixture({
				root: './fixtures/headers/',
				output: 'server',
				adapter: node({
					serverEntrypoint: new URL('./fixtures/headers/src/server.js', import.meta.url),
				}),
			});
			await fixture.build();
		});

		it('Endpoint Simple Headers', async () => {
			await runTest('/endpoints/simple', {
				'content-type': 'text/plain;charset=utf-8',
				'x-hello': 'world',
			});
		});

		it('Endpoint Astro Single Cookie Header', async () => {
			await runTest('/endpoints/astro-cookies-single', {
				'content-type': 'text/plain;charset=utf-8',
				'set-cookie': 'from1=astro1',
			});
		});

		it('Endpoint Astro Multi Cookie Header', async () => {
			await runTest('/endpoints/astro-cookies-multi', {
				'content-type': 'text/plain;charset=utf-8',
				'set-cookie': ['from1=astro1', 'from2=astro2'],
			});
		});

		it('Endpoint Response Single Cookie Header', async () => {
			await runTest('/endpoints/response-cookies-single', {
				'content-type': 'text/plain;charset=utf-8',
				'set-cookie': 'hello1=world1',
			});
		});

		it('Endpoint Response Multi Cookie Header', async () => {
			await runTest('/endpoints/response-cookies-multi', {
				'content-type': 'text/plain;charset=utf-8',
				'set-cookie': ['hello1=world1', 'hello2=world2'],
			});
		});

		it('Endpoint Complex Headers Kitchen Sink', async () => {
			await runTest('/endpoints/kitchen-sink', {
				'content-type': 'text/plain;charset=utf-8',
				'x-single': 'single',
				'x-triple': 'one, two, three',
				'set-cookie': ['hello1=world1', 'hello2=world2'],
			});
		});

		it('Endpoint Astro and Response Single Cookie Header', async () => {
			await runTest('/endpoints/astro-response-cookie-single', {
				'content-type': 'text/plain;charset=utf-8',
				'set-cookie': ['from1=response1', 'from1=astro1'],
			});
		});

		it('Endpoint Astro and Response Multi Cookie Header', async () => {
			await runTest('/endpoints/astro-response-cookie-multi', {
				'content-type': 'text/plain;charset=utf-8',
				'set-cookie': ['from1=response1', 'from2=response2', 'from3=astro1', 'from4=astro2'],
			});
		});

		it('Endpoint Response Empty Headers Object', async () => {
			await runTest('/endpoints/response-empty-headers-object', {
				'content-type': 'text/plain;charset=UTF-8',
			});
		});

		it('Endpoint Response undefined Headers Object', async () => {
			await runTest('/endpoints/response-undefined-headers-object', {
				'content-type': 'text/plain;charset=UTF-8',
			});
		});

		it('Component Astro Single Cookie Header', async () => {
			await runTest('/astro/component-astro-cookies-single', {
				'content-type': 'text/html',
				'set-cookie': 'from1=astro1',
			});
		});

		it('Component Astro Multi Cookie Header', async () => {
			await runTest('/astro/component-astro-cookies-multi', {
				'content-type': 'text/html',
				'set-cookie': ['from1=astro1', 'from2=astro2'],
			});
		});

		it('Component Response Single Cookie Header', async () => {
			await runTest('/astro/component-response-cookies-single', {
				'content-type': 'text/html',
				'set-cookie': 'from1=value1',
			});
		});

		it('Component Response Multi Cookie Header', async () => {
			await runTest('/astro/component-response-cookies-multi', {
				'content-type': 'text/html',
				'set-cookie': ['from1=value1', 'from2=value2'],
			});
		});

		it('Component Astro and Response Single Cookie Header', async () => {
			await runTest('/astro/component-astro-response-cookie-single', {
				'content-type': 'text/html',
				'set-cookie': ['from1=response1', 'from1=astro1'],
			});
		});

		it('Component Astro and Response Multi Cookie Header', async () => {
			await runTest('/astro/component-astro-response-cookie-multi', {
				'content-type': 'text/html',
				'set-cookie': ['from1=response1', 'from2=response2', 'from3=astro1', 'from4=astro2'],
			});
		});

		// TODO: needs e2e tests to check real headers
		it('sends several chunks', async () => {
			const { nodeHandler } = await fixture.loadAdapterEntryModule();

			const { req, res, done } = createRequestAndResponse({
				method: 'GET',
				url: '/astro/component-simple',
			});

			nodeHandler(req, res);

			req.send();

			const chunks = await done;
			assert.equal(chunks.length, 3);
		});
	});

	describe('without streaming', () => {
		before(async () => {
			fixture = await loadFixture({
				root: './fixtures/headers/',
				output: 'server',
				adapter: node({
					serverEntrypoint: new URL('./fixtures/headers/src/server.js', import.meta.url),
					experimentalDisableStreaming: true,
				}),
			});
			await fixture.build();
		});

		// TODO: needs e2e tests to check real headers
		it('sends a single chunk', async () => {
			const { nodeHandler } = await fixture.loadAdapterEntryModule();

			const { req, res, done } = createRequestAndResponse({
				method: 'GET',
				url: '/astro/component-simple',
			});

			nodeHandler(req, res);

			req.send();

			const chunks = await done;
			assert.equal(chunks.length, 1);
		});
	});
});

async function runTest(url, expectedHeaders) {
	const { nodeHandler } = await fixture.loadAdapterEntryModule();

	const { req, res, done } = createRequestAndResponse({
		method: 'GET',
		url,
	});

	nodeHandler(req, res);

	req.send();

	await done;
	const headers = res.getHeaders();

	assert.deepEqual(headers, expectedHeaders);
}
