import * as assert from 'node:assert/strict';
import { before, describe, it } from 'node:test';
import mdx from '@astrojs/mdx';
import { parseHTML } from 'linkedom';
import { loadFixture, type Fixture } from './test-utils.ts';

const FIXTURE_ROOT = new URL('./fixtures/mdx-smartypants/', import.meta.url);

describe('MDX smartypants', () => {
	let fixture: Fixture;

	before(async () => {
		fixture = await loadFixture({
			root: FIXTURE_ROOT,
			integrations: [
				mdx({
					smartypants: {
						dashes: 'oldschool',
					},
				}),
			],
		});
	});

	describe('build', () => {
		before(async () => {
			await fixture.build();
		});

		it('passes smartypants object options to remark-smartypants', async () => {
			const html = await fixture.readFile('/index.html');
			const { document } = parseHTML(html);

			const paragraph = document.querySelector('p')!;

			assert.equal(paragraph.textContent, 'Before — after');
		});
	});
});
