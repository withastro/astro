import * as assert from 'node:assert/strict';
import { before, describe, it } from 'node:test';
import mdx from '@astrojs/mdx';
import { satteri } from '@astrojs/markdown-satteri';
import { parseHTML } from 'linkedom';
import { loadFixture, type Fixture } from './test-utils.ts';

describe('MDX with the Sätteri processor', () => {
	let fixture: Fixture;

	before(async () => {
		fixture = await loadFixture({
			root: new URL('./fixtures/mdx-get-headings/', import.meta.url),
			integrations: [mdx()],
			markdown: {
				processor: satteri(),
			},
		});

		await fixture.build();
	});

	it('renders headings through the Sätteri MDX pipeline', async () => {
		const html = await fixture.readFile('/test/index.html');
		const { document } = parseHTML(html);

		assert.equal(document.querySelector('h1')?.id, 'heading-test');
		const h2Ids = Array.from(document.querySelectorAll('h2')).map((el) => el?.id);
		assert.equal(h2Ids.includes('section-1'), true);
		assert.equal(h2Ids.includes('section-2'), true);
	});

	it('exposes the same headings via getHeadings()', async () => {
		const { headingsByPage } = JSON.parse(await fixture.readFile('/pages.json'));
		const slugs = headingsByPage['./test.mdx'].map((h: { slug: string }) => h.slug);
		assert.ok(slugs.includes('heading-test'));
		assert.ok(slugs.includes('section-1'));
		assert.ok(slugs.includes('section-2'));
	});
});
