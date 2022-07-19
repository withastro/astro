import mdx from '@astrojs/mdx';

import { expect } from 'chai';
import { parseHTML } from 'linkedom';
import { loadFixture } from '../../../astro/test/test-utils.js';
import remarkToc from 'remark-toc';

const FIXTURE_ROOT = new URL('./fixtures/mdx-remark-plugins/', import.meta.url);

describe('MDX remark plugins', () => {
	it('supports custom remark plugins - TOC', async () => {
		const fixture = await loadFixture({
			root: FIXTURE_ROOT,
			integrations: [mdx({
				remarkPlugins: [remarkToc],
			})],
		});
		await fixture.build();

		const html = await fixture.readFile('/with-toc/index.html');
		const { document } = parseHTML(html);

		const tocLink1 = document.querySelector('ul a[href="#section-1"]');
		expect(tocLink1).to.not.be.null;
	});

	it('applies GitHub-flavored markdown by default', async () => {
		const fixture = await loadFixture({
			root: FIXTURE_ROOT,
			integrations: [mdx()],
		});
		await fixture.build();

		const html = await fixture.readFile('/with-gfm/index.html');
		const { document } = parseHTML(html);

		const authGenLink = document.querySelector('a[href="https://example.com"]');
		expect(authGenLink).to.not.be.null;
	});
});
