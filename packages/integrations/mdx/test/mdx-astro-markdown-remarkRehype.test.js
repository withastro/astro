import mdx from '@astrojs/mdx';

import { expect } from 'chai';
import { parseHTML } from 'linkedom';
import { loadFixture } from '../../../astro/test/test-utils.js';

describe('MDX with Astro Markdown remark-rehype config', () => {
	let fixture;

	before(async () => {
		fixture = await loadFixture({
			root: new URL('./fixtures/mdx-astro-markdown-remarkRehype/', import.meta.url),
			integrations: [mdx()],
			markdown: {
				remarkRehype: {
					footnoteLabel: 'Catatan kaki',
					footnoteBackLabel: 'Kembali ke konten',
				},
			},
		});

		await fixture.build();
	});

	it('Renders footnotes with values from the configuration', async () => {
		const html = await fixture.readFile('/index.html');
		const { document } = parseHTML(html);

		expect(document.querySelector('#footnote-label').textContent).to.equal('Catatan kaki');
		expect(document.querySelector('.data-footnote-backref').getAttribute('aria-label')).to.equal(
			'Kembali ke konten'
		);
	});
});
