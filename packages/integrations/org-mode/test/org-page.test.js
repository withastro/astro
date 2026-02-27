import * as assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import { parseHTML } from 'linkedom';
import { loadFixture } from '../../../astro/test/test-utils.js';

describe('Org Mode page', () => {
	let fixture;

	before(async () => {
		fixture = await loadFixture({
			root: new URL('./fixtures/org-page/', import.meta.url),
		});
	});

	describe('build', () => {
		before(async () => {
			await fixture.build();
		});

		it('renders an .org page', async () => {
			const html = await fixture.readFile('/index.html');
			const { document } = parseHTML(html);
			assert.equal(document.querySelector('h1')?.textContent, 'Hello org page!');
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

		it('renders an .org page', async () => {
			const res = await fixture.fetch('/');
			assert.equal(res.status, 200);

			const html = await res.text();
			const { document } = parseHTML(html);
			assert.equal(document.querySelector('h1')?.textContent, 'Hello org page!');
		});
	});
});
