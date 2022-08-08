import mdx from '@astrojs/mdx';

import { expect } from 'chai';
import { parseHTML } from 'linkedom';
import { loadFixture } from '../../../astro/test/test-utils.js';

const FIXTURE_ROOT = new URL('./fixtures/mdx-frontmatter/', import.meta.url);

describe('MDX frontmatter', () => {
	let fixture;
	before(async () => {
		fixture = await loadFixture({
			root: FIXTURE_ROOT,
			integrations: [mdx()],
		});
		await fixture.build();
	});
	it('builds when "frontmatter.property" is in JSX expression', async () => {
		expect(true).to.equal(true);
	});

	it('extracts frontmatter to "frontmatter" export', async () => {
		const { titles } = JSON.parse(await fixture.readFile('/glob.json'));
		expect(titles).to.include('Using YAML frontmatter');
	});

	it('renders layout from "layout" frontmatter property', async () => {
		const html = await fixture.readFile('/index.html');
		const { document } = parseHTML(html);

		const layoutParagraph = document.querySelector('[data-layout-rendered]');

		expect(layoutParagraph).to.not.be.null;
	});

	it('passes frontmatter to layout via "content" and "frontmatter" props', async () => {
		const html = await fixture.readFile('/index.html');
		const { document } = parseHTML(html);

		const contentTitle = document.querySelector('[data-content-title]');
		const frontmatterTitle = document.querySelector('[data-frontmatter-title]');

		expect(contentTitle.textContent).to.equal('Using YAML frontmatter');
		expect(frontmatterTitle.textContent).to.equal('Using YAML frontmatter');
	});

	it('passes headings to layout via "headings" prop', async () => {
		const html = await fixture.readFile('/with-headings/index.html');
		const { document } = parseHTML(html);

		const headingSlugs = [...document.querySelectorAll('[data-headings] > li')].map(
			(el) => el.textContent
		);

		expect(headingSlugs.length).to.be.greaterThan(0);
		expect(headingSlugs).to.contain('section-1');
		expect(headingSlugs).to.contain('section-2');
	});

	it('extracts frontmatter to "customFrontmatter" export when configured', async () => {
		const customFixture = await loadFixture({
			root: new URL('./fixtures/mdx-custom-frontmatter-name/', import.meta.url),
			integrations: [
				mdx({
					frontmatterOptions: {
						name: 'customFrontmatter',
					},
				}),
			],
		});
		await customFixture.build();

		const { titles } = JSON.parse(await customFixture.readFile('/glob.json'));
		expect(titles).to.include('Using YAML frontmatter');
	});
});
