import * as assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import { loadFixture } from './test-utils.js';

describe('base configuration', () => {
	describe('with trailingSlash: "never"', () => {
		let fixture;
		let devServer;

		before(async () => {
			fixture = await loadFixture({
				root: './fixtures/dev-render/',
				base: '/docs',
				trailingSlash: 'never',
			});
			devServer = await fixture.startDevServer();
		});

		after(async () => {
			await devServer.stop();
		});

		describe('index route', () => {
			it('Requests that include a trailing slash 404', async () => {
				const res = await fixture.fetch('/docs/');
				assert.equal(res.status, 404);
			});

			it('Requests that exclude a trailing slash 200', async () => {
				const res = await fixture.fetch('/docs');
				assert.equal(res.status, 200);
			});
		});

		describe('sub route', () => {
			it('Requests that include a trailing slash 404', async () => {
				const res = await fixture.fetch('/docs/sub/');
				assert.equal(res.status, 404);
			});

			it('Requests that exclude a trailing slash 200', async () => {
				const res = await fixture.fetch('/docs/sub');
				assert.equal(res.status, 200);
			});
		});
	});
});
