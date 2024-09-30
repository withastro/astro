import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import * as cheerio from 'cheerio';
import * as devalue from 'devalue';
import testAdapter from './test-adapter.js';
import { preventNodeBuiltinDependencyPlugin } from './test-plugins.js';
import { loadFixture } from './test-utils.js';

describe('Experimental Content Collections cache', () => {
	describe('Query', () => {
		let fixture;
		before(async () => {
			fixture = await loadFixture({
				root: './fixtures/content-collections/',
				experimental: { contentCollectionCache: true },
			});
			await fixture.build();
		});

		after(async () => await fixture.clean());

		describe('Collection', () => {
			let json;
			before(async () => {
				const rawJson = await fixture.readFile('/collections.json');
				json = devalue.parse(rawJson);
			});

			it('Returns `without config` collection', async () => {
				assert.equal(json.hasOwnProperty('withoutConfig'), true);
				assert.equal(Array.isArray(json.withoutConfig), true);

				const ids = json.withoutConfig.map((item) => item.id).sort();
				assert.deepEqual(
					ids,
					[
						'columbia.md',
						'endeavour.md',
						'enterprise.md',
						// Spaces allowed in IDs
						'promo/launch week.mdx',
					].sort(),
				);
			});

			it('Handles spaces in `without config` slugs', async () => {
				assert.equal(json.hasOwnProperty('withoutConfig'), true);
				assert.equal(Array.isArray(json.withoutConfig), true);

				const slugs = json.withoutConfig.map((item) => item.slug).sort();
				assert.deepEqual(
					slugs,
					[
						'columbia',
						'endeavour',
						'enterprise',
						// "launch week.mdx" is converted to "launch-week.mdx"
						'promo/launch-week',
					].sort(),
				);
			});

			it('Returns `with schema` collection', async () => {
				assert.equal(json.hasOwnProperty('withSchemaConfig'), true);
				assert.equal(Array.isArray(json.withSchemaConfig), true);

				const ids = json.withSchemaConfig.map((item) => item.id).sort();
				const publishedDates = json.withSchemaConfig.map((item) => item.data.publishedAt);

				assert.deepEqual(ids, ['four%.md', 'one.md', 'three.md', 'two.md']);
				assert.equal(
					publishedDates.every((date) => date instanceof Date),
					true,
					'Not all publishedAt dates are Date objects',
				);
				assert.deepEqual(publishedDates.map((date) => date.toISOString()).sort(), [
					'2021-01-01T00:00:00.000Z',
					'2021-01-01T00:00:00.000Z',
					'2021-01-02T00:00:00.000Z',
					'2021-01-03T00:00:00.000Z',
				]);
			});

			it('Returns `with custom slugs` collection', async () => {
				assert.equal(json.hasOwnProperty('withSlugConfig'), true);
				assert.equal(Array.isArray(json.withSlugConfig), true);

				const slugs = json.withSlugConfig.map((item) => item.slug).sort();
				assert.deepEqual(slugs, ['excellent-three', 'fancy-one', 'interesting-two']);
			});

			it('Returns `with union schema` collection', async () => {
				assert.equal(json.hasOwnProperty('withUnionSchema'), true);
				assert.equal(Array.isArray(json.withUnionSchema), true);

				const post = json.withUnionSchema.find((item) => item.id === 'post.md');
				assert.equal(post !== undefined, true);
				assert.deepEqual(post.data, {
					type: 'post',
					title: 'My Post',
					description: 'This is my post',
				});
				const newsletter = json.withUnionSchema.find((item) => item.id === 'newsletter.md');
				assert.equal(newsletter !== undefined, true);
				assert.deepEqual(newsletter.data, {
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
				assert.equal(json.hasOwnProperty('columbiaWithoutConfig'), true);
				assert.equal(json.columbiaWithoutConfig.id, 'columbia.md');
			});

			it('Returns `with schema` collection entry', async () => {
				assert.equal(json.hasOwnProperty('oneWithSchemaConfig'), true);
				assert.equal(json.oneWithSchemaConfig.id, 'one.md');
				assert.equal(json.oneWithSchemaConfig.data.publishedAt instanceof Date, true);
				assert.equal(
					json.oneWithSchemaConfig.data.publishedAt.toISOString(),
					'2021-01-01T00:00:00.000Z',
				);
			});

			it('Returns `with custom slugs` collection entry', async () => {
				assert.equal(json.hasOwnProperty('twoWithSlugConfig'), true);
				assert.equal(json.twoWithSlugConfig.slug, 'interesting-two');
			});

			it('Returns `with union schema` collection entry', async () => {
				assert.equal(json.hasOwnProperty('postWithUnionSchema'), true);
				assert.equal(json.postWithUnionSchema.id, 'post.md');
				assert.deepEqual(json.postWithUnionSchema.data, {
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
			fixture = await loadFixture({
				root: './fixtures/content-static-paths-integration/',
				experimental: {
					contentCollectionCache: true,
				},
			});
			await fixture.build();
		});

		after(async () => await fixture.clean());

		it('Generates expected pages', async () => {
			for (const slug in blogSlugToContents) {
				assert.equal(fixture.pathExists(`/posts/${slug}`), true);
			}
		});

		it('Renders titles', async () => {
			for (const slug in blogSlugToContents) {
				const post = await fixture.readFile(`/posts/${slug}/index.html`);
				const $ = cheerio.load(post);
				assert.equal($('h1').text(), blogSlugToContents[slug].title);
			}
		});

		it('Renders content', async () => {
			for (const slug in blogSlugToContents) {
				const post = await fixture.readFile(`/posts/${slug}/index.html`);
				const $ = cheerio.load(post);
				assert.equal(
					$(blogSlugToContents[slug].element).text().trim(),
					blogSlugToContents[slug].content,
				);
			}
		});
	});

	describe('With spaces in path', () => {
		it('Does not throw', async () => {
			const fixture = await loadFixture({
				root: './fixtures/content with spaces in folder name/',
				experimental: {
					contentCollectionCache: true,
				},
			});
			let error = null;
			try {
				await fixture.build();
			} catch (e) {
				error = e.message;
			} finally {
				await fixture.clean();
			}
			assert.equal(error, null);
		});
	});
	describe('With config.mjs', () => {
		it("Errors when frontmatter doesn't match schema", async () => {
			const fixture = await loadFixture({
				root: './fixtures/content-collections-with-config-mjs/',
				experimental: {
					contentCollectionCache: true,
				},
			});
			let error;
			try {
				await fixture.build();
			} catch (e) {
				error = e.message;
			} finally {
				await fixture.clean();
			}
			assert.equal(error.includes('**title**: Expected type `"string"`, received "number"'), true);
		});
	});
	describe('With config.mts', () => {
		it("Errors when frontmatter doesn't match schema", async () => {
			const fixture = await loadFixture({
				root: './fixtures/content-collections-with-config-mts/',
				experimental: {
					contentCollectionCache: true,
				},
			});
			let error;
			try {
				await fixture.build();
			} catch (e) {
				error = e.message;
			} finally {
				await fixture.clean();
			}
			assert.equal(error.includes('**title**: Expected type `"string"`, received "number"'), true);
		});
	});

	describe('With empty markdown file', () => {
		it('Throws the right error', async () => {
			const fixture = await loadFixture({
				root: './fixtures/content-collections-empty-md-file/',
				experimental: {
					contentCollectionCache: true,
				},
			});
			let error;
			try {
				await fixture.build();
			} catch (e) {
				error = e.message;
			} finally {
				await fixture.clean();
			}
			assert.equal(error.includes('**title**: Required'), true);
		});
	});

	describe('With empty collections directory', () => {
		it('Handles the empty directory correctly', async () => {
			const fixture = await loadFixture({
				root: './fixtures/content-collections-empty-dir/',
				experimental: {
					contentCollectionCache: true,
				},
			});
			let error;
			try {
				await fixture.build();
			} catch (e) {
				error = e.message;
			} finally {
				await fixture.clean();
			}
			assert.equal(error, undefined);
			// TODO: try to render a page
		});
	});

	describe('SSR integration', () => {
		let app;
		let fixture;

		before(async () => {
			fixture = await loadFixture({
				root: './fixtures/content-ssr-integration/',
				output: 'server',
				adapter: testAdapter(),
				vite: {
					plugins: [preventNodeBuiltinDependencyPlugin()],
				},
				experimental: {
					contentCollectionCache: true,
				},
			});
			await fixture.build();
			app = await fixture.loadTestAdapterApp();
		});

		after(async () => await fixture.clean());

		it('Responds 200 for expected pages', async () => {
			for (const slug in blogSlugToContents) {
				const request = new Request('http://example.com/posts/' + slug);
				const response = await app.render(request);
				assert.equal(response.status, 200);
			}
		});

		it('Renders titles', async () => {
			for (const slug in blogSlugToContents) {
				const request = new Request('http://example.com/posts/' + slug);
				const response = await app.render(request);
				const body = await response.text();
				const $ = cheerio.load(body);
				assert.equal($('h1').text(), blogSlugToContents[slug].title);
			}
		});

		it('Renders content', async () => {
			for (const slug in blogSlugToContents) {
				const request = new Request('http://example.com/posts/' + slug);
				const response = await app.render(request);
				const body = await response.text();
				const $ = cheerio.load(body);
				assert.equal(
					$(blogSlugToContents[slug].element).text().trim(),
					blogSlugToContents[slug].content,
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

		after(async () => await fixture.clean());

		it('Includes base in links', async () => {
			const html = await fixture.readFile('/docs/index.html');
			const $ = cheerio.load(html);
			assert.equal($('link').attr('href').startsWith('/docs'), true);
		});

		it('Includes base in hoisted scripts', async () => {
			const html = await fixture.readFile('/docs/index.html');
			const $ = cheerio.load(html);
			assert.equal($('script').attr('src').startsWith('/docs'), true);
		});
	});
});
