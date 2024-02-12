import * as assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import { parseHTML } from 'linkedom';
import { loadFixture } from '../../../astro/test/test-utils.js';

describe('MDX Page', () => {
	let fixture;

	before(async () => {
		fixture = await loadFixture({
			root: new URL('./fixtures/mdx-page/', import.meta.url),
			// test suite was authored when inlineStylesheets defaulted to never
			build: { inlineStylesheets: 'never' },
		});
	});

	describe('build', () => {
		before(async () => {
			await fixture.build();
		});

		it('works', async () => {
			const html = await fixture.readFile('/index.html');
			const { document } = parseHTML(html);

			const h1 = document.querySelector('h1');

			assert.equal(h1.textContent, 'Hello page!');
		});

		it('injects style imports when layout is not applied', async () => {
			const html = await fixture.readFile('/index.html');
			const { document } = parseHTML(html);

			const stylesheet = document.querySelector('link[rel="stylesheet"]');

			assert.notEqual(stylesheet, null);
		});
	});

	describe('dev', () => {
		let devServer;

		before(async () => {
			devServer = await fixture.startDevServer();
		});

		after(async () => {
			await devServer.stop();
		});

		it('works', async () => {
			const res = await fixture.fetch('/');

			assert.equal(res.status, 200);

			const html = await res.text();
			const { document } = parseHTML(html);

			const h1 = document.querySelector('h1');

			assert.equal(h1.textContent, 'Hello page!');
		});
	});
});
