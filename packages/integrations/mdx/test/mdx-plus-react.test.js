import mdx from '@astrojs/mdx';

import { expect } from 'chai';
import { parseHTML } from 'linkedom';
import { loadFixture } from '../../../astro/test/test-utils.js';

describe('MDX and React', () => {
	let fixture;

	before(async () => {
		fixture = await loadFixture({
			root: new URL('./fixtures/mdx-plus-react/', import.meta.url),
		});
		await fixture.build();
	});

	it('can be used in the same project', async () => {
		const html = await fixture.readFile('/index.html');
		console.log(html);
		/*const { document } = parseHTML(html);

		const h1 = document.querySelector('h1');

		expect(h1.textContent).to.equal('Hello page!');*/
	});
});
