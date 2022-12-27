import * as fs from 'node:fs';
import * as devalue from 'devalue';
import * as cheerio from 'cheerio';
import { expect } from 'chai';
import { loadFixture } from './test-utils.js';
import testAdapter from './test-adapter.js';

describe('Content Collections', () => {
	describe('Type generation', () => {
		let fixture;
		before(async () => {
			fixture = await loadFixture({ root: './fixtures/content-collections/' });
		});

		it('Writes types to `src/content/`', async () => {
			let writtenFiles = {};
			const fsMock = {
				...fs,
				promises: {
					...fs.promises,
					async writeFile(path, contents) {
						writtenFiles[path] = contents;
					},
				},
			};
			const expectedTypesFile = new URL('./content/types.generated.d.ts', fixture.config.srcDir)
				.href;
			await fixture.sync({ fs: fsMock });
			expect(Object.keys(writtenFiles)).to.have.lengthOf(1);
			expect(writtenFiles).to.haveOwnProperty(expectedTypesFile);
			// smoke test `astro check` asserts whether content types pass.
			expect(writtenFiles[expectedTypesFile]).to.include(
				`declare module 'astro:content' {`,
				'Types file does not include `astro:content` module declaration'
			);
		});
	});

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
				expect(json.twoWithSlugConfig.slug).to.equal('interesting-two.md');
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

	describe('SSR integration', () => {
		let app;

		before(async () => {
			const fixture = await loadFixture({
				root: './fixtures/content-ssr-integration/',
				output: 'server',
				adapter: testAdapter(),
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
});
