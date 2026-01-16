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
			root: './fixtures/streaming/',
			adapter: testAdapter({
				staticHeaders: true,
			}),
		});

		server = await fixture.startDevServer();
	});

	after(async () => {
		await server.stop();
	});

	it('should render the static header', async () => {
		let res = await fixture.fetch('/');

		console.log(res.headers);
		const header = res.headers.get('x-custom-header');

		assert.equal(header, 'index');
	});
});
