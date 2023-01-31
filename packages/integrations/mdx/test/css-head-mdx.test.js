import mdx from '@astrojs/mdx';

import { expect } from 'chai';
import { parseHTML } from 'linkedom';
import { loadFixture } from '../../../astro/test/test-utils.js';

describe('Head injection w/ MDX', () => {
	let fixture;

	before(async () => {
		fixture = await loadFixture({
			root: new URL('./fixtures/css-head-mdx/', import.meta.url),
			integrations: [mdx()],
		});
	});

	describe('build', () => {
		before(async () => {
			await fixture.build();
		});

		it('only injects contents into head', async () => {
			const html = await fixture.readFile('/indexThree/index.html');
			const { document } = parseHTML(html);

			const links = document.querySelectorAll('link[rel=stylesheet]');
			expect(links).to.have.a.lengthOf(1);

			const scripts = document.querySelectorAll('script[type=module]');
			expect(scripts).to.have.a.lengthOf(1);
		});
	});
});
