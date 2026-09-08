import assert from 'node:assert/strict';
import { before, describe, it } from 'node:test';
import { parseHTML } from 'linkedom';
import { loadFixture, type Fixture } from './test-utils.ts';
import markdoc from '../dist/index.js';

const root = new URL('./fixtures/variables/', import.meta.url);

describe('Markdoc - Variables', () => {
	let baseFixture: Fixture;

	before(async () => {
		baseFixture = await loadFixture({
			root,
			integrations: [markdoc()],
		});
	});

	describe('build', () => {
		before(async () => {
			await baseFixture.build();
		});

		it('has expected entry properties', async () => {
			const html = await baseFixture.readFile('/index.html');
			const { document } = parseHTML(html);
			assert.equal(document.querySelector('h1')?.textContent, 'Processed by schema: Test entry');
			assert.equal(document.getElementById('id')?.textContent?.trim(), 'id: entry');
			assert.equal(document.getElementById('collection')?.textContent?.trim(), 'collection: blog');
		});
	});
});
