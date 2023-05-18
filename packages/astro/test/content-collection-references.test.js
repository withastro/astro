import { expect } from 'chai';
import * as cheerio from 'cheerio';
import { fixLineEndings, loadFixture } from './test-utils.js';

describe('Content Collections - references', () => {
	let fixture;
	let devServer;
	before(async () => {
		fixture = await loadFixture({ root: './fixtures/content-collection-references/' });
	});

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
					expect(json).to.haveOwnProperty('welcomePost');
					expect(json).to.haveOwnProperty('banner');
					expect(json).to.haveOwnProperty('author');
					expect(json).to.haveOwnProperty('relatedPosts');
				});

				it('Returns `banner` data', () => {
					const { banner } = json;
					expect(banner).to.haveOwnProperty('data');
					expect(banner.id).to.equal('welcome');
					expect(banner.collection).to.equal('banners');
					expect(banner.data.alt).to.equal(
						'Futuristic landscape with chrome buildings and blue skies'
					);

					expect(banner.data.src.width).to.equal(400);
					expect(banner.data.src.height).to.equal(225);
					expect(banner.data.src.format).to.equal('jpg');
					expect(banner.data.src.src.includes('the-future')).to.be.true;
				});

				it('Returns `author` data', () => {
					const { author } = json;
					expect(author).to.haveOwnProperty('data');
					expect(author).to.deep.equal({
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
					expect(Array.isArray(relatedPosts)).to.be.true;
					const topLevelInfo = relatedPosts.map(({ data, body, ...meta }) => ({
						...meta,
						body: fixLineEndings(body).trim(),
					}));
					expect(topLevelInfo).to.deep.equal([
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
					expect(postData).to.deep.equal([
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
					expect(banner.length).to.equal(1);
					expect(banner.attr('src')).to.include('the-future');
					expect(banner.attr('alt')).to.equal(
						'Futuristic landscape with chrome buildings and blue skies'
					);
					expect(banner.attr('width')).to.equal('400');
					expect(banner.attr('height')).to.equal('225');
				});

				it('Renders `author` data', () => {
					const author = $('a[data-author-name]');
					expect(author.length).to.equal(1);
					expect(author.attr('href')).to.equal('https://twitter.com/n_moore');
					expect(author.text()).to.equal('Nate Something Moore');
				});

				it('Renders `relatedPosts` data', () => {
					const relatedPosts = $('ul[data-related-posts]');
					expect(relatedPosts.length).to.equal(1);
					const relatedPost1 = relatedPosts.find('li').eq(0);

					expect(relatedPost1.find('a').attr('href')).to.equal('/blog/related-1');
					expect(relatedPost1.find('a').text()).to.equal('Related post 1');
					const relatedPost2 = relatedPosts.find('li').eq(1);
					expect(relatedPost2.find('a').attr('href')).to.equal('/blog/related-2');
					expect(relatedPost2.find('a').text()).to.equal('Related post 2');
				});
			});
		});
	}
});
