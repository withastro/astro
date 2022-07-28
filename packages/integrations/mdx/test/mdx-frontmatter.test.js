import mdx from '@astrojs/mdx';

import { expect } from 'chai';
import { parseHTML } from 'linkedom';
import { loadFixture } from '../../../astro/test/test-utils.js';

const FIXTURE_ROOT = new URL('./fixtures/mdx-frontmatter/', import.meta.url);

describe('MDX frontmatter', () => {
	it('builds when "frontmatter.property" is in JSX expression', async () => {
		const fixture = await loadFixture({
			root: FIXTURE_ROOT,
			integrations: [mdx()],
		});
		await fixture.build();
		expect(true).to.equal(true);
	});

	it('extracts frontmatter to "frontmatter" export', async () => {
		const fixture = await loadFixture({
			root: FIXTURE_ROOT,
			integrations: [mdx()],
		});
		await fixture.build();

		const { titles } = JSON.parse(await fixture.readFile('/glob.json'));
		expect(titles).to.include('Using YAML frontmatter');
	});

	it('renders layout from "layout" frontmatter property', async () => {
		const fixture = await loadFixture({
			root: FIXTURE_ROOT,
			integrations: [mdx()],
		});
		await fixture.build();

		const html = await fixture.readFile('/index.html');
		const { document } = parseHTML(html);

		const layoutParagraph = document.querySelector('[data-layout-rendered]');

		expect(layoutParagraph).to.not.be.null;
	});

	it('passes frontmatter to layout via "content" prop', async () => {
		const fixture = await loadFixture({
			root: FIXTURE_ROOT,
			integrations: [mdx()],
		});
		await fixture.build();

		const html = await fixture.readFile('/index.html');
		const { document } = parseHTML(html);

		const h1 = document.querySelector('h1');

		expect(h1.textContent).to.equal('Using YAML frontmatter');
	});

	it('extracts frontmatter to "customFrontmatter" export when configured', async () => {
		const fixture = await loadFixture({
			root: new URL('./fixtures/mdx-custom-frontmatter-name/', import.meta.url),
			integrations: [
				mdx({
					frontmatterOptions: {
						name: 'customFrontmatter',
					},
				}),
			],
		});
		await fixture.build();

		const { titles } = JSON.parse(await fixture.readFile('/glob.json'));
		expect(titles).to.include('Using YAML frontmatter');
	});
});
