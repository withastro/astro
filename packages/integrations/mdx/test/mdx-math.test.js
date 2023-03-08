import mdx from '@astrojs/mdx';
import { expect } from 'chai';
import { parseHTML } from 'linkedom';
import { loadFixture } from '../../../astro/test/test-utils.js';
import remarkMath from 'remark-math';
import rehypeMathjaxSvg from 'rehype-mathjax';
import rehypeMathjaxChtml from 'rehype-mathjax/chtml.js';

const FIXTURE_ROOT = new URL('./fixtures/mdx-math/', import.meta.url);

describe('MDX math', () => {
	describe('mathjax', () => {
		it('works with svg', async () => {
			const fixture = await loadFixture({
				root: FIXTURE_ROOT,
				markdown: {
					remarkPlugins: [remarkMath],
					rehypePlugins: [rehypeMathjaxSvg],
				},
				integrations: [mdx()],
			});
			await fixture.build();

			const html = await fixture.readFile('/mathjax/index.html');
			const { document } = parseHTML(html);

			const mjxContainer = document.querySelector('mjx-container[jax="SVG"]');
			expect(mjxContainer).to.not.be.null;

			const mjxStyle = document.querySelector('style').innerHTML;
			expect(mjxStyle).to.include('mjx-container[jax="SVG"]', 'style should not be html-escaped');
		});

		it('works with chtml', async () => {
			const fixture = await loadFixture({
				root: FIXTURE_ROOT,
				markdown: {
					remarkPlugins: [remarkMath],
					rehypePlugins: [
						[
							rehypeMathjaxChtml,
							{
								chtml: {
									fontURL: 'https://cdn.jsdelivr.net/npm/mathjax@3/es5/output/chtml/fonts/woff-v2',
								},
							},
						],
					],
				},
				integrations: [mdx()],
			});
			await fixture.build();

			const html = await fixture.readFile('/mathjax/index.html');
			const { document } = parseHTML(html);

			const mjxContainer = document.querySelector('mjx-container[jax="CHTML"]');
			expect(mjxContainer).to.not.be.null;

			const mjxStyle = document.querySelector('style').innerHTML;
			expect(mjxStyle).to.include('mjx-container[jax="CHTML"]', 'style should not be html-escaped');
		});
	});
});
