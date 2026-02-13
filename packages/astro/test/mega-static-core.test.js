import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import * as cheerio from 'cheerio';
import parseSrcset from 'parse-srcset';
import { isWindows, loadFixture } from './test-utils.js';

describe('Mega static fixture', () => {
	/** @type {import('./test-utils').Fixture} */
	let fixture;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/mega-static/',
			outDir: './dist/mega-static-core',
		});
	});

	describe('build', () => {
		before(async () => {
			await fixture.build();
		});

		describe('Attributes', () => {
			it('Passes attributes to elements as expected', async () => {
				const html = await fixture.readFile('/astro-attrs/index.html');
				const $ = cheerio.load(html);

				const attrs = {
					'download-true': { attribute: 'download', value: '' },
					'download-false': { attribute: 'download', value: undefined },
					'download-undefined': { attribute: 'download', value: undefined },
					'download-string-empty': { attribute: 'download', value: '' },
					'download-string': { attribute: 'download', value: 'my-document.pdf' },
					'popover-auto': { attribute: 'popover', value: 'auto' },
					'popover-true': { attribute: 'popover', value: '' },
					'popover-false': { attribute: 'popover', value: undefined },
					'popover-string-empty': { attribute: 'popover', value: '' },
					'boolean-attr-true': { attribute: 'allowfullscreen', value: '' },
					'boolean-attr-false': { attribute: 'allowfullscreen', value: undefined },
					'boolean-attr-string-truthy': { attribute: 'allowfullscreen', value: '' },
					'boolean-attr-string-falsy': { attribute: 'allowfullscreen', value: undefined },
					'boolean-attr-number-truthy': { attribute: 'allowfullscreen', value: '' },
					'boolean-attr-number-falsy': { attribute: 'allowfullscreen', value: undefined },
					'data-attr-true': { attribute: 'data-foobar', value: 'true' },
					'data-attr-false': { attribute: 'data-foobar', value: 'false' },
					'data-attr-string-truthy': { attribute: 'data-foobar', value: 'foo' },
					'data-attr-string-falsy': { attribute: 'data-foobar', value: '' },
					'data-attr-number-truthy': { attribute: 'data-foobar', value: '1' },
					'data-attr-number-falsy': { attribute: 'data-foobar', value: '0' },
					'normal-attr-true': { attribute: 'foobar', value: 'true' },
					'normal-attr-false': { attribute: 'foobar', value: 'false' },
					'normal-attr-string-truthy': { attribute: 'foobar', value: 'foo' },
					'normal-attr-string-falsy': { attribute: 'foobar', value: '' },
					'normal-attr-number-truthy': { attribute: 'foobar', value: '1' },
					'normal-attr-number-falsy': { attribute: 'foobar', value: '0' },
					null: { attribute: 'attr', value: undefined },
					undefined: { attribute: 'attr', value: undefined },
					'html-enum': { attribute: 'draggable', value: 'true' },
					'html-enum-true': { attribute: 'draggable', value: 'true' },
					'html-enum-false': { attribute: 'draggable', value: 'false' },
				};

				assert.ok(!/allowfullscreen=/.test(html), 'boolean attributes should not have values');
				assert.ok(
					!/id="data-attr-string-falsy"\s+data-foobar=/.test(html),
					"data attributes should not have values if it's an empty string",
				);
				assert.ok(
					!/id="normal-attr-string-falsy"\s+data-foobar=/.test(html),
					"normal attributes should not have values if it's an empty string",
				);

				// cheerio will unescape the values, so checking that the url rendered unescaped to begin with has to be done manually
				assert.equal(
					html.includes('https://example.com/api/og?title=hello&description=somedescription'),
					true,
				);

				// cheerio will unescape the values, so checking that the url rendered unescaped to begin with has to be done manually
				assert.equal(
					html.includes('cmd: echo &#34;foo&#34; &#38;&#38; echo &#34;bar&#34; > /tmp/hello.txt'),
					true,
				);

				for (const id of Object.keys(attrs)) {
					const { attribute, value } = attrs[id];
					const attr = $(`#${id}`).attr(attribute);
					assert.equal(attr, value, `Expected ${attribute} to be ${value} for #${id}`);
				}
			});

			it('Passes boolean attributes to components as expected', async () => {
				const html = await fixture.readFile('/astro-attrs/component/index.html');
				const $ = cheerio.load(html);

				assert.equal($('#true').attr('attr'), 'attr-true');
				assert.equal($('#true').attr('type'), 'boolean');
				assert.equal($('#false').attr('attr'), 'attr-false');
				assert.equal($('#false').attr('type'), 'boolean');
			});

			it('Passes namespaced attributes as expected', async () => {
				const html = await fixture.readFile('/astro-attrs/namespaced/index.html');
				const $ = cheerio.load(html);

				assert.equal($('div').attr('xmlns:happy'), 'https://example.com/schemas/happy');
				assert.equal($('img').attr('happy:smile'), 'sweet');
			});

			it('Passes namespaced attributes to components as expected', async () => {
				const html = await fixture.readFile('/astro-attrs/namespaced-component/index.html');
				const $ = cheerio.load(html);

				assert.deepEqual($('span').attr('on:click'), '(event) => console.log(event)');
			});
		});

		describe('API routes', () => {
			it('can be returned from a response', async () => {
				const dat = await fixture.readFile('/binary.dat', null);
				assert.equal(dat.length, 1);
				assert.equal(dat[0], 0xff);
			});
		});

		describe('Pages (build)', () => {
			it('Can find page with "index" at the end file name', async () => {
				const html = await fixture.readFile('/posts/name-with-index/index.html');
				const $ = cheerio.load(html);

				assert.equal($('h1').text(), 'Name with index');
			});

			it('Can find page with quotes in file name', async () => {
				const html = await fixture.readFile("/quotes'-work-too/index.html");
				const $ = cheerio.load(html);

				assert.equal($('h1').text(), 'Quotes work too');
			});
		});

		describe('Assets', () => {
			it('built the base image', async () => {
				const html = await fixture.readFile('/astro-assets/index.html');
				const $ = cheerio.load(html);
				const imgPath = $('img').attr('src');
				const data = await fixture.readFile(imgPath);
				assert.equal(!!data, true);
			});

			it('built the 2x image', async () => {
				const html = await fixture.readFile('/astro-assets/index.html');
				const $ = cheerio.load(html);
				const srcset = $('img').attr('srcset');
				const candidates = parseSrcset(srcset);
				const match = candidates.find((a) => a.d === 2);
				const data = await fixture.readFile(match.url);
				assert.equal(!!data, true);
			});

			it('built the 3x image', async () => {
				const html = await fixture.readFile('/astro-assets/index.html');
				const $ = cheerio.load(html);
				const srcset = $('img').attr('srcset');
				const candidates = parseSrcset(srcset);
				const match = candidates.find((a) => a.d === 3);
				const data = await fixture.readFile(match.url);
				assert.equal(!!data, true);
			});

			it('built image from an import specifier', async () => {
				const html = await fixture.readFile('/astro-assets/index.html');
				const $ = cheerio.load(html);
				const src = $('#import-no-url').attr('src');
				const data = await fixture.readFile(src);
				assert.equal(!!data, true);
			});

			it('built image from an import specifier using ?url', async () => {
				const html = await fixture.readFile('/astro-assets/index.html');
				const $ = cheerio.load(html);
				const src = $('#import-url').attr('src');
				const data = await fixture.readFile(src);
				assert.equal(!!data, true);
			});
		});
	});

	if (isWindows) return;

	describe('Pages (dev)', () => {
		let devServer;

		before(async () => {
			devServer = await fixture.startDevServer();
		});

		after(async () => {
			await devServer.stop();
		});

		it('Is able to load md pages', async () => {
			const html = await fixture.fetch('/').then((res) => res.text());
			const $ = cheerio.load(html);

			assert.equal($('#testing').length > 0, true);
		});

		it('should have Vite client in dev', async () => {
			const html = await fixture.fetch('/').then((res) => res.text());
			assert.equal(
				html.includes('/@vite/client'),
				true,
				'Markdown page does not have Vite client for HMR',
			);
		});
	});
});
