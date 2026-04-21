import * as assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import mdx from '@astrojs/mdx';
import * as cheerio from 'cheerio';
import { parseHTML } from 'linkedom';
import { loadFixture, type Fixture, type DevServer } from '../../../astro/test/test-utils.js';

// Merged fixture: combines mdx-component, mdx-slots, mdx-frontmatter,
// mdx-url-export, mdx-get-static-paths, and mdx-script-style-raw.
// All use the same config: integrations: [mdx()], sharing one build and one dev server.
const FIXTURE_ROOT = new URL('./fixtures/mdx-basics/', import.meta.url);

describe('MDX basics (merged fixture)', () => {
	let fixture: Fixture;

	before(async () => {
		fixture = await loadFixture({
			root: FIXTURE_ROOT,
			integrations: [mdx()],
		});
	});

	describe('build', () => {
		before(async () => {
			await fixture.build();
		});

		// --- MDX Component tests (was mdx-component.test.js) ---

		describe('component', () => {
			it('supports top-level imports', async () => {
				const html = await fixture.readFile('/component/index.html');
				const { document } = parseHTML(html);

				const h1 = document.querySelector('h1')!;
				const foo = document.querySelector('#foo')!;

				assert.equal(h1.textContent, 'Hello component!');
				assert.equal(foo.textContent, 'bar');
			});

			it('supports glob imports - <Component.default />', async () => {
				const html = await fixture.readFile('/component/glob/index.html');
				const { document } = parseHTML(html);

				const h1 = document.querySelector('[data-default-export] h1')!;
				const foo = document.querySelector('[data-default-export] #foo')!;

				assert.equal(h1.textContent, 'Hello component!');
				assert.equal(foo.textContent, 'bar');
			});

			it('supports glob imports - <Content />', async () => {
				const html = await fixture.readFile('/component/glob/index.html');
				const { document } = parseHTML(html);

				const h1 = document.querySelector('[data-content-export] h1')!;
				const foo = document.querySelector('[data-content-export] #foo')!;

				assert.equal(h1.textContent, 'Hello component!');
				assert.equal(foo.textContent, 'bar');
			});

			describe('with <Fragment>', () => {
				it('supports top-level imports', async () => {
					const html = await fixture.readFile('/component/w-fragment/index.html');
					const { document } = parseHTML(html);

					const h1 = document.querySelector('h1')!;
					const p = document.querySelector('p')!;

					assert.equal(h1.textContent, 'MDX containing <Fragment />');
					assert.equal(p.textContent, 'bar');
				});

				it('supports glob imports - <Component.default />', async () => {
					const html = await fixture.readFile('/component/glob/index.html');
					const { document } = parseHTML(html);

					const h = document.querySelector(
						'[data-default-export] [data-file="WithFragment.mdx"] h1',
					)!;
					const p = document.querySelector(
						'[data-default-export] [data-file="WithFragment.mdx"] p',
					)!;

					assert.equal(h.textContent, 'MDX containing <Fragment />');
					assert.equal(p.textContent, 'bar');
				});

				it('supports glob imports - <Content />', async () => {
					const html = await fixture.readFile('/component/glob/index.html');
					const { document } = parseHTML(html);

					const h = document.querySelector(
						'[data-content-export] [data-file="WithFragment.mdx"] h1',
					)!;
					const p = document.querySelector(
						'[data-content-export] [data-file="WithFragment.mdx"] p',
					)!;

					assert.equal(h.textContent, 'MDX containing <Fragment />');
					assert.equal(p.textContent, 'bar');
				});
			});
		});

		// --- MDX Slots tests (was mdx-slots.test.js) ---

		describe('slots', () => {
			it('supports top-level imports', async () => {
				const html = await fixture.readFile('/slots/index.html');
				const { document } = parseHTML(html);

				const h1 = document.querySelector('h1')!;
				const defaultSlot = document.querySelector('[data-default-slot]')!;
				const namedSlot = document.querySelector('[data-named-slot]')!;

				assert.equal(h1.textContent, 'Hello slotted component!');
				assert.equal(defaultSlot.textContent, 'Default content.');
				assert.equal(namedSlot.textContent, 'Content for named slot.');
			});

			it('supports glob imports - <Component.default />', async () => {
				const html = await fixture.readFile('/slots/glob/index.html');
				const { document } = parseHTML(html);

				const h1 = document.querySelector('[data-default-export] h1')!;
				const defaultSlot = document.querySelector('[data-default-export] [data-default-slot]')!;
				const namedSlot = document.querySelector('[data-default-export] [data-named-slot]')!;

				assert.equal(h1.textContent, 'Hello slotted component!');
				assert.equal(defaultSlot.textContent, 'Default content.');
				assert.equal(namedSlot.textContent, 'Content for named slot.');
			});

			it('supports glob imports - <Content />', async () => {
				const html = await fixture.readFile('/slots/glob/index.html');
				const { document } = parseHTML(html);

				const h1 = document.querySelector('[data-content-export] h1')!;
				const defaultSlot = document.querySelector('[data-content-export] [data-default-slot]')!;
				const namedSlot = document.querySelector('[data-content-export] [data-named-slot]')!;

				assert.equal(h1.textContent, 'Hello slotted component!');
				assert.equal(defaultSlot.textContent, 'Default content.');
				assert.equal(namedSlot.textContent, 'Content for named slot.');
			});
		});

		// --- MDX Frontmatter tests (was mdx-frontmatter.test.js) ---

		describe('frontmatter', () => {
			it('builds when "frontmatter.property" is in JSX expression', async () => {
				assert.equal(true, true);
			});

			it('extracts frontmatter to "frontmatter" export', async () => {
				const { titles } = JSON.parse(await fixture.readFile('/frontmatter/glob.json'));
				assert.equal(titles.includes('Using YAML frontmatter'), true);
			});

			it('renders layout from "layout" frontmatter property', async () => {
				const html = await fixture.readFile('/frontmatter/index.html');
				const { document } = parseHTML(html);

				const layoutParagraph = document.querySelector('[data-layout-rendered]');

				assert.notEqual(layoutParagraph, null);
			});

			it('passes frontmatter to layout via "content" and "frontmatter" props', async () => {
				const html = await fixture.readFile('/frontmatter/index.html');
				const { document } = parseHTML(html);

				const contentTitle = document.querySelector('[data-content-title]')!;
				const frontmatterTitle = document.querySelector('[data-frontmatter-title]')!;

				assert.equal(contentTitle.textContent, 'Using YAML frontmatter');
				assert.equal(frontmatterTitle.textContent, 'Using YAML frontmatter');
			});

			it('passes headings to layout via "headings" prop', async () => {
				const html = await fixture.readFile('/frontmatter/with-headings/index.html');
				const { document } = parseHTML(html);

				const headingSlugs = [...document.querySelectorAll('[data-headings] > li')].map(
					(el) => el.textContent,
				);

				assert.equal(headingSlugs.length > 0, true);
				assert.equal(headingSlugs.includes('section-1'), true);
				assert.equal(headingSlugs.includes('section-2'), true);
			});

			it('passes "file" and "url" to layout', async () => {
				const html = await fixture.readFile('/frontmatter/with-headings/index.html');
				const { document } = parseHTML(html);

				const frontmatterFile = document.querySelector('[data-frontmatter-file]')?.textContent;
				const frontmatterUrl = document.querySelector('[data-frontmatter-url]')?.textContent;
				const file = document.querySelector('[data-file]')?.textContent;
				const url = document.querySelector('[data-url]')?.textContent;

				assert.equal(
					frontmatterFile?.endsWith('with-headings.mdx'),
					true,
					'"file" prop does not end with correct path or is undefined',
				);
				assert.equal(frontmatterUrl, '/frontmatter/with-headings');
				assert.equal(file, frontmatterFile);
				assert.equal(url, frontmatterUrl);
			});
		});

		// --- MDX URL Export tests (was mdx-url-export.test.js) ---

		describe('url export', () => {
			it('generates correct urls in glob result', async () => {
				const { urls } = JSON.parse(await fixture.readFile('/url-export/pages.json'));
				assert.equal(urls.includes('/url-export/test-1'), true);
				assert.equal(urls.includes('/url-export/test-2'), true);
			});

			it('respects "export url" overrides in glob result', async () => {
				const { urls } = JSON.parse(await fixture.readFile('/url-export/pages.json'));
				assert.equal(urls.includes('/AH!'), true);
			});
		});

		// --- getStaticPaths tests (was mdx-get-static-paths.test.js) ---

		describe('getStaticPaths', () => {
			it('Provides file and url', async () => {
				const html = await fixture.readFile('/static-paths/one/index.html');

				const $ = cheerio.load(html);
				assert.equal($('p').text(), 'First mdx file');
				assert.equal($('#one').text(), 'hello', 'Frontmatter included');
				assert.equal($('#url').text(), 'src/content/1.mdx', 'url is included');
				assert.equal(
					$('#file').text().includes('fixtures/mdx-basics/src/content/1.mdx'),
					true,
					'file is included',
				);
			});
		});

		// --- MDX script/style raw tests (was mdx-script-style-raw.test.js, build part) ---

		describe('script-style-raw', () => {
			it('works with raw script and style strings', async () => {
				const html = await fixture.readFile('/script-style-raw/index.html');
				const { document } = parseHTML(html);

				const scriptContent = document.getElementById('test-script')!.innerHTML;
				assert.equal(
					scriptContent.includes("console.log('raw script')"),
					true,
					'script should not be html-escaped',
				);

				const styleContent = document.getElementById('test-style')!.innerHTML;
				assert.equal(
					styleContent.includes('h1[id="script-style-raw"]'),
					true,
					'style should not be html-escaped',
				);
			});
		});
	});

	describe('dev', () => {
		let devServer: DevServer;

		before(async () => {
			devServer = await fixture.startDevServer();
		});

		after(async () => {
			await devServer.stop();
		});

		// --- MDX Component dev tests ---

		describe('component', () => {
			it('supports top-level imports', async () => {
				const res = await fixture.fetch('/component');
				assert.equal(res.status, 200);

				const html = await res.text();
				const { document } = parseHTML(html);

				const h1 = document.querySelector('h1')!;
				const foo = document.querySelector('#foo')!;

				assert.equal(h1.textContent, 'Hello component!');
				assert.equal(foo.textContent, 'bar');
			});

			it('supports glob imports - <Component.default />', async () => {
				const res = await fixture.fetch('/component/glob');
				assert.equal(res.status, 200);

				const html = await res.text();
				const { document } = parseHTML(html);

				const h1 = document.querySelector('[data-default-export] h1')!;
				const foo = document.querySelector('[data-default-export] #foo')!;

				assert.equal(h1.textContent, 'Hello component!');
				assert.equal(foo.textContent, 'bar');
			});

			it('supports glob imports - <Content />', async () => {
				const res = await fixture.fetch('/component/glob');
				assert.equal(res.status, 200);

				const html = await res.text();
				const { document } = parseHTML(html);

				const h1 = document.querySelector('[data-content-export] h1')!;
				const foo = document.querySelector('[data-content-export] #foo')!;

				assert.equal(h1.textContent, 'Hello component!');
				assert.equal(foo.textContent, 'bar');
			});

			describe('with <Fragment>', () => {
				it('supports top-level imports', async () => {
					const res = await fixture.fetch('/component/w-fragment');
					assert.equal(res.status, 200);

					const html = await res.text();
					const { document } = parseHTML(html);

					const h1 = document.querySelector('h1')!;
					const p = document.querySelector('p')!;

					assert.equal(h1.textContent, 'MDX containing <Fragment />');
					assert.equal(p.textContent, 'bar');
				});

				it('supports glob imports - <Component.default />', async () => {
					const res = await fixture.fetch('/component/glob');
					assert.equal(res.status, 200);

					const html = await res.text();
					const { document } = parseHTML(html);

					const h = document.querySelector(
						'[data-default-export] [data-file="WithFragment.mdx"] h1',
					)!;
					const p = document.querySelector(
						'[data-default-export] [data-file="WithFragment.mdx"] p',
					)!;

					assert.equal(h.textContent, 'MDX containing <Fragment />');
					assert.equal(p.textContent, 'bar');
				});

				it('supports glob imports - <Content />', async () => {
					const res = await fixture.fetch('/component/glob');
					assert.equal(res.status, 200);

					const html = await res.text();
					const { document } = parseHTML(html);

					const h = document.querySelector(
						'[data-content-export] [data-file="WithFragment.mdx"] h1',
					)!;
					const p = document.querySelector(
						'[data-content-export] [data-file="WithFragment.mdx"] p',
					)!;

					assert.equal(h.textContent, 'MDX containing <Fragment />');
					assert.equal(p.textContent, 'bar');
				});
			});
		});

		// --- MDX Slots dev tests ---

		describe('slots', () => {
			it('supports top-level imports', async () => {
				const res = await fixture.fetch('/slots');
				assert.equal(res.status, 200);

				const html = await res.text();
				const { document } = parseHTML(html);

				const h1 = document.querySelector('h1')!;
				const defaultSlot = document.querySelector('[data-default-slot]')!;
				const namedSlot = document.querySelector('[data-named-slot]')!;

				assert.equal(h1.textContent, 'Hello slotted component!');
				assert.equal(defaultSlot.textContent, 'Default content.');
				assert.equal(namedSlot.textContent, 'Content for named slot.');
			});

			it('supports glob imports - <Component.default />', async () => {
				const res = await fixture.fetch('/slots/glob');
				assert.equal(res.status, 200);

				const html = await res.text();
				const { document } = parseHTML(html);

				const h1 = document.querySelector('[data-default-export] h1')!;
				const defaultSlot = document.querySelector('[data-default-export] [data-default-slot]')!;
				const namedSlot = document.querySelector('[data-default-export] [data-named-slot]')!;

				assert.equal(h1.textContent, 'Hello slotted component!');
				assert.equal(defaultSlot.textContent, 'Default content.');
				assert.equal(namedSlot.textContent, 'Content for named slot.');
			});

			it('supports glob imports - <Content />', async () => {
				const res = await fixture.fetch('/slots/glob');
				assert.equal(res.status, 200);

				const html = await res.text();
				const { document } = parseHTML(html);

				const h1 = document.querySelector('[data-content-export] h1')!;
				const defaultSlot = document.querySelector('[data-content-export] [data-default-slot]')!;
				const namedSlot = document.querySelector('[data-content-export] [data-named-slot]')!;

				assert.equal(h1.textContent, 'Hello slotted component!');
				assert.equal(defaultSlot.textContent, 'Default content.');
				assert.equal(namedSlot.textContent, 'Content for named slot.');
			});
		});

		// --- MDX script/style raw dev tests ---

		describe('script-style-raw', () => {
			it('works with raw script and style strings', async () => {
				const res = await fixture.fetch('/script-style-raw');
				assert.equal(res.status, 200);

				const html = await res.text();
				const { document } = parseHTML(html);

				const scriptContent = document.getElementById('test-script')!.innerHTML;
				assert.equal(
					scriptContent.includes("console.log('raw script')"),
					true,
					'script should not be html-escaped',
				);

				const styleContent = document.getElementById('test-style')!.innerHTML;
				assert.equal(
					styleContent.includes('h1[id="script-style-raw"]'),
					true,
					'style should not be html-escaped',
				);
			});
		});
	});
});
