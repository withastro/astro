import { expect } from 'chai';
import { loadFixture } from './test-utils.js';
import * as devalue from 'devalue';
import * as cheerio from 'cheerio';

describe('Content Collections', () => {
	describe('Collection', () => {
		let json;
		before(async () => {
			const fixture = await loadFixture({ root: './fixtures/content-collections/' });
			await fixture.build();
			const rawJson = await fixture.readFile('/collections.json');
			json = devalue.parse(rawJson);
		});

		it('Returns `without config` collection', async () => {
			expect(json).to.haveOwnProperty('withoutConfig');
			expect(Array.isArray(json.withoutConfig)).to.equal(true);

			const ids = json.withoutConfig.map((item) => item.id);
			expect(ids).to.deep.equal([
				'columbia.md',
				'endeavour.md',
				'enterprise.md',
				'promo/launch-week.mdx',
			]);
		});

		it('Returns `with schema` collection', async () => {
			expect(json).to.haveOwnProperty('withSchemaConfig');
			expect(Array.isArray(json.withSchemaConfig)).to.equal(true);

			const ids = json.withSchemaConfig.map((item) => item.id);
			const publishedDates = json.withSchemaConfig.map((item) => item.data.publishedAt);
			expect(ids).to.deep.equal(['one.md', 'three.md', 'two.md']);
			expect(publishedDates.every((date) => date instanceof Date)).to.equal(
				true,
				'Not all publishedAt dates are Date objects'
			);
			expect(publishedDates.map((date) => date.toISOString())).to.deep.equal([
				'2021-01-01T00:00:00.000Z',
				'2021-01-03T00:00:00.000Z',
				'2021-01-02T00:00:00.000Z',
			]);
		});

		it('Returns `with custom slugs` collection', async () => {
			expect(json).to.haveOwnProperty('withSlugConfig');
			expect(Array.isArray(json.withSlugConfig)).to.equal(true);

			const slugs = json.withSlugConfig.map((item) => item.slug);
			expect(slugs).to.deep.equal(['fancy-one.md', 'excellent-three.md', 'interesting-two.md']);
		});
	});

	describe('Entry', () => {
		let json;
		before(async () => {
			const fixture = await loadFixture({ root: './fixtures/content-collections/' });
			await fixture.build();
			const rawJson = await fixture.readFile('/entries.json');
			json = devalue.parse(rawJson);
		});

		it('Returns without config collection entry', async () => {
			expect(json).to.haveOwnProperty('columbiaWithoutConfig');
			expect(json.columbiaWithoutConfig.id).to.equal('columbia.md');
		});

		it('Returns with schema config collection entry', async () => {
			expect(json).to.haveOwnProperty('oneWithSchemaConfig');
			expect(json.oneWithSchemaConfig.id).to.equal('one.md');
			expect(json.oneWithSchemaConfig.data.publishedAt instanceof Date).to.equal(true);
			expect(json.oneWithSchemaConfig.data.publishedAt.toISOString()).to.equal(
				'2021-01-01T00:00:00.000Z'
			);
		});

		it('Returns with slug config collection entry', async () => {
			expect(json).to.haveOwnProperty('twoWithSlugConfig');
			expect(json.twoWithSlugConfig.slug).to.equal('interesting-two.md');
		});
	});

	describe('Static paths integration', () => {
		let fixture;

		before(async () => {
			fixture = await loadFixture({ root: './fixtures/content-static-paths-integration/' });
			await fixture.build();
		});

		it('Generates expected pages', async () => {
			expect(fixture.pathExists('/posts/first-post')).to.equal(true);
			expect(fixture.pathExists('/posts/second-post')).to.equal(true);
			expect(fixture.pathExists('/posts/third-post')).to.equal(true);
			expect(fixture.pathExists('/posts/using-mdx')).to.equal(true);
		});

		it('Renders titles', async () => {
			const firstPost = await fixture.readFile('/posts/first-post/index.html');
			let $ = cheerio.load(firstPost);
			expect($('h1').text()).to.equal('First post');
			const secondPost = await fixture.readFile('/posts/second-post/index.html');
			$ = cheerio.load(secondPost);
			expect($('h1').text()).to.equal('Second post');
			const thirdPost = await fixture.readFile('/posts/third-post/index.html');
			$ = cheerio.load(thirdPost);
			expect($('h1').text()).to.equal('Third post');
			const usingMdx = await fixture.readFile('/posts/using-mdx/index.html');
			$ = cheerio.load(usingMdx);
			expect($('h1').text()).to.equal('Using MDX');
		});

		it('Renders content', async () => {
			const firstPost = await fixture.readFile('/posts/first-post/index.html');
			let $ = cheerio.load(firstPost);
			expect($('blockquote').text().trim()).to.equal('First post loaded: yes!');
			const secondPost = await fixture.readFile('/posts/second-post/index.html');
			$ = cheerio.load(secondPost);
			expect($('blockquote').text().trim()).to.equal('Second post loaded: yes!');
			const thirdPost = await fixture.readFile('/posts/third-post/index.html');
			$ = cheerio.load(thirdPost);
			expect($('blockquote').text().trim()).to.equal('Third post loaded: yes!');
			const usingMdx = await fixture.readFile('/posts/using-mdx/index.html');
			$ = cheerio.load(usingMdx);
			expect($('a[href="#"]').text().trim()).to.equal('Embedded component in MDX');
		});
	});
});
