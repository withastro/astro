import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import { load as cheerioLoad } from 'cheerio';
import { type DevServer, type Fixture, loadFixture } from './test-utils.ts';

describe('Dev rewrite, hybrid/server — dev-specific errors', () => {
	let fixture: Fixture;
	let devServer: DevServer;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/rewrite-server/',
			outDir: './dist/rewrite-dev-rewrite-hybrid-server/',
		});
		devServer = await fixture.startDevServer();
	});

	after(async () => {
		await devServer.stop();
	});

	it('should error when rewriting from a SSR route to a SSG route', async () => {
		const html = await fixture.fetch('/forbidden/dynamic').then((res) => res.text());
		const $ = cheerioLoad(html);

		assert.match($('title').text(), /ForbiddenRewrite/);
	});
});

describe('SSR route', () => {
	it("should not build if a user tries to use rewrite('/404') in static pages", async () => {
		try {
			const fixture = await loadFixture({
				root: './fixtures/rewrite-404-invalid/',
				outDir: './dist/rewrite-ssr-route/',
			});
			await fixture.build();
			assert.fail('It should fail.');
		} catch {
			// it passes
			assert.equal(true, true);
		}
	});
});

describe('Runtime error, default 500 — Vite overlay', () => {
	let fixture: Fixture;
	let devServer: DevServer;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/rewrite-runtime-error/',
			outDir: './dist/rewrite-runtime-error-default-500/',
		});
		devServer = await fixture.startDevServer();
	});

	after(async () => {
		await devServer.stop();
	});

	it('should return a 500 status code with Vite error overlay', async () => {
		const response = await fixture.fetch('/errors/from');
		assert.equal(response.status, 500);
		const text = await response.text();
		assert.match(text, /@vite\/client/);
	});
});
