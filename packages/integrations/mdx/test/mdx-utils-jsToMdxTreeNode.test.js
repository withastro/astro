import { expect } from 'chai';
import { parseHTML } from 'linkedom';
import { loadFixture } from '../../../astro/test/test-utils.js';

describe('MDX utils - jsToMdxTreeNode', () => {
	let fixture;

	before(async () => {
		fixture = await loadFixture({
			root: new URL('./fixtures/mdx-utils-jsToMdxTreeNode/', import.meta.url),
		});

		await fixture.build();
	});

	it('Successfully injects title component export', async () => {
		const html = await fixture.readFile('/index.html');
		const { document } = parseHTML(html);

		expect(document.querySelector('[data-is-title-component]')).to.not.be.null;
	});
});
