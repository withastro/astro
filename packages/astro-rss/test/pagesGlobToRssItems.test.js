import chai from 'chai';
import chaiPromises from 'chai-as-promised';
import { phpFeedItem, web1FeedItem } from './test-utils.js';
import { pagesGlobToRssItems } from '../dist/index.js';

chai.use(chaiPromises);

describe('pagesGlobToRssItems', () => {
	it('should generate on valid result', async () => {
		const globResult = {
			'./posts/php.md': () =>
				new Promise((resolve) =>
					resolve({
						url: phpFeedItem.link,
						frontmatter: {
							title: phpFeedItem.title,
							pubDate: phpFeedItem.pubDate,
							description: phpFeedItem.description,
						},
					})
				),
			'./posts/nested/web1.md': () =>
				new Promise((resolve) =>
					resolve({
						url: web1FeedItem.link,
						frontmatter: {
							title: web1FeedItem.title,
							pubDate: web1FeedItem.pubDate,
							description: web1FeedItem.description,
						},
					})
				),
		};

		const items = await pagesGlobToRssItems(globResult);

		chai.expect(items.sort((a, b) => a.pubDate - b.pubDate)).to.deep.equal([
			{
				title: phpFeedItem.title,
				link: phpFeedItem.link,
				pubDate: new Date(phpFeedItem.pubDate),
				description: phpFeedItem.description,
			},
			{
				title: web1FeedItem.title,
				link: web1FeedItem.link,
				pubDate: new Date(web1FeedItem.pubDate),
				description: web1FeedItem.description,
			},
		]);
	});

	it('should fail on missing "url"', () => {
		const globResult = {
			'./posts/php.md': () =>
				new Promise((resolve) =>
					resolve({
						url: undefined,
						frontmatter: {
							pubDate: phpFeedItem.pubDate,
							description: phpFeedItem.description,
						},
					})
				),
		};
		return chai.expect(pagesGlobToRssItems(globResult)).to.be.rejected;
	});

	it('should fail on missing "title" key', () => {
		const globResult = {
			'./posts/php.md': () =>
				new Promise((resolve) =>
					resolve({
						url: phpFeedItem.link,
						frontmatter: {
							title: undefined,
							pubDate: phpFeedItem.pubDate,
							description: phpFeedItem.description,
						},
					})
				),
		};
		return chai.expect(pagesGlobToRssItems(globResult)).to.be.rejected;
	});
});
