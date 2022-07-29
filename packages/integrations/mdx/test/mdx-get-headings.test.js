import mdx from '@astrojs/mdx';

import { expect } from 'chai';
import { loadFixture } from '../../../astro/test/test-utils.js';

describe('MDX getHeadings', () => {
	let fixture;

	before(async () => {
		fixture = await loadFixture({
			root: new URL('./fixtures/mdx-get-headings/', import.meta.url),
			integrations: [mdx()],
		});

		await fixture.build();
	});

	it('generates headings', async () => {
		const { headingsByPage } = JSON.parse(await fixture.readFile('/pages.json'));
		// TODO: make this a snapshot test :)
		expect(JSON.stringify(headingsByPage['./test.mdx'])).to.equal(JSON.stringify([
			{ depth: 1, slug: 'heading-test', text: 'Heading test' },
			{ depth: 2, slug: 'section-1', text: 'Section 1' },
			{ depth: 3, slug: 'subsection-1', text: 'Subsection 1' },
			{ depth: 3, slug: 'subsection-2', text: 'Subsection 2' },
			{ depth: 2, slug: 'section-2', text: 'Section 2' }
		]));
	});
	
	it('generates headings for JSX expressions', async () => {
		const { headingsByPage } = JSON.parse(await fixture.readFile('/pages.json'));
		expect(JSON.stringify(headingsByPage['./test-with-jsx-expressions.mdx'])).to.equal(JSON.stringify([
			{
				depth: 1,
				slug: 'heading-test-with-jsx-expressions',
				text: 'Heading test with JSX expressions'
			},
			{ depth: 2, slug: 'h2title', text: 'h2Title' },
			{ depth: 3, slug: 'h3title', text: 'h3Title' }
		]));
	});
});
