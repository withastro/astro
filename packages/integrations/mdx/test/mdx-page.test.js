import mdx from '@astrojs/mdx';

import { expect } from 'chai';
import { parseHTML } from 'linkedom'
import { loadFixture } from '../../../astro/test/test-utils.js';

describe('MDX Page', () => {
	let fixture;

	before(async () => {
		fixture = await loadFixture({
			root: new URL('./fixtures/mdx-page', import.meta.url),
			integrations: [
				mdx()
			]
		});
		await fixture.build();
	});

	it('builds', async () => {
		const html = await fixture.readFile('/index.html');
		const { document } = parseHTML(html);
		
		const h1 = document.querySelector('h1');

		expect(h1.textContent).to.equal('Hello page!');
	});
})
