import mdx from '@astrojs/mdx';
import { jsToTreeNode } from '../dist/utils.js';

import { expect } from 'chai';
import { parseHTML } from 'linkedom';
import getReadingTime from 'reading-time';
import { toString } from 'mdast-util-to-string';

import { loadFixture } from '../../../astro/test/test-utils.js';

export function rehypeReadingTime() {
	return function (tree) {
		const readingTime = getReadingTime(toString(tree));
		tree.children.unshift(
			jsToTreeNode(`export const readingTime = ${JSON.stringify(readingTime)}`)
		);
	};
}

const FIXTURE_ROOT = new URL('./fixtures/mdx-rehype-plugins/', import.meta.url);

describe('MDX rehype plugins', () => {
	describe('without "extends"', () => {
		let fixture;
		before(async () => {
			fixture = await loadFixture({
				root: FIXTURE_ROOT,
				integrations: [
					mdx({
						rehypePlugins: [rehypeReadingTime],
					}),
				],
			});
			await fixture.build();
		});

		it('removes default getHeadings', async () => {
			const html = await fixture.readFile('/space-ipsum/index.html');
			const { document } = parseHTML(html);

			const headings = [...document.querySelectorAll('h1, h2')];
			expect(headings.length).to.be.greaterThan(0);
			for (const heading of headings) {
				expect(heading.id).to.be.empty;
			}
		});

		it('supports custom rehype plugins - reading time', async () => {
			const readingTime = JSON.parse(await fixture.readFile('/reading-time.json'));

			expect(readingTime).to.not.be.null;
			expect(readingTime.text).to.match(/^\d+ min read/);
		});
	});

	describe('with "extends"', () => {
		let fixture;
		before(async () => {
			fixture = await loadFixture({
				root: FIXTURE_ROOT,
				integrations: [
					mdx({
						rehypePlugins: { extends: [rehypeReadingTime] },
					}),
				],
			});
			await fixture.build();
		});

		it('preserves default getHeadings', async () => {
			const html = await fixture.readFile('/space-ipsum/index.html');
			const { document } = parseHTML(html);

			const headings = [...document.querySelectorAll('h1, h2')];
			expect(headings.length).to.be.greaterThan(0);
			for (const heading of headings) {
				expect(heading.id).to.not.be.empty;
			}
		});
	});
});
