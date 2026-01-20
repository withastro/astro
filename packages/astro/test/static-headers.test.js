import { after, before, describe, it } from 'node:test';
import { loadFixture } from './test-utils.js';
import testAdapter from './test-adapter.js';
import assert from 'node:assert/strict';

describe('Static headers in dev', () => {
	/** @type {import('./test-utils').Fixture} */
	let fixture;
	let server;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/static-headers/',
			output: 'server',
			adapter: testAdapter({
				staticHeaders: true,
			}),
		});

		server = await fixture.startDevServer();
	});

	after(async () => {
		await server.stop();
	});

	it('should emit the static header for pages that are static', async () => {
		const res = await fixture.fetch('/static');
		assert.equal(res.headers.get('x-custom-header'), 'static');
	});

	it('should not the static header for non-static pages that do not have prerender flag', async () => {
		const res = await fixture.fetch('/');
		assert.equal(res.headers.get('x-custom-header'), null, 'it should not contain the / headers');
	});
	it('should not the static header for non-static pages that do have prerender flag', async () => {
		const res = await fixture.fetch('/dynamic');
		assert.equal(
			res.headers.get('x-custom-header'),
			null,
			'it should not contain the /dynamioc headers',
		);
	});
});

describe('Static headers after build', () => {
	/** @type {import('./test-utils').Fixture} */
	let fixture;
	let staticHeaders;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/static-headers/',
			output: 'server',
			adapter: testAdapter({
				staticHeaders: true,
				setRouteToHeaders(payload) {
					staticHeaders = payload;
				},
			}),
		});

		await fixture.build();
	});

	it('should emit the static header for pages that are static', async () => {
		try {
			await fixture.readFile('/client/static/index.html');
			const pageHeaders = staticHeaders.get('/static');
			assert.equal(pageHeaders.headers.get('x-custom-header'), 'static');
		} catch (err) {
			assert.fail(err);
		}
	});

	it('should not the static header for non-static pages that do not have prerender flag', async () => {
		try {
			await fixture.readFile('/client/index.html');
			assert.fail("The index page isn't prerendered");
		} catch {
			const pageHeaders = staticHeaders.get('/');
			assert.equal(pageHeaders, undefined, 'it should not contain the / headers');
		}
	});

	it('should not the static header for non-static pages that do have prerender flag', async () => {
		try {
			await fixture.readFile('/client/dynamic.html');
			assert.fail("The index page isn't prerendered");
		} catch {
			const pageHeaders = staticHeaders.get('/dynamic');
			assert.equal(pageHeaders, undefined, 'it should not contain the /dynamic headers');
		}
	});
});
