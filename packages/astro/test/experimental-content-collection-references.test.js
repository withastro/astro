import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import * as cheerio from 'cheerio';
import { fixLineEndings, loadFixture } from './test-utils.js';

describe('Experimental Content Collections cache - references', () => {
	let fixture;
	let devServer;
	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/content-collection-references/',
			experimental: { contentCollectionCache: true },
		});
	});

	after(async () => await fixture.clean());

	const modes = ['dev', 'prod'];

	for (const mode of modes) {
		describe(mode, () => {
			before(async () => {
				if (mode === 'prod') {
					await fixture.build();
				} else if (mode === 'dev') {
					devServer = await fixture.startDevServer();
				}
			});

			after(async () => {
				if (mode === 'dev') devServer?.stop();
			});

			describe(`JSON result`, () => {
				let json;
				before(async () => {
					if (mode === 'prod') {
						const rawJson = await fixture.readFile('/welcome-data.json');
						json = JSON.parse(rawJson);
					} else if (mode === 'dev') {
						const rawJsonResponse = await fixture.fetch('/welcome-data.json');
						const rawJson = await rawJsonResponse.text();
						json = JSON.parse(rawJson);
					}
				});

				it('Returns expected keys', () => {
					assert.equal(json.hasOwnProperty('welcomePost'), true);
					assert.equal(json.hasOwnProperty('banner'), true);
					assert.equal(json.hasOwnProperty('author'), true);
					assert.equal(json.hasOwnProperty('relatedPosts'), true);
				});

				it('Returns `banner` data', () => {
					const { banner } = json;
					assert.equal(banner.hasOwnProperty('data'), true);
					assert.equal(banner.id, 'welcome');
					assert.equal(banner.collection, 'banners');
					assert.equal(
						banner.data.alt,
						'Futuristic landscape with chrome buildings and blue skies',
					);

					assert.equal(banner.data.src.width, 400);
					assert.equal(banner.data.src.height, 225);
					assert.equal(banner.data.src.format, 'jpg');
					assert.equal(banner.data.src.src.includes('the-future'), true);
				});

				it('Returns `author` data', () => {
					const { author } = json;
					assert.equal(author.hasOwnProperty('data'), true);
					assert.deepEqual(author, {
						id: 'nate-moore',
						collection: 'authors',
						data: {
							name: 'Nate Something Moore',
							twitter: 'https://twitter.com/n_moore',
						},
					});
				});

				it('Returns `relatedPosts` data', () => {
					const { relatedPosts } = json;
					assert.equal(Array.isArray(relatedPosts), true);
					const topLevelInfo = relatedPosts.map(({ data, body, ...meta }) => ({
						...meta,
						body: fixLineEndings(body).trim(),
					}));
					assert.deepEqual(topLevelInfo, [
						{
							id: 'related-1.md',
							slug: 'related-1',
							body: '# Related post 1\n\nThis is related to the welcome post.',
							collection: 'blog',
						},
						{
							id: 'related-2.md',
							slug: 'related-2',
							body: '# Related post 2\n\nThis is related to the welcome post.',
							collection: 'blog',
						},
					]);
					const postData = relatedPosts.map(({ data }) => data);
					assert.deepEqual(postData, [
						{
							title: 'Related post 1',
							banner: { id: 'welcome', collection: 'banners' },
							author: { id: 'fred-schott', collection: 'authors' },
						},
						{
							title: 'Related post 2',
							banner: { id: 'welcome', collection: 'banners' },
							author: { id: 'ben-holmes', collection: 'authors' },
						},
					]);
				});
			});

			describe(`Render result`, () => {
				let $;
				before(async () => {
					if (mode === 'prod') {
						const html = await fixture.readFile('/welcome/index.html');
						$ = cheerio.load(html);
					} else if (mode === 'dev') {
						const htmlResponse = await fixture.fetch('/welcome');
						const html = await htmlResponse.text();
						$ = cheerio.load(html);
					}
				});

				it('Renders `banner` data', () => {
					const banner = $('img[data-banner]');
					assert.equal(banner.length, 1);
					assert.equal(banner.attr('src').includes('the-future'), true);
					assert.equal(
						banner.attr('alt'),
						'Futuristic landscape with chrome buildings and blue skies',
					);
					assert.equal(banner.attr('width'), '400');
					assert.equal(banner.attr('height'), '225');
				});

				it('Renders `author` data', () => {
					const author = $('a[data-author-name]');
					assert.equal(author.length, 1);
					assert.equal(author.attr('href'), 'https://twitter.com/n_moore');
					assert.equal(author.text(), 'Nate Something Moore');
				});

				it('Renders `relatedPosts` data', () => {
					const relatedPosts = $('ul[data-related-posts]');
					assert.equal(relatedPosts.length, 1);
					const relatedPost1 = relatedPosts.find('li').eq(0);

					assert.equal(relatedPost1.find('a').attr('href'), '/blog/related-1');
					assert.equal(relatedPost1.find('a').text(), 'Related post 1');
					const relatedPost2 = relatedPosts.find('li').eq(1);
					assert.equal(relatedPost2.find('a').attr('href'), '/blog/related-2');
					assert.equal(relatedPost2.find('a').text(), 'Related post 2');
				});
			});
		});
	}
});
