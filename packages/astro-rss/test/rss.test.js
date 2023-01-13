import rss from '../dist/index.js';
import chai from 'chai';
import chaiPromises from 'chai-as-promised';
import chaiXml from 'chai-xml';

chai.use(chaiPromises);
chai.use(chaiXml);

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
const phpFeedItemWithContent = {
	...phpFeedItem,
	content: `<h1>${phpFeedItem.title}</h1><p>${phpFeedItem.description}</p>`,
};
const phpFeedItemWithCustomData = {
	...phpFeedItem,
	customData: '<dc:creator><![CDATA[Buster Bluth]]></dc:creator>',
};

const web1FeedItem = {
	// Should support empty string as a URL (possible for homepage route)
	link: '',
	title: 'Web 1.0',
	pubDate: '1997-05-03',
	description:
		'Web 1.0 is the term used for the earliest version of the Internet as it emerged from its origins with Defense Advanced Research Projects Agency (DARPA) and became, for the first time, a global network representing the future of digital communications.',
};
const web1FeedItemWithContent = {
	...web1FeedItem,
	content: `<h1>${web1FeedItem.title}</h1><p>${web1FeedItem.description}</p>`,
};

// note: I spent 30 minutes looking for a nice node-based snapshot tool
// ...and I gave up. Enjoy big strings!
// prettier-ignore
const validXmlResult = `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title><![CDATA[${title}]]></title><description><![CDATA[${description}]]></description><link>${site}/</link><item><title><![CDATA[${phpFeedItem.title}]]></title><link>${site}${phpFeedItem.link}/</link><guid>${site}${phpFeedItem.link}/</guid><description><![CDATA[${phpFeedItem.description}]]></description><pubDate>${new Date(phpFeedItem.pubDate).toUTCString()}</pubDate></item><item><title><![CDATA[${web1FeedItem.title}]]></title><link>${site}${web1FeedItem.link}/</link><guid>${site}${web1FeedItem.link}/</guid><description><![CDATA[${web1FeedItem.description}]]></description><pubDate>${new Date(web1FeedItem.pubDate).toUTCString()}</pubDate></item></channel></rss>`;
// prettier-ignore
const validXmlWithoutWeb1FeedResult = `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title><![CDATA[${title}]]></title><description><![CDATA[${description}]]></description><link>${site}/</link><item><title><![CDATA[${phpFeedItem.title}]]></title><link>${site}${phpFeedItem.link}/</link><guid>${site}${phpFeedItem.link}/</guid><description><![CDATA[${phpFeedItem.description}]]></description><pubDate>${new Date(phpFeedItem.pubDate).toUTCString()}</pubDate></item></channel></rss>`;
// prettier-ignore
const validXmlWithContentResult = `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0" xmlns:content="http://purl.org/rss/1.0/modules/content/"><channel><title><![CDATA[${title}]]></title><description><![CDATA[${description}]]></description><link>${site}/</link><item><title><![CDATA[${phpFeedItemWithContent.title}]]></title><link>${site}${phpFeedItemWithContent.link}/</link><guid>${site}${phpFeedItemWithContent.link}/</guid><description><![CDATA[${phpFeedItemWithContent.description}]]></description><pubDate>${new Date(phpFeedItemWithContent.pubDate).toUTCString()}</pubDate><content:encoded><![CDATA[${phpFeedItemWithContent.content}]]></content:encoded></item><item><title><![CDATA[${web1FeedItemWithContent.title}]]></title><link>${site}${web1FeedItemWithContent.link}/</link><guid>${site}${web1FeedItemWithContent.link}/</guid><description><![CDATA[${web1FeedItemWithContent.description}]]></description><pubDate>${new Date(web1FeedItemWithContent.pubDate).toUTCString()}</pubDate><content:encoded><![CDATA[${web1FeedItemWithContent.content}]]></content:encoded></item></channel></rss>`;
// prettier-ignore
const validXmlWithCustomDataResult = `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:content="http://purl.org/rss/1.0/modules/content/"><channel><title><![CDATA[${title}]]></title><description><![CDATA[${description}]]></description><link>${site}/</link><item><title><![CDATA[${phpFeedItemWithCustomData.title}]]></title><link>${site}${phpFeedItemWithCustomData.link}/</link><guid>${site}${phpFeedItemWithCustomData.link}/</guid><description><![CDATA[${phpFeedItemWithCustomData.description}]]></description><pubDate>${new Date(phpFeedItemWithCustomData.pubDate).toUTCString()}</pubDate>${phpFeedItemWithCustomData.customData}</item><item><title><![CDATA[${web1FeedItemWithContent.title}]]></title><link>${site}${web1FeedItemWithContent.link}/</link><guid>${site}${web1FeedItemWithContent.link}/</guid><description><![CDATA[${web1FeedItemWithContent.description}]]></description><pubDate>${new Date(web1FeedItemWithContent.pubDate).toUTCString()}</pubDate><content:encoded><![CDATA[${web1FeedItemWithContent.content}]]></content:encoded></item></channel></rss>`;
// prettier-ignore
const validXmlWithStylesheet = `<?xml version="1.0" encoding="UTF-8"?><?xml-stylesheet href="/feedstylesheet.css"?><rss version="2.0"><channel><title><![CDATA[${title}]]></title><description><![CDATA[${description}]]></description><link>${site}/</link></channel></rss>`;
// prettier-ignore
const validXmlWithXSLStylesheet = `<?xml version="1.0" encoding="UTF-8"?><?xml-stylesheet href="/feedstylesheet.xsl" type="text/xsl"?><rss version="2.0"><channel><title><![CDATA[${title}]]></title><description><![CDATA[${description}]]></description><link>${site}/</link></channel></rss>`;

describe('rss', () => {
	it('should generate on valid RSSFeedItem array', async () => {
		const { body } = await rss({
			title,
			description,
			items: [phpFeedItem, web1FeedItem],
			site,
		});

		chai.expect(body).xml.to.equal(validXmlResult);
	});

	it('should generate on valid RSSFeedItem array with HTML content included', async () => {
		const { body } = await rss({
			title,
			description,
			items: [phpFeedItemWithContent, web1FeedItemWithContent],
			site,
		});

		chai.expect(body).xml.to.equal(validXmlWithContentResult);
	});

	it('should generate on valid RSSFeedItem array with custom data included', async () => {
		const { body } = await rss({
			xmlns: {
				dc: 'http://purl.org/dc/elements/1.1/',
			},
			title,
			description,
			items: [phpFeedItemWithCustomData, web1FeedItemWithContent],
			site,
		});

		chai.expect(body).xml.to.equal(validXmlWithCustomDataResult);
	});

	it('should include xml-stylesheet instruction when stylesheet is defined', async () => {
		const { body } = await rss({
			title,
			description,
			items: [],
			site,
			stylesheet: '/feedstylesheet.css',
		});

		chai.expect(body).xml.to.equal(validXmlWithStylesheet);
	});

	it('should include xml-stylesheet instruction with xsl type when stylesheet is set to xsl file', async () => {
		const { body } = await rss({
			title,
			description,
			items: [],
			site,
			stylesheet: '/feedstylesheet.xsl',
		});

		chai.expect(body).xml.to.equal(validXmlWithXSLStylesheet);
	});

	it('should filter out entries marked as `draft`', async () => {
		const { body } = await rss({
			title,
			description,
			items: [phpFeedItem, { ...web1FeedItem, draft: true }],
			site,
		});

		chai.expect(body).xml.to.equal(validXmlWithoutWeb1FeedResult);
	});

	it('should respect drafts option', async () => {
		const { body } = await rss({
			title,
			description,
			drafts: true,
			items: [phpFeedItem, { ...web1FeedItem, draft: true }],
			site,
			drafts: true,
		});

		chai.expect(body).xml.to.equal(validXmlResult);
	});

	describe('with `import.meta.glob` result', () => {
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
				site,
				items: globResult,
			});

			chai.expect(body).xml.to.equal(validXmlResult);
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
			return chai.expect(
				rss({
					title,
					description,
					items: globResult,
					site,
				})
			).to.be.rejected;
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
});
