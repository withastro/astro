import rss from '../dist/index.js';
import chai from 'chai';
import chaiPromises from 'chai-as-promised';

chai.use(chaiPromises);

const title = 'My RSS feed';
const description = 'This sure is a nice RSS feed';
const site = 'https://example.com';

const phpFeedItem = {
	link: '/php',
	title: 'Remember PHP?',
	pubDate: '1994-05-03',
	description:
		'PHP is a general-purpose scripting language geared toward web development. It was originally created by Danish-Canadian programmer Rasmus Lerdorf in 1994.',
};

const web1FeedItem = {
	// Should support empty string as a URL (possible for homepage route)
	link: '',
	title: 'Web 1.0',
	pubDate: '1997-05-03',
	description:
		'Web 1.0 is the term used for the earliest version of the Internet as it emerged from its origins with Defense Advanced Research Projects Agency (DARPA) and became, for the first time, a global network representing the future of digital communications.',
};

// note: I spent 30 minutes looking for a nice node-based snapshot tool
// ...and I gave up. Enjoy big strings!
const validXmlResult = `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title><![CDATA[My RSS feed]]></title><description><![CDATA[This sure is a nice RSS feed]]></description><link>https://example.com/</link><item><title><![CDATA[Remember PHP?]]></title><link>https://example.com/php/</link><guid>https://example.com/php/</guid><description><![CDATA[PHP is a general-purpose scripting language geared toward web development. It was originally created by Danish-Canadian programmer Rasmus Lerdorf in 1994.]]></description><pubDate>Tue, 03 May 1994 00:00:00 GMT</pubDate></item><item><title><![CDATA[Web 1.0]]></title><link>https://example.com/</link><guid>https://example.com/</guid><description><![CDATA[Web 1.0 is the term used for the earliest version of the Internet as it emerged from its origins with Defense Advanced Research Projects Agency (DARPA) and became, for the first time, a global network representing the future of digital communications.]]></description><pubDate>Sat, 03 May 1997 00:00:00 GMT</pubDate></item></channel></rss>`;

describe('rss', () => {
	it('should generate on valid RSSFeedItem array', async () => {
		const { body } = await rss({
			title,
			description,
			items: [phpFeedItem, web1FeedItem],
			site,
		});

		chai.expect(body).to.equal(validXmlResult);
	});

	describe('glob result', () => {
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

			const { body } = await rss({
				title,
				description,
				items: globResult,
				site,
			});

			chai.expect(body).to.equal(validXmlResult);
		});

		it('should fail on missing "title" key', () => {
			const globResult = {
				'./posts/php.md': () =>
					new Promise((resolve) =>
						resolve({
							url: phpFeedItem.link,
							frontmatter: {
								pubDate: phpFeedItem.pubDate,
								description: phpFeedItem.description,
							},
						})
					),
			};
			return chai.expect(
				rss({
					title,
					description,
					items: globResult,
					site,
				})
			).to.be.rejected;
		});

		it('should fail on missing "pubDate" key', () => {
			const globResult = {
				'./posts/php.md': () =>
					new Promise((resolve) =>
						resolve({
							url: phpFeedItem.link,
							frontmatter: {
								title: phpFeedItem.title,
								description: phpFeedItem.description,
							},
						})
					),
			};
			return chai.expect(
				rss({
					title,
					description,
					items: globResult,
					site,
				})
			).to.be.rejected;
		});
	});

	describe('errors', () => {
		it('should provide a error message when a "site" option is missing', async () => {
			try {
				await rss({
					title,
					description,
					items: [phpFeedItem, web1FeedItem],
				});

				chai.expect(false).to.equal(true, 'Should have errored');
			} catch (err) {
				chai
					.expect(err.message)
					.to.contain('[RSS] the "site" option is required, but no value was given.');
			}
		});

		it('should provide a good error message when a link is not provided', async () => {
			try {
				await rss({
					title: 'Your Website Title',
					description: 'Your Website Description',
					site: 'https://astro-demo',
					items: [
						{
							pubDate: new Date(),
							title: 'Some title',
							slug: 'foo',
						},
					],
				});
				chai.expect(false).to.equal(true, 'Should have errored');
			} catch (err) {
				chai.expect(err.message).to.contain('Required field [link] is missing');
			}
		});

		it('should provide a good error message when passing glob result form outside pages/', async () => {
			const globResult = {
				'./posts/php.md': () =>
					new Promise((resolve) =>
						resolve({
							// "undefined" when outside pages/
							url: undefined,
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
							url: undefined,
							frontmatter: {
								title: web1FeedItem.title,
								pubDate: web1FeedItem.pubDate,
								description: web1FeedItem.description,
							},
						})
					),
			};

			try {
				await rss({
					title: 'Your Website Title',
					description: 'Your Website Description',
					site: 'https://astro-demo',
					items: globResult,
				});
				chai.expect(false).to.equal(true, 'Should have errored');
			} catch (err) {
				chai.expect(err.message).to.contain('you can only glob ".md" files within /pages');
			}
		});
	});
});
