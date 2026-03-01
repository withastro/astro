import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { parseHTML } from 'linkedom';
import { loadFixture } from '../../../astro/test/test-utils.js';

async function getFixture() {
	return await loadFixture({
		root: new URL('./fixtures/render-table-attrs/', import.meta.url),
	});
}

describe('Markdoc - table attributes', () => {
	describe('build', () => {
		it('renders table with custom attributes without validation errors', async () => {
			const fixture = await getFixture();
			await fixture.build();

			const html = await fixture.readFile('/index.html');
			const { document } = parseHTML(html);

			const th = document.querySelector('th');
			assert.ok(th, 'table header should exist');
			assert.equal(th.textContent, 'Feature');

			const td = document.querySelector('td');
			assert.equal(td.textContent, 'Custom attributes');
		});
	});

	describe('dev', () => {
		it('renders table with custom attributes without validation errors', async () => {
			const fixture = await getFixture();
			const server = await fixture.startDevServer();

			const res = await fixture.fetch('/');
			const html = await res.text();
			const { document } = parseHTML(html);

			const th = document.querySelector('th');
			assert.ok(th, 'table header should exist');
			assert.equal(th.textContent, 'Feature');

			const td = document.querySelector('td');
			assert.equal(td.textContent, 'Custom attributes');

			await server.stop();
		});
	});
});
