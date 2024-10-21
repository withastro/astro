import xml2js from 'xml2js';

export const title = 'My Atom feed';
export const subtitle = 'This sure is a nice Atom feed';
export const site = 'https://example.com';

export const phpFeedEntry = {
	link: '/php',
	title: 'Remember PHP?',
	updated: '1994-05-03',
	summary:
		'PHP is a general-purpose scripting language geared toward web development. It was originally created by Danish-Canadian programmer Rasmus Lerdorf in 1994.',
};
export const phpFeedEntryWithContent = {
	...phpFeedEntry,
	content: `<h1>${phpFeedEntry.title}</h1><p>${phpFeedEntry.summary}</p>`,
};
export const phpFeedEntryWithCustomData = {
	...phpFeedEntry,
	customData: '<dc:creator><![CDATA[Buster Bluth]]></dc:creator>',
};

export const web1FeedEntry = {
	// Should support empty string as a URL (possible for homepage route)
	link: '',
	title: 'Web 1.0',
	updated: '1997-05-03',
	summary:
		'Web 1.0 is the term used for the earliest version of the Internet as it emerged from its origins with Defense Advanced Research Projects Agency (DARPA) and became, for the first time, a global network representing the future of digital communications.',
};
export const web1FeedEntryWithContent = {
	...web1FeedEntry,
	content: `<h1>${web1FeedEntry.title}</h1><p>${web1FeedEntry.summary}</p>`,
};
export const web1FeedEntryWithAllData = {
	...web1FeedEntry,
	categories: ['web1', 'history'],
	author: {
		name: 'test',
		email: 'test@example.com'
	},
	// commentsUrl: 'http://example.com/comments',
	source: {
		url: 'http://example.com/source',
		title: 'The Web 1.0 blog',
	},
	enclosure: {
		url: '/podcast.mp3',
		length: 256,
		type: 'audio/mpeg',
	},
};

const parser = new xml2js.Parser({ trim: true });

/**
 *
 * Utility function to parse an XML string into an object using `xml2js`.
 *
 * @param {string} xmlString - Stringified XML to parse.
 * @return {{ err: Error, result: any }} Represents an option containing the parsed XML string or an Error.
 */
export function parseXmlString(xmlString) {
	let res;
	parser.parseString(xmlString, (err, result) => {
		res = { err, result };
	});
	return res;
}
