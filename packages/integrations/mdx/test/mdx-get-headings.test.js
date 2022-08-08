import mdx from '@astrojs/mdx';

import { expect } from 'chai';
import { parseHTML } from 'linkedom';
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

	it('adds anchor IDs to headings', async () => {
		const html = await fixture.readFile('/test/index.html');
		const { document } = parseHTML(html);

		const h2Ids = document.querySelectorAll('h2').map((el) => el?.id);
		const h3Ids = document.querySelectorAll('h3').map((el) => el?.id);
		expect(document.querySelector('h1').id).to.equal('heading-test');
		expect(h2Ids).to.contain('section-1');
		expect(h2Ids).to.contain('section-2');
		expect(h3Ids).to.contain('subsection-1');
		expect(h3Ids).to.contain('subsection-2');
	});

	it('generates correct getHeadings() export', async () => {
		const { headingsByPage } = JSON.parse(await fixture.readFile('/pages.json'));
		// TODO: make this a snapshot test :)
		expect(JSON.stringify(headingsByPage['./test.mdx'])).to.equal(
			JSON.stringify([
				{ depth: 1, slug: 'heading-test', text: 'Heading test' },
				{ depth: 2, slug: 'section-1', text: 'Section 1' },
				{ depth: 3, slug: 'subsection-1', text: 'Subsection 1' },
				{ depth: 3, slug: 'subsection-2', text: 'Subsection 2' },
				{ depth: 2, slug: 'section-2', text: 'Section 2' },
			])
		);
	});

	it('generates correct getHeadings() export for JSX expressions', async () => {
		const { headingsByPage } = JSON.parse(await fixture.readFile('/pages.json'));
		expect(JSON.stringify(headingsByPage['./test-with-jsx-expressions.mdx'])).to.equal(
			JSON.stringify([
				{
					depth: 1,
					slug: 'heading-test-with-jsx-expressions',
					text: 'Heading test with JSX expressions',
				},
				{ depth: 2, slug: 'h2title', text: 'h2Title' },
				{ depth: 3, slug: 'h3title', text: 'h3Title' },
			])
		);
	});
});
