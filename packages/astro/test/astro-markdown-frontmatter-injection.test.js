import { expect } from 'chai';
import { loadFixture } from './test-utils.js';

const FIXTURE_ROOT = './fixtures/astro-markdown-frontmatter-injection/';

describe('Astro Markdown - frontmatter injection', () => {
	let fixture;

	before(async () => {
		fixture = await loadFixture({
			root: FIXTURE_ROOT,
		});
		await fixture.build();
	});

	it('remark supports custom vfile data - get title', async () => {
		const frontmatterByPage = JSON.parse(await fixture.readFile('/glob.json'));
		const titles = frontmatterByPage.map((frontmatter = {}) => frontmatter.title);
		expect(titles).to.contain('Page 1');
		expect(titles).to.contain('Page 2');
	});

	it('rehype supports custom vfile data - reading time', async () => {
		const frontmatterByPage = JSON.parse(await fixture.readFile('/glob.json'));
		const readingTimes = frontmatterByPage.map((frontmatter = {}) => frontmatter.injectedReadingTime);
		expect(readingTimes.length).to.be.greaterThan(0);
		for (let readingTime of readingTimes) {
			expect(readingTime).to.not.be.null;
			expect(readingTime.text).match(/^\d+ min read/);
		}
	});

	it('overrides injected frontmatter with user frontmatter', async () => {
		const frontmatterByPage = JSON.parse(await fixture.readFile('/glob.json'));
		const readingTimes = frontmatterByPage.map((frontmatter = {}) => frontmatter.injectedReadingTime?.text);
		const titles = frontmatterByPage.map((frontmatter = {}) => frontmatter.title);
		expect(titles).to.contain('Overridden title');
		expect(readingTimes).to.contain('1000 min read');
	});
});
