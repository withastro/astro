import { expect } from 'chai';
import * as cheerio from 'cheerio';
import { Writable } from 'node:stream';
import { fileURLToPath } from 'node:url';
import testAdapter from './test-adapter.js';
import { loadFixture } from './test-utils.js';

describe('astro:image', () => {
	/** @type {import('./test-utils').Fixture} */
	let fixture;

	describe('dev', () => {
		/** @type {import('./test-utils').DevServer} */
		let devServer;
		/** @type {Array<{ type: any, level: 'error', message: string; }>} */
		let logs = [];

		before(async () => {
			fixture = await loadFixture({
				root: './fixtures/core-image/',
				experimental: {
					assets: true,
				},
			});

			devServer = await fixture.startDevServer({
				logging: {
					level: 'error',
					dest: new Writable({
						objectMode: true,
						write(event, _, callback) {
							logs.push(event);
							callback();
						},
					}),
				},
			});
		});

		after(async () => {
			await devServer.stop();
		});

		describe('basics', () => {
			let $;
			before(async () => {
				let res = await fixture.fetch('/');
				let html = await res.text();
				$ = cheerio.load(html);
			});

			it('Adds the <img> tag', () => {
				let $img = $('#local img');
				expect($img).to.have.a.lengthOf(1);
				expect($img.attr('src').startsWith('/_image')).to.equal(true);
			});

			it('includes loading and decoding attributes', () => {
				let $img = $('#local img');
				expect(!!$img.attr('loading')).to.equal(true);
				expect(!!$img.attr('decoding')).to.equal(true);
			});

			it('has width and height - no dimensions set', () => {
				let $img = $('#local img');
				expect($img.attr('width')).to.equal('207');
				expect($img.attr('height')).to.equal('243');
			});

			it('has proper width and height - only width', () => {
				let $img = $('#local-width img');
				expect($img.attr('width')).to.equal('350');
				expect($img.attr('height')).to.equal('411');
			});

			it('has proper width and height - only height', () => {
				let $img = $('#local-height img');
				expect($img.attr('width')).to.equal('170');
				expect($img.attr('height')).to.equal('200');
			});

			it('has proper width and height - has both width and height', () => {
				let $img = $('#local-both img');
				expect($img.attr('width')).to.equal('300');
				expect($img.attr('height')).to.equal('400');
			});

			it('includes the provided alt', () => {
				let $img = $('#local img');
				expect($img.attr('alt')).to.equal('a penguin');
			});

			it('middleware loads the file', async () => {
				let $img = $('#local img');
				let src = $img.attr('src');
				let res = await fixture.fetch(src);
				expect(res.status).to.equal(200);
			});

			it('returns proper content-type', async () => {
				let $img = $('#local img');
				let src = $img.attr('src');
				let res = await fixture.fetch(src);
				expect(res.headers.get('content-type')).to.equal('image/webp');
			});

			it('errors on unsupported formats', async () => {
				logs.length = 0;
				let res = await fixture.fetch('/unsupported-format');
				await res.text();

				expect(logs).to.have.a.lengthOf(1);
				expect(logs[0].message).to.contain('Received unsupported format');
			});
		});

		describe('remote', () => {
			describe('working', () => {
				let $;
				before(async () => {
					let res = await fixture.fetch('/');
					let html = await res.text();
					$ = cheerio.load(html);
				});

				it('includes the provided alt', async () => {
					let $img = $('#remote img');
					expect($img.attr('alt')).to.equal('fred');
				});

				it('includes loading and decoding attributes', () => {
					let $img = $('#remote img');
					expect(!!$img.attr('loading')).to.equal(true);
					expect(!!$img.attr('decoding')).to.equal(true);
				});

				it('includes width and height attributes', () => {
					let $img = $('#remote img');
					expect(!!$img.attr('width')).to.equal(true);
					expect(!!$img.attr('height')).to.equal(true);
				});

				it('support data: URI', () => {
					let $img = $('#data-uri img');
					expect($img.attr('src')).to.equal(
						'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA0AAAANCAYAAABy6+R8AAAAAXNSR0IArs4c6QAAAIRlWElmTU0AKgAAAAgABQESAAMAAAABAAEAAAEaAAUAAAABAAAASgEbAAUAAAABAAAAUgEoAAMAAAABAAIAAIdpAAQAAAABAAAAWgAAAAAAAABIAAAAAQAAAEgAAAABAAOgAQADAAAAAQABAACgAgAEAAAAAQAAAA2gAwAEAAAAAQAAAA0AAAAAWvB1rQAAAAlwSFlzAAALEwAACxMBAJqcGAAAAVlpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IlhNUCBDb3JlIDYuMC4wIj4KICAgPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4KICAgICAgPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIKICAgICAgICAgICAgeG1sbnM6dGlmZj0iaHR0cDovL25zLmFkb2JlLmNvbS90aWZmLzEuMC8iPgogICAgICAgICA8dGlmZjpPcmllbnRhdGlvbj4xPC90aWZmOk9yaWVudGF0aW9uPgogICAgICA8L3JkZjpEZXNjcmlwdGlvbj4KICAgPC9yZGY6UkRGPgo8L3g6eG1wbWV0YT4KGV7hBwAAAWJJREFUKBVtUDEsQ1EUve+1/SItKYMIkYpF06GJdGAwNFFGkxBEYupssRm6EpvJbpVoYhRd6FBikDSxYECsBpG25D/nvP/+p+Ik551z73v33feuyA/izq5CL8ET8ALcBolYIP+vd0ibX/yAT7uj2qkVzwWzUBa0nbacbkKJHi5dlYhXmARYeAS+MwCWA5FPqKIP/9IH/wiygMru5y5mcRYkPHYKP7gAPw4SDbCjRXMgRBJctM4t4ROriM2QSpmkeOtub6YfMYrZvelykbD1sxJVg+6AfKqURRKQLfA4JvoVWgIjDMNlGLVKZxNRFsZsoHGAgREZHKPlJEi2t7if3r2KKS9nVOo0rtNZ3yR7M/VGTqTy5Y4o/scWHBbKfIq0/eZ+x3850OZpaTTxlu/4D3ssuA72uxrYS2rFYjh+aRbmb24LpTVu1IqVKG8P/lmUEaNMxeh6fmquOhkMBE8JJ2yPfwPjdVhiDbiX6AAAAABJRU5ErkJggg=='
					);
					expect(!!$img.attr('width')).to.equal(true);
					expect(!!$img.attr('height')).to.equal(true);
				});

				it('support images from public', () => {
					let $img = $('#public img');
					expect($img.attr('src')).to.equal('/penguin3.jpg');
					expect(!!$img.attr('width')).to.equal(true);
					expect(!!$img.attr('height')).to.equal(true);
				});
			});

			it('error if no width and height', async () => {
				logs.length = 0;
				let res = await fixture.fetch('/remote-error-no-dimensions');
				await res.text();

				expect(logs).to.have.a.lengthOf(1);
				expect(logs[0].message).to.contain('Missing width and height attributes');
			});

			it('error if no height', async () => {
				logs.length = 0;
				let res = await fixture.fetch('/remote-error-no-height');
				await res.text();

				expect(logs).to.have.a.lengthOf(1);
				expect(logs[0].message).to.contain('Missing height attribute');
			});

			it('supports aliases', async () => {
				let res = await fixture.fetch('/alias');
				let html = await res.text();
				let $ = cheerio.load(html);

				let $img = $('img');
				expect($img).to.have.a.lengthOf(1);
				expect($img.attr('src').includes('penguin1.jpg')).to.equal(true);
			});
		});

		describe('markdown', () => {
			let $;
			before(async () => {
				let res = await fixture.fetch('/post');
				let html = await res.text();
				$ = cheerio.load(html);
			});

			it('Adds the <img> tag', () => {
				let $img = $('img');
				expect($img).to.have.a.lengthOf(1);

				// Verbose test for the full URL to make sure the image went through the full pipeline
				expect($img.attr('src')).to.equal(
					'/_image?href=%2Fsrc%2Fassets%2Fpenguin1.jpg%3ForigWidth%3D207%26origHeight%3D243%26origFormat%3Djpg&f=webp'
				);
			});

			it('has width and height attributes', () => {
				let $img = $('img');
				expect(!!$img.attr('width')).to.equal(true);
				expect(!!$img.attr('height')).to.equal(true);
			});

			it('Supports aliased paths', async () => {
				let res = await fixture.fetch('/aliasMarkdown');
				let html = await res.text();
				$ = cheerio.load(html);

				let $img = $('img');
				expect($img.attr('src').startsWith('/_image')).to.equal(true);
			});
		});

		describe('getImage', () => {
			let $;
			before(async () => {
				let res = await fixture.fetch('/get-image');
				let html = await res.text();
				$ = cheerio.load(html);
			});

			it('Adds the <img> tag', () => {
				let $img = $('img');
				expect($img).to.have.a.lengthOf(1);
				expect($img.attr('src').startsWith('/_image')).to.equal(true);
			});

			it('includes the provided alt', () => {
				let $img = $('img');
				expect($img.attr('alt')).to.equal('a penguin');
			});
		});

		describe('content collections', () => {
			let $;
			before(async () => {
				let res = await fixture.fetch('/blog/one');
				let html = await res.text();
				$ = cheerio.load(html);
			});

			it('Adds the <img> tags', () => {
				let $img = $('img');
				expect($img).to.have.a.lengthOf(4);
			});

			it('has proper source for directly used image', () => {
				let $img = $('#direct-image img');
				expect($img.attr('src').startsWith('/src/')).to.equal(true);
			});

			it('has proper attributes for optimized image through getImage', () => {
				let $img = $('#optimized-image-get-image img');
				expect($img.attr('src').startsWith('/_image')).to.equal(true);
				expect($img.attr('width')).to.equal('207');
				expect($img.attr('height')).to.equal('243');
			});

			it('has proper attributes for optimized image through Image component', () => {
				let $img = $('#optimized-image-component img');
				expect($img.attr('src').startsWith('/_image')).to.equal(true);
				expect($img.attr('width')).to.equal('207');
				expect($img.attr('height')).to.equal('243');
				expect($img.attr('alt')).to.equal('A penguin!');
			});

			it('properly handles nested images', () => {
				let $img = $('#nested-image img');
				expect($img.attr('src').startsWith('/src/')).to.equal(true);
			});
		});

		describe('regular img tag', () => {
			/** @type {ReturnType<import('cheerio')['load']>} */
			let $;
			before(async () => {
				let res = await fixture.fetch('/regular-img');
				let html = await res.text();
				$ = cheerio.load(html);
			});

			it('does not have a file url', async () => {
				expect($('img').attr('src').startsWith('file://')).to.equal(false);
			});

			it('includes /src in the path', async () => {
				expect($('img').attr('src').startsWith('/src')).to.equal(true);
			});
		});
	});

	describe('proper errors', () => {
		/** @type {import('./test-utils').DevServer} */
		let devServer;
		/** @type {Array<{ type: any, level: 'error', message: string; }>} */
		let logs = [];

		before(async () => {
			fixture = await loadFixture({
				root: './fixtures/core-image-errors/',
				experimental: {
					assets: true,
				},
			});

			devServer = await fixture.startDevServer({
				logging: {
					level: 'error',
					dest: new Writable({
						objectMode: true,
						write(event, _, callback) {
							logs.push(event);
							callback();
						},
					}),
				},
			});
		});

		after(async () => {
			await devServer.stop();
		});

		it("properly error when getImage's first parameter isn't filled", async () => {
			logs.length = 0;
			let res = await fixture.fetch('/get-image-empty');
			await res.text();

			expect(logs).to.have.a.lengthOf(1);
			expect(logs[0].message).to.contain('Expected getImage() parameter');
		});

		// TODO: For some reason, this error crashes the dev server?
		it.skip('properly error when src is undefined', async () => {
			logs.length = 0;
			let res = await fixture.fetch('/get-image-undefined');
			await res.text();

			expect(logs).to.have.a.lengthOf(1);
			expect(logs[0].message).to.contain('Expected src to be an image.');
		});

		it('properly error image in Markdown frontmatter is not found', async () => {
			logs.length = 0;
			let res = await fixture.fetch('/blog/one');
			const text = await res.text();

			expect(logs).to.have.a.lengthOf(1);
			expect(logs[0].message).to.contain('does not exist. Is the path correct?');
		});

		it('properly error image in Markdown content is not found', async () => {
			logs.length = 0;
			let res = await fixture.fetch('/post');
			const text = await res.text();

			expect(logs).to.have.a.lengthOf(1);
			expect(logs[0].message).to.contain('Could not find requested image');
		});
	});

	describe('support base option correctly', () => {
		before(async () => {
			fixture = await loadFixture({
				root: './fixtures/core-image-base/',
				experimental: {
					assets: true,
				},
				base: '/blog',
			});
			await fixture.build();
		});

		it('has base path prefix when using the Image component', async () => {
			const html = await fixture.readFile('/index.html');
			const $ = cheerio.load(html);
			const src = $('#local img').attr('src');
			expect(src.length).to.be.greaterThan(0);
			expect(src.startsWith('/blog')).to.be.true;
		});

		it('has base path prefix when using getImage', async () => {
			const html = await fixture.readFile('/get-image/index.html');
			const $ = cheerio.load(html);
			const src = $('img').attr('src');
			expect(src.length).to.be.greaterThan(0);
			expect(src.startsWith('/blog')).to.be.true;
		});

		it('has base path prefix when using image directly', async () => {
			const html = await fixture.readFile('/direct/index.html');
			const $ = cheerio.load(html);
			const src = $('img').attr('src');
			expect(src.length).to.be.greaterThan(0);
			expect(src.startsWith('/blog')).to.be.true;
		});

		it('has base path prefix in Markdown', async () => {
			const html = await fixture.readFile('/post/index.html');
			const $ = cheerio.load(html);
			const src = $('img').attr('src');
			expect(src.length).to.be.greaterThan(0);
			expect(src.startsWith('/blog')).to.be.true;
		});

		it('has base path prefix in Content Collection frontmatter', async () => {
			const html = await fixture.readFile('/blog/one/index.html');
			const $ = cheerio.load(html);
			const src = $('img').attr('src');
			expect(src.length).to.be.greaterThan(0);
			expect(src.startsWith('/blog')).to.be.true;
		});
	});

	describe('build ssg', () => {
		before(async () => {
			fixture = await loadFixture({
				root: './fixtures/core-image-ssg/',
				experimental: {
					assets: true,
				},
			});
			await fixture.build();
		});

		it('writes out images to dist folder', async () => {
			const html = await fixture.readFile('/index.html');
			const $ = cheerio.load(html);
			const src = $('#local img').attr('src');
			expect(src.length).to.be.greaterThan(0);
			const data = await fixture.readFile(src, null);
			expect(data).to.be.an.instanceOf(Buffer);
		});

		it('writes out images to dist folder with proper extension if no format was passed', async () => {
			const html = await fixture.readFile('/index.html');
			const $ = cheerio.load(html);
			const src = $('#local img').attr('src');
			expect(src.endsWith('.webp')).to.be.true;
		});

		it('getImage() usage also written', async () => {
			const html = await fixture.readFile('/get-image/index.html');
			const $ = cheerio.load(html);
			let $img = $('img');

			// <img> tag
			expect($img).to.have.a.lengthOf(1);
			expect($img.attr('alt')).to.equal('a penguin');

			// image itself
			const src = $img.attr('src');
			const data = await fixture.readFile(src, null);
			expect(data).to.be.an.instanceOf(Buffer);
		});

		it('markdown images are written', async () => {
			const html = await fixture.readFile('/post/index.html');
			const $ = cheerio.load(html);
			let $img = $('img');

			// <img> tag
			expect($img).to.have.a.lengthOf(1);
			expect($img.attr('alt')).to.equal('My article cover');

			// image itself
			const src = $img.attr('src');
			const data = await fixture.readFile(src, null);
			expect(data).to.be.an.instanceOf(Buffer);
		});

		it('aliased images are written', async () => {
			const html = await fixture.readFile('/alias/index.html');

			const $ = cheerio.load(html);
			let $img = $('img');

			// <img> tag
			expect($img).to.have.a.lengthOf(1);
			expect($img.attr('alt')).to.equal('A penguin!');

			// image itself
			const src = $img.attr('src');
			const data = await fixture.readFile(src, null);
			expect(data).to.be.an.instanceOf(Buffer);
		});

		it('aliased images in Markdown are written', async () => {
			const html = await fixture.readFile('/aliasMarkdown/index.html');

			const $ = cheerio.load(html);
			let $img = $('img');

			// <img> tag
			expect($img).to.have.a.lengthOf(1);
			expect($img.attr('alt')).to.equal('A penguin');

			// image itself
			const src = $img.attr('src');
			const data = await fixture.readFile(src, null);
			expect(data).to.be.an.instanceOf(Buffer);
		});

		it('output files for content collections images', async () => {
			const html = await fixture.readFile('/blog/one/index.html');

			const $ = cheerio.load(html);
			let $img = $('img');
			expect($img).to.have.a.lengthOf(2);

			const srcdirect = $('#direct-image img').attr('src');
			const datadirect = await fixture.readFile(srcdirect, null);
			expect(datadirect).to.be.an.instanceOf(Buffer);

			const srcnested = $('#nested-image img').attr('src');
			const datanested = await fixture.readFile(srcnested, null);
			expect(datanested).to.be.an.instanceOf(Buffer);
		});

		it('quality attribute produces a different file', async () => {
			const html = await fixture.readFile('/quality/index.html');
			const $ = cheerio.load(html);
			expect($('#no-quality img').attr('src')).to.not.equal($('#quality-low img').attr('src'));
		});

		it('quality can be a number between 0-100', async () => {
			const html = await fixture.readFile('/quality/index.html');
			const $ = cheerio.load(html);
			expect($('#no-quality img').attr('src')).to.not.equal($('#quality-num img').attr('src'));
		});

		it('format attribute produces a different file', async () => {
			const html = await fixture.readFile('/format/index.html');
			const $ = cheerio.load(html);
			expect($('#no-format img').attr('src')).to.not.equal($('#format-avif img').attr('src'));
		});
	});

	describe('prod ssr', () => {
		before(async () => {
			fixture = await loadFixture({
				root: './fixtures/core-image-ssr/',
				output: 'server',
				adapter: testAdapter(),
				experimental: {
					assets: true,
				},
			});
			await fixture.build();
		});

		// TODO
		// This is not working because the image service does a fetch() on the underlying
		// image and we do not have an HTTP server in these tests. We either need
		// to start one, or find another way to tell the image service how to load these files.
		it.skip('dynamic route images are built at response time', async () => {
			const app = await fixture.loadTestAdapterApp();
			let request = new Request('http://example.com/');
			let response = await app.render(request);
			expect(response.status).to.equal(200);
			const html = await response.text();
			const $ = cheerio.load(html);
			const src = $('#local img').attr('src');
			request = new Request('http://example.com' + src);
			response = await app.render(request);
			expect(response.status).to.equal(200);
		});

		it('prerendered routes images are built', async () => {
			const html = await fixture.readFile('/client/prerender/index.html');
			const $ = cheerio.load(html);
			const src = $('img').attr('src');
			const imgData = await fixture.readFile('/client' + src, null);
			expect(imgData).to.be.an.instanceOf(Buffer);
		});
	});

	describe('custom service', () => {
		/** @type {import('./test-utils').DevServer} */
		let devServer;
		before(async () => {
			fixture = await loadFixture({
				root: './fixtures/core-image/',
				experimental: {
					assets: true,
				},
				image: {
					service: fileURLToPath(new URL('./fixtures/core-image/service.mjs', import.meta.url)),
				},
			});
			devServer = await fixture.startDevServer();
		});

		it('custom service implements getHTMLAttributes', async () => {
			const response = await fixture.fetch('/');
			const html = await response.text();

			const $ = cheerio.load(html);
			expect($('#local img').attr('data-service')).to.equal('my-custom-service');
		});

		it('custom service works in Markdown', async () => {
			const response = await fixture.fetch('/post');
			const html = await response.text();

			const $ = cheerio.load(html);
			expect($('img').attr('data-service')).to.equal('my-custom-service');
		});
	});
});
