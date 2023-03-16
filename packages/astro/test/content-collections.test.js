import * as devalue from 'devalue';
import * as cheerio from 'cheerio';
import { expect } from 'chai';
import { loadFixture } from './test-utils.js';
import testAdapter from './test-adapter.js';
import { preventNodeBuiltinDependencyPlugin } from './test-plugins.js';

describe('Content Collections', () => {
	describe('Query', () => {
		let fixture;
		before(async () => {
			fixture = await loadFixture({ root: './fixtures/content-collections/' });
			await fixture.build();
		});

		describe('Collection', () => {
			let json;
			before(async () => {
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
					// Spaces allowed in IDs
					'promo/launch week.mdx',
				]);
			});

			it('Handles spaces in `without config` slugs', async () => {
				expect(json).to.haveOwnProperty('withoutConfig');
				expect(Array.isArray(json.withoutConfig)).to.equal(true);

				const slugs = json.withoutConfig.map((item) => item.slug);
				expect(slugs).to.deep.equal([
					'columbia',
					'endeavour',
					'enterprise',
					// "launch week.mdx" is converted to "launch-week.mdx"
					'promo/launch-week',
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
				expect(slugs).to.deep.equal(['fancy-one', 'excellent-three', 'interesting-two']);
			});

			it('Returns `with union schema` collection', async () => {
				expect(json).to.haveOwnProperty('withUnionSchema');
				expect(Array.isArray(json.withUnionSchema)).to.equal(true);

				const post = json.withUnionSchema.find((item) => item.id === 'post.md');
				expect(post).to.not.be.undefined;
				expect(post.data).to.deep.equal({
					type: 'post',
					title: 'My Post',
					description: 'This is my post',
				});
				const newsletter = json.withUnionSchema.find((item) => item.id === 'newsletter.md');
				expect(newsletter).to.not.be.undefined;
				expect(newsletter.data).to.deep.equal({
					type: 'newsletter',
					subject: 'My Newsletter',
				});
			});
		});

		describe('Entry', () => {
			let json;
			before(async () => {
				const rawJson = await fixture.readFile('/entries.json');
				json = devalue.parse(rawJson);
			});

			it('Returns `without config` collection entry', async () => {
				expect(json).to.haveOwnProperty('columbiaWithoutConfig');
				expect(json.columbiaWithoutConfig.id).to.equal('columbia.md');
			});

			it('Returns `with schema` collection entry', async () => {
				expect(json).to.haveOwnProperty('oneWithSchemaConfig');
				expect(json.oneWithSchemaConfig.id).to.equal('one.md');
				expect(json.oneWithSchemaConfig.data.publishedAt instanceof Date).to.equal(true);
				expect(json.oneWithSchemaConfig.data.publishedAt.toISOString()).to.equal(
					'2021-01-01T00:00:00.000Z'
				);
			});

			it('Returns `with custom slugs` collection entry', async () => {
				expect(json).to.haveOwnProperty('twoWithSlugConfig');
				expect(json.twoWithSlugConfig.slug).to.equal('interesting-two');
			});

			it('Returns `with union schema` collection entry', async () => {
				expect(json).to.haveOwnProperty('postWithUnionSchema');
				expect(json.postWithUnionSchema.id).to.equal('post.md');
				expect(json.postWithUnionSchema.data).to.deep.equal({
					type: 'post',
					title: 'My Post',
					description: 'This is my post',
				});
			});
		});
	});

	const blogSlugToContents = {
		'first-post': {
			title: 'First post',
			element: 'blockquote',
			content: 'First post loaded: yes!',
		},
		'second-post': {
			title: 'Second post',
			element: 'blockquote',
			content: 'Second post loaded: yes!',
		},
		'third-post': {
			title: 'Third post',
			element: 'blockquote',
			content: 'Third post loaded: yes!',
		},
		'using-mdx': {
			title: 'Using MDX',
			element: 'a[href="#"]',
			content: 'Embedded component in MDX',
		},
	};

	describe('Static paths integration', () => {
		let fixture;

		before(async () => {
			fixture = await loadFixture({ root: './fixtures/content-static-paths-integration/' });
			await fixture.build();
		});

		it('Generates expected pages', async () => {
			for (const slug in blogSlugToContents) {
				expect(fixture.pathExists(`/posts/${slug}`)).to.equal(true);
			}
		});

		it('Renders titles', async () => {
			for (const slug in blogSlugToContents) {
				const post = await fixture.readFile(`/posts/${slug}/index.html`);
				const $ = cheerio.load(post);
				expect($('h1').text()).to.equal(blogSlugToContents[slug].title);
			}
		});

		it('Renders content', async () => {
			for (const slug in blogSlugToContents) {
				const post = await fixture.readFile(`/posts/${slug}/index.html`);
				const $ = cheerio.load(post);
				expect($(blogSlugToContents[slug].element).text().trim()).to.equal(
					blogSlugToContents[slug].content
				);
			}
		});
	});

	describe('With spaces in path', () => {
		it('Does not throw', async () => {
			const fixture = await loadFixture({ root: './fixtures/content with spaces in folder name/' });
			let error = null;
			try {
				await fixture.build();
			} catch (e) {
				error = e.message;
			}
			expect(error).to.be.null;
		});
	});
	describe('With config.mjs', () => {
		it("Errors when frontmatter doesn't match schema", async () => {
			const fixture = await loadFixture({
				root: './fixtures/content-collections-with-config-mjs/',
			});
			let error;
			try {
				await fixture.build();
			} catch (e) {
				error = e.message;
			}
			expect(error).to.include('**title**: Expected type `"string"`, received "number"');
		});
	});

	describe('With empty markdown file', () => {
		it('Throws the right error', async () => {
			const fixture = await loadFixture({
				root: './fixtures/content-collections-empty-md-file/',
			});
			let error;
			try {
				await fixture.build();
			} catch (e) {
				error = e.message;
			}
			expect(error).to.include('**title**: Required');
		});
	});

	describe('SSR integration', () => {
		let app;

		before(async () => {
			const fixture = await loadFixture({
				root: './fixtures/content-ssr-integration/',
				output: 'server',
				adapter: testAdapter(),
				vite: {
					plugins: [preventNodeBuiltinDependencyPlugin()],
				},
			});
			await fixture.build();
			app = await fixture.loadTestAdapterApp();
		});

		it('Responds 200 for expected pages', async () => {
			for (const slug in blogSlugToContents) {
				const request = new Request('http://example.com/posts/' + slug);
				const response = await app.render(request);
				expect(response.status).to.equal(200);
			}
		});

		it('Renders titles', async () => {
			for (const slug in blogSlugToContents) {
				const request = new Request('http://example.com/posts/' + slug);
				const response = await app.render(request);
				const body = await response.text();
				const $ = cheerio.load(body);
				expect($('h1').text()).to.equal(blogSlugToContents[slug].title);
			}
		});

		it('Renders content', async () => {
			for (const slug in blogSlugToContents) {
				const request = new Request('http://example.com/posts/' + slug);
				const response = await app.render(request);
				const body = await response.text();
				const $ = cheerio.load(body);
				expect($(blogSlugToContents[slug].element).text().trim()).to.equal(
					blogSlugToContents[slug].content
				);
			}
		});
	});

	describe('Base configuration', () => {
		let fixture;

		before(async () => {
			fixture = await loadFixture({
				root: './fixtures/content-collections-base/',
			});
			await fixture.build();
		});

		it('Includes base in links', async () => {
			const html = await fixture.readFile('/docs/index.html');
			const $ = cheerio.load(html);
			expect($('link').attr('href')).to.satisfies((a) => a.startsWith('/docs'));
		});

		it('Includes base in hoisted scripts', async () => {
			const html = await fixture.readFile('/docs/index.html');
			const $ = cheerio.load(html);
			expect($('script').attr('src')).to.satisfies((a) => a.startsWith('/docs'));
		});
	});
});
