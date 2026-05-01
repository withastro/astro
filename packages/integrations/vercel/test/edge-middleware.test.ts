import assert from 'node:assert/strict';
import { before, describe, it } from 'node:test';
import { type Fixture, loadFixture, getVercelConfig } from './test-utils.ts';

describe('Vercel edge middleware', () => {
	let build: Fixture;
	before(async () => {
		build = await loadFixture({
			root: './fixtures/middleware-with-edge-file/',
		});
		await build.build({});
	});

	it('an edge function is created', async () => {
		const contents = await build.readFile(
			'../.vercel/output/functions/_middleware.func/.vc-config.json',
		);
		const contentsJSON = JSON.parse(contents);
		assert.equal(contentsJSON.runtime, 'edge');
		assert.equal(contentsJSON.entrypoint, 'middleware.mjs');
	});

	it('deployment config points to the middleware edge function', async () => {
		const { routes } = await getVercelConfig(build);
		assert.equal(
			routes.some((route) => route.dest === '_middleware'),
			true,
		);
	});

	it('edge sets Set-Cookie headers', async () => {
		const entry = new URL(
			'../.vercel/output/functions/_middleware.func/middleware.mjs',
			build.config.outDir,
		);
		const module = await import(entry.href);
		const request = new Request('http://example.com/foo');
		const response = await module.default(request, {});
		assert.equal(response.headers.get('set-cookie'), 'foo=bar');
		assert.ok((await response.text()).length, 'Body is included');
	});

	it('edge middleware forwards HTTP method and body', async () => {
		const entry = new URL(
			'../.vercel/output/functions/_middleware.func/middleware.mjs',
			build.config.outDir,
		);
		const module = await import(entry.href);

		const originalFetch = globalThis.fetch;
		let captured: RequestInit | undefined;
		globalThis.fetch = async (_url, opts) => {
			captured = opts;
			return new Response('ok', { status: 200 });
		};
		try {
			const request = new Request('http://example.com/api/test', {
				method: 'POST',
				body: '{"data":"test"}',
				headers: { 'Content-Type': 'application/json' },
			});
			await module.default(request, {});
			assert.ok(captured, 'fetch was called');
			assert.equal(captured.method, 'POST', 'forwards the HTTP method');
			assert.ok(captured.body, 'forwards the request body');
		} finally {
			globalThis.fetch = originalFetch;
		}
	});

	// TODO: The path here seems to be inconsistent?
	it.skip('with edge handle file, should successfully build the middleware', async () => {
		const fixture = await loadFixture({
			root: './fixtures/middleware-with-edge-file/',
		});
		await fixture.build({});
		const _contents = await fixture.readFile(
			// this is abysmal...
			'../.vercel/output/functions/render.func/www/withastro/astro/packages/vercel/test/fixtures/middleware-with-edge-file/dist/middleware.mjs',
		);
		// assert.equal(contents.includes('title:')).to.be.true;
		// chaiJestSnapshot.setTestName('Middleware with handler file');
		// assert.equal(contents).to.matchSnapshot(true);
	});

	// TODO: The path here seems to be inconsistent?
	it.skip('without edge handle file, should successfully build the middleware', async () => {
		const fixture = await loadFixture({
			root: './fixtures/middleware-without-edge-file/',
		});
		await fixture.build({});
		const _contents = await fixture.readFile(
			// this is abysmal...
			'../.vercel/output/functions/render.func/www/withastro/astro/packages/vercel/test/fixtures/middleware-without-edge-file/dist/middleware.mjs',
		);
		// assert.equal(contents.includes('title:')).to.be.false;
		// chaiJestSnapshot.setTestName('Middleware without handler file');
		// assert.equal(contents).to.matchSnapshot(true);
	});
});
