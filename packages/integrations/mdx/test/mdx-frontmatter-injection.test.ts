import * as assert from 'node:assert/strict';
import { before, describe, it } from 'node:test';
import { parseHTML } from 'linkedom';
import { loadFixture, type Fixture } from '../../../astro/test/test-utils.js';

const FIXTURE_ROOT = new URL('./fixtures/mdx-frontmatter-injection/', import.meta.url);

type FrontmatterEntry = {
	layout: string;
	title: string;
	description: string;
	injectedReadingTime: { text: string; minutes: number; time: number; words: number } | null;
};

describe('MDX frontmatter injection', () => {
	let fixture: Fixture;

	before(async () => {
		fixture = await loadFixture({
			root: FIXTURE_ROOT,
		});
		await fixture.build();
	});

	const readFrontmatterByPage = async (): Promise<FrontmatterEntry[]> => {
		return JSON.parse(await fixture.readFile('/glob.json')) as FrontmatterEntry[];
	};

	it('remark supports custom vfile data - get title', async () => {
		const frontmatterByPage = await readFrontmatterByPage();
		const titles = frontmatterByPage.map((frontmatter) => frontmatter.title);
		assert.equal(titles.includes('Page 1'), true);
		assert.equal(titles.includes('Page 2'), true);
	});

	it('rehype supports custom vfile data - reading time', async () => {
		const frontmatterByPage = await readFrontmatterByPage();
		const readingTimes = frontmatterByPage.map((frontmatter) => frontmatter.injectedReadingTime);
		assert.equal(readingTimes.length > 0, true);
		for (const readingTime of readingTimes) {
			assert.notEqual(readingTime, null);
			assert.match(readingTime!.text, /^\d+ min read/);
		}
	});

	it('allow user frontmatter mutation', async () => {
		const frontmatterByPage = await readFrontmatterByPage();
		const descriptions = frontmatterByPage.map((frontmatter) => frontmatter.description);
		assert.equal(
			descriptions.includes('Processed by remarkDescription plugin: Page 1 description'),
			true,
		);
		assert.equal(
			descriptions.includes('Processed by remarkDescription plugin: Page 2 description'),
			true,
		);
	});

	it('passes injected frontmatter to layouts', async () => {
		const html1 = await fixture.readFile('/page-1/index.html');
		const html2 = await fixture.readFile('/page-2/index.html');

		const title1 = parseHTML(html1).document.querySelector('title')!;
		const title2 = parseHTML(html2).document.querySelector('title')!;

		assert.equal(title1.innerHTML, 'Page 1');
		assert.equal(title2.innerHTML, 'Page 2');
	});
});
