import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { z } from 'astro/zod';
import atom, { getAtomString } from '../dist/index.js';
import { atomSchema } from '../dist/schema.js';
import {
	subtitle,
	parseXmlString,
	phpFeedEntry,
	phpFeedEntryWithContent,
	phpFeedEntryWithCustomData,
	site,
	title,
	web1FeedEntry,
	web1FeedEntryWithAllData,
	web1FeedEntryWithContent,
} from './test-utils.js';

// note: I spent 30 minutes looking for a nice node-based snapshot tool
// ...and I gave up. Enjoy big strings!

// biome-ignore format: keep in one line
const validXmlResult = `<?xml version="1.0" encoding="UTF-8"?><feed xmlns="http://www.w3.org/2005/Atom"><title><![CDATA[${title}]]></title><subtitle><![CDATA[${subtitle}]]></subtitle><link href="${site}/" /><entry><title><![CDATA[${phpFeedEntry.title}]]></title><link href="${site}${phpFeedEntry.link}/" /><id>${site}${phpFeedEntry.link}/</id><summary><![CDATA[${phpFeedEntry.summary}]]></summary><updated>${new Date(phpFeedEntry.updated).toUTCString()}</updated></entry><entry><title><![CDATA[${web1FeedEntry.title}]]></title><link href="${site}${web1FeedEntry.link}/" /><id>${site}${web1FeedEntry.link}/</id><summary><![CDATA[${web1FeedEntry.summary}]]></summary><updated>${new Date(web1FeedEntry.updated).toUTCString()}</updated></entry></feed>`;
// biome-ignore format: keep in one line
const validXmlWithContentResult = `<?xml version="1.0" encoding="UTF-8"?><feed xmlns="http://www.w3.org/2005/Atom"><title><![CDATA[${title}]]></title><subtitle><![CDATA[${subtitle}]]></subtitle><link href="${site}/" /><entry><title><![CDATA[${phpFeedEntryWithContent.title}]]></title><link href="${site}${phpFeedEntryWithContent.link}/" /><id>${site}${phpFeedEntryWithContent.link}/</id><summary><![CDATA[${phpFeedEntryWithContent.summary}]]></summary><updated>${new Date(phpFeedEntryWithContent.updated).toUTCString()}</updated><content type="html"><![CDATA[${phpFeedEntryWithContent.content}]]></content></entry><entry><title><![CDATA[${web1FeedEntryWithContent.title}]]></title><link href="${site}${web1FeedEntryWithContent.link}/" /><id>${site}${web1FeedEntryWithContent.link}/</id><summary><![CDATA[${web1FeedEntryWithContent.summary}]]></summary><updated>${new Date(web1FeedEntryWithContent.updated).toUTCString()}</updated><content type="html"><![CDATA[${web1FeedEntryWithContent.content}]]></content></entry></feed>`;
// biome-ignore format: keep in one line
const validXmlResultWithAllData = `<?xml version="1.0" encoding="UTF-8"?><feed xmlns="http://www.w3.org/2005/Atom"><title><![CDATA[${title}]]></title><subtitle><![CDATA[${subtitle}]]></subtitle><link href="${site}/" /><entry><title><![CDATA[${phpFeedEntry.title}]]></title><link href="${site}${phpFeedEntry.link}/" /><id>${site}${phpFeedEntry.link}/</id><summary><![CDATA[${phpFeedEntry.summary}]]></summary><updated>${new Date(phpFeedEntry.updated).toUTCString()}</updated></entry><entry><title><![CDATA[${web1FeedEntryWithAllData.title}]]></title><link href="${site}${web1FeedEntryWithAllData.link}/" /><id>${site}${web1FeedEntryWithAllData.link}/</id><summary><![CDATA[${web1FeedEntryWithAllData.summary}]]></summary><updated>${new Date(web1FeedEntryWithAllData.updated).toUTCString()}</updated><category term="${web1FeedEntryWithAllData.categories[0]}" /><category term="${web1FeedEntryWithAllData.categories[1]}" /><author><name>${web1FeedEntryWithAllData.author.name}</name><email>${web1FeedEntryWithAllData.author.email}</email></author><source><title>${web1FeedEntryWithAllData.source.title}</title><link href="${web1FeedEntryWithAllData.source.url}" /></source><link rel="enclosure" href="${site}${web1FeedEntryWithAllData.enclosure.url}" length="${web1FeedEntryWithAllData.enclosure.length}" type="${web1FeedEntryWithAllData.enclosure.type}"/></entry></feed>`;
// biome-ignore format: keep in one line
const validXmlWithCustomDataResult = `<?xml version="1.0" encoding="UTF-8"?><feed xmlns="http://www.w3.org/2005/Atom" xmlns:dc="http://purl.org/dc/elements/1.1/"><title><![CDATA[${title}]]></title><subtitle><![CDATA[${subtitle}]]></subtitle><link href="${site}/" /><entry><title><![CDATA[${phpFeedEntryWithCustomData.title}]]></title><link href="${site}${phpFeedEntryWithCustomData.link}/" /><id>${site}${phpFeedEntryWithCustomData.link}/</id><summary><![CDATA[${phpFeedEntryWithCustomData.summary}]]></summary><updated>${new Date(phpFeedEntryWithCustomData.updated).toUTCString()}</updated>${phpFeedEntryWithCustomData.customData}</entry><entry><title><![CDATA[${web1FeedEntryWithContent.title}]]></title><link href="${site}${web1FeedEntryWithContent.link}/" /><id>${site}${web1FeedEntryWithContent.link}/</id><summary><![CDATA[${web1FeedEntryWithContent.summary}]]></summary><updated>${new Date(web1FeedEntryWithContent.updated).toUTCString()}</updated><content type="html"><![CDATA[${web1FeedEntryWithContent.content}]]></content></entry></feed>`;
// biome-ignore format: keep in one line
const validXmlWithStylesheet = `<?xml version="1.0" encoding="UTF-8"?><?xml-stylesheet href="/feedstylesheet.css"?><feed xmlns="http://www.w3.org/2005/Atom"><title><![CDATA[${title}]]></title><subtitle><![CDATA[${subtitle}]]></subtitle><link href="${site}/" /></feed>`;
// biome-ignore format: keep in one line
const validXmlWithXSLStylesheet = `<?xml version="1.0" encoding="UTF-8"?><?xml-stylesheet href="/feedstylesheet.xsl" type="text/xsl"?><feed xmlns="http://www.w3.org/2005/Atom"><title><![CDATA[${title}]]></title><subtitle><![CDATA[${subtitle}]]></subtitle><link href="${site}/" /></feed>`;

function assertXmlDeepEqual(a, b) {
	const parsedA = parseXmlString(a);
	const parsedB = parseXmlString(b);

	assert.equal(parsedA.err, null);
	assert.equal(parsedB.err, null);
	assert.deepEqual(parsedA.result, parsedB.result);
}

describe('atom', () => {
	it('should return a response', async () => {
		const response = await atom({
			title,
			subtitle,
			entries: [phpFeedEntry, web1FeedEntry],
			site,
		});

		const str = await response.text();

		// NOTE: Chai used the below parser to perform the tests, but I have omitted it for now.
		// parser = new xml2js.Parser({ trim: flag(this, 'deep') });

		assertXmlDeepEqual(str, validXmlResult);

		const contentType = response.headers.get('Content-Type');
		assert.equal(contentType, 'application/xml');
	});

	it('should be the same string as getAtomString', async () => {
		const options = {
			title,
			subtitle,
			entries: [phpFeedEntry, web1FeedEntry],
			site,
		};

		const response = await atom(options);
		const str1 = await response.text();
		const str2 = await getAtomString(options);

		assert.equal(str1, str2);
	});
});

describe('getAtomString', () => {
	it('should generate on valid AtomFeedEntry array', async () => {
		const str = await getAtomString({
			title,
			subtitle,
			entries: [phpFeedEntry, web1FeedEntry],
			site,
		});

		assertXmlDeepEqual(str, validXmlResult);
	});

	it('should generate on valid AtomFeedEntry array with HTML content included', async () => {
		const str = await getAtomString({
			title,
			subtitle,
			entries: [phpFeedEntryWithContent, web1FeedEntryWithContent],
			site,
		});

		assertXmlDeepEqual(str, validXmlWithContentResult);
	});

	it('should generate on valid AtomFeedEntry array with all Atom content included', async () => {
		const str = await getAtomString({
			title,
			subtitle,
			entries: [phpFeedEntry, web1FeedEntryWithAllData],
			site,
		});

		assertXmlDeepEqual(str, validXmlResultWithAllData);
	});

	it('should generate on valid AtomFeedEntry array with custom data included', async () => {
		const str = await getAtomString({
			xmlns: {
				dc: 'http://purl.org/dc/elements/1.1/',
			},
			title,
			subtitle,
			entries: [phpFeedEntryWithCustomData, web1FeedEntryWithContent],
			site,
		});

		assertXmlDeepEqual(str, validXmlWithCustomDataResult);
	});

	it('should include xml-stylesheet instruction when stylesheet is defined', async () => {
		const str = await getAtomString({
			title,
			subtitle,
			entries: [],
			site,
			stylesheet: '/feedstylesheet.css',
		});

		assertXmlDeepEqual(str, validXmlWithStylesheet);
	});

	it('should include xml-stylesheet instruction with xsl type when stylesheet is set to xsl file', async () => {
		const str = await getAtomString({
			title,
			subtitle,
			entries: [],
			site,
			stylesheet: '/feedstylesheet.xsl',
		});

		assertXmlDeepEqual(str, validXmlWithXSLStylesheet);
	});

	it('should preserve self-closing tags on `customData`', async () => {
		const customData =
			'<atom:link href="https://example.com/feed.xml" rel="self" type="application/rss+xml"/>';
		const str = await getAtomString({
			title,
			subtitle,
			entries: [],
			site,
			xmlns: {
				atom: 'http://www.w3.org/2005/Atom',
			},
			customData,
		});

		assert.ok(str.includes(customData));
	});

	it('should not append trailing slash to URLs with the given option', async () => {
		const str = await getAtomString({
			title,
			subtitle,
			entries: [phpFeedEntry],
			site,
			trailingSlash: false,
		});

		assert.ok(str.includes('https://example.com/"'));
		assert.ok(str.includes('https://example.com/php"'));
	});

	// it('Deprecated import.meta.glob mapping still works', async () => {
	// 	const globResult = {
	// 		'./posts/php.md': () =>
	// 			new Promise((resolve) =>
	// 				resolve({
	// 					url: phpFeedEntry.link,
	// 					frontmatter: {
	// 						title: phpFeedEntry.title,
	// 						updated: phpFeedEntry.updated,
	// 						summary: phpFeedEntry.summary,
	// 					},
	// 				})
	// 			),
	// 		'./posts/nested/web1.md': () =>
	// 			new Promise((resolve) =>
	// 				resolve({
	// 					url: web1FeedEntry.link,
	// 					frontmatter: {
	// 						title: web1FeedEntry.title,
	// 						updated: web1FeedEntry.updated,
	// 						summary: web1FeedEntry.summary,
	// 					},
	// 				})
	// 			),
	// 	};

	// 	const str = await getAtomString({
	// 		title,
	// 		summary,
	// 		entries: globResult,
	// 		site,
	// 	});

	// 	assertXmlDeepEqual(str, validXmlResult);
	// });

	it('should fail when an invalid date string is provided', async () => {
		const res = atomSchema.safeParse({
			title: phpFeedEntry.title,
			updated: 'invalid date',
			summary: phpFeedEntry.summary,
			link: phpFeedEntry.link,
		});

		assert.equal(res.success, false);
		assert.equal(res.error.issues[0].path[0], 'updated');
	});

	it('should be extendable', () => {
		let error = null;
		try {
			atomSchema.extend({
				category: z.string().optional(),
			});
		} catch (e) {
			error = e.message;
		}
		assert.equal(error, null);
	});

	it('should not fail when an enclosure has a length of 0', async () => {
		let error = null;
		try {
			await getAtomString({
				title,
				summary: subtitle,
				entries: [
					{
						title: 'Title',
						updated: new Date().toISOString(),
						summary: 'Description',
						link: '/link',
						enclosure: {
							url: '/enclosure',
							length: 0,
							type: 'audio/mpeg',
						},
					},
				],
				site,
			});
		} catch (e) {
			error = e.message;
		}

		assert.equal(error, null);
	});
});
