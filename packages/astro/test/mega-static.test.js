import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { after, before, describe, it } from 'node:test';
import { load as cheerioLoad } from 'cheerio';
import node from '@astrojs/node';
import { Logger } from '../dist/core/logger/core.js';
import { isWindows, loadFixture } from './test-utils.js';

const root = './fixtures/mega-static/';

function addLeadingSlash(path) {
	return path.startsWith('/') ? path : '/' + path;
}

function removeBasePath(path) {
	return path.replace('/subpath', '');
}

describe('Mega static build', () => {
	/** @type {import('./test-utils').Fixture} */
	let fixture;
	/** @type {import('../src/core/logger/core').LogMessage[]} */
	let logs = [];

	before(async () => {
		const logger = new Logger({
			dest: {
				write(chunk) {
					logs.push(chunk);
				},
			},
			level: 'warn',
		});

		fixture = await loadFixture({
			root,
			outDir: './dist/mega-static/default',
			build: { inlineStylesheets: 'never' },
		});
		await fixture.build({ logger });
	});

	it('generates canonical redirect page with site prefix', async () => {
		const html = await fixture.readFile('/old/index.html');
		const $ = cheerioLoad(html);
		const link = $('link[rel="canonical"]');
		const href = link.attr('href');
		assert.match(href, /http/);
	});

	it('Builds out .astro pages', async () => {
		const html = await fixture.readFile('/index.html');
		assert.equal(typeof html, 'string');
	});

	it('can build pages using import.meta.glob()', async () => {
		const html = await fixture.readFile('/index.html');
		const $ = cheerioLoad(html);
		const link = $('.posts a');
		const href = link.attr('href');
		assert.equal(href, '/subpath/posts/thoughts');
	});

	it('Builds out .md pages', async () => {
		const html = await fixture.readFile('/posts/thoughts/index.html');
		assert.equal(typeof html, 'string');
	});

	it('Builds out .json files', async () => {
		const content = await fixture.readFile('/company.json').then((text) => JSON.parse(text));
		assert.equal(content.name, 'Astro Technology Company');
		assert.equal(content.url, 'https://astro.build/');
	});

	it('Builds out async .json files', async () => {
		const content = await fixture.readFile('/posts.json').then((text) => JSON.parse(text));
		assert.equal(Array.isArray(content), true);
		assert.deepEqual(content, [
			{
				filename: './posts/nested/more.md',
				title: 'More post',
			},
			{
				filename: './posts/thoughts.md',
				title: 'Thoughts post',
			},
		]);
	});

	it('Builds out dynamic .json files', async () => {
		const slugs = ['thing1', 'thing2'];

		for (const slug of slugs) {
			const content = await fixture.readFile(`/data/${slug}.json`).then((text) => JSON.parse(text));
			assert.equal(content.name, 'Astro Technology Company');
			assert.equal(content.url, 'https://astro.build/');
			assert.equal(content.slug, slug);
		}
	});

	function createFindEvidence(expected) {
		return async function findEvidence(pathname) {
			const html = await fixture.readFile(pathname);
			const $ = cheerioLoad(html);
			const links = $('link[rel=stylesheet]');
			for (const link of links) {
				const href = $(link).attr('href');
				assert.equal(href.startsWith('/subpath/'), true);
				const data = await fixture.readFile(removeBasePath(addLeadingSlash(href)));
				if (expected.test(data)) {
					return true;
				}
			}

			return false;
		};
	}

	describe('Page CSS', () => {
		const findEvidence = createFindEvidence(/height:\s*45vw/);

		it('Page level CSS is added', async () => {
			const found = await findEvidence('/index.html');
			assert.equal(found, true, 'Did not find page-level CSS on this page');
		});
	});

	describe('Shared CSS', () => {
		const findEvidence = createFindEvidence(/var\(--c\)/);

		it('Included on the index page', async () => {
			const found = await findEvidence('/index.html');
			assert.equal(found, true, 'Did not find shared CSS on this page');
		});

		it('Included on a md page', async () => {
			const found = await findEvidence('/posts/thoughts/index.html');
			assert.equal(found, true, 'Did not find shared CSS on this page');
		});
	});

	describe('CSS modules', () => {
		const findEvidence = createFindEvidence(/var\(--c-black\)/);

		it('Is included in the index CSS', async () => {
			const found = await findEvidence('/index.html');
			assert.equal(found, true, 'Did not find shared CSS module code');
		});
	});

	describe('Scripts', () => {
		it('Get included on the page', async () => {
			const html = await fixture.readFile('/scripts/index.html');
			const $ = cheerioLoad(html);
			assert.equal($('script[type="module"]').length, 2, 'Script added');
		});

		it('Do not get added to the wrong page', async () => {
			const scriptsHTML = await fixture.readFile('/scripts/index.html');
			const $ = cheerioLoad(scriptsHTML);
			const href = $('script[type="module"]').attr('src');
			const indexHTML = await fixture.readFile('/index.html');
			const $$ = cheerioLoad(indexHTML);
			assert.equal($$(`script[src="${href}"]`).length, 0, 'no script added to different page');
		});
	});

	it('honors ssr config', async () => {
		const html = await fixture.readFile('/index.html');
		const $ = cheerioLoad(html);
		assert.equal($('#ssr-config').text(), 'testing');
	});

	it('warns when accessing headers', async () => {
		let found = false;
		for (const log of logs) {
			if (/`Astro\.request\.headers` is not available on prerendered pages./.test(log.message)) {
				found = true;
			}
		}
		assert.equal(found, true, 'Found the log message');
	});

	describe('Pages (special names)', () => {
		it('Can find page with "index" at the end file name', async () => {
			const html = await fixture.readFile('/posts/name-with-index/index.html');
			const $ = cheerioLoad(html);
			assert.equal($('h1').text(), 'Name with index');
		});

		it('Can find page with quotes in file name', async () => {
			const html = await fixture.readFile("/quotes'-work-too/index.html");
			const $ = cheerioLoad(html);
			assert.equal($('h1').text(), 'Quotes work too');
		});
	});

	if (!isWindows) {
		describe('Development (markdown pages)', () => {
			let devServer;

			before(async () => {
				devServer = await fixture.startDevServer();
			});

			after(async () => {
				await devServer.stop();
			});

			it('Is able to load md pages', async () => {
				const html = await fixture.fetch('/md-test').then((res) => res.text());
				const $ = cheerioLoad(html);
				assert.equal($('h1').text(), 'Testing');
			});

			it('should have Vite client in dev', async () => {
				const html = await fixture.fetch('/md-test').then((res) => res.text());
				assert.equal(
					html.includes('/@vite/client'),
					true,
					'Markdown page does not have Vite client for HMR',
				);
			});
		});
	}

	describe('Frameworks', () => {
		if (isWindows) {
			return;
		}

		it('can build preact', async () => {
			const html = await fixture.readFile('/preact/index.html');
			assert.equal(typeof html, 'string');
		});

		it('can build react', async () => {
			const html = await fixture.readFile('/react/index.html');
			assert.equal(typeof html, 'string');
		});

		it.skip('can build lit', async () => {
			const html = await fixture.readFile('/lit/index.html');
			assert.equal(typeof html, 'string');
		});

		it('can build nested framework usage', async () => {
			const html = await fixture.readFile('/nested/index.html');
			const $ = cheerioLoad(html);
			const counter = $('.nested-counter .counter');
			assert.equal(counter.length, 1, 'Found the counter');
		});
	});

	describe('Code component', () => {
		it('Is able to build successfully', async () => {
			const html = await fixture.readFile('/code-component/index.html');
			const $ = cheerioLoad(html);
			assert.equal($('pre').length, 1, 'pre tag loaded');
		});
	});

	describe('URL import suffixes', () => {
		it('includes the built assets in the output', async () => {
			const assets = await fixture.readdir('/_astro');
			const cssAssets = assets.filter((asset) => asset.endsWith('.css'));
			assert.ok(cssAssets.length >= 2);
		});

		it('links the assets in the html', async () => {
			const html = await fixture.readFile('/url-import/index.html');
			const $ = cheerioLoad(html);
			const linkHrefs = $('link[rel="stylesheet"]')
				.toArray()
				.map((el) => $(el).attr('href'))
				.filter(Boolean);
			assert.ok(linkHrefs.length >= 2);
			for (const href of linkHrefs) {
				assert.ok(href.startsWith('/_astro/'));
			}
		});
	});
});

describe("Mega static build - format: 'file'", () => {
	/** @type {import('./test-utils').Fixture} */
	let fixture;

	before(async () => {
		fixture = await loadFixture({
			root,
			outDir: './dist/mega-static/page-format',
			base: '/',
			build: {
				format: 'file',
			},
		});
		await fixture.build();
	});

	it('Builds pages in root', async () => {
		const html = await fixture.readFile('/one.html');
		assert.equal(typeof html, 'string');
	});

	it('Builds pages in subfolders', async () => {
		const html = await fixture.readFile('/sub/page.html');
		assert.equal(typeof html, 'string');
	});
});

describe('Mega static build - output dir URL', () => {
	/** @type {URL} */
	let checkDir;
	/** @type {URL} */
	let checkGeneratedDir;
	const outDir = './dist/mega-static/dir';

	before(async () => {
		const fixture = await loadFixture({
			root,
			outDir,
			integrations: [
				{
					name: '@astrojs/dir',
					hooks: {
						'astro:build:generated': ({ dir }) => {
							checkGeneratedDir = dir;
						},
						'astro:build:done': ({ dir }) => {
							checkDir = dir;
						},
					},
				},
			],
		});
		await fixture.build();
	});

	it('dir takes the URL path to the output directory', async () => {
		const removeTrailingSlash = (str) => str.replace(/\/$/, '');
		assert.equal(
			removeTrailingSlash(checkDir.toString()),
			removeTrailingSlash(new URL(`./fixtures/mega-static/${outDir}`, import.meta.url).toString()),
		);
		assert.equal(checkDir.toString(), checkGeneratedDir.toString());
	});
});

describe('Mega static build: pages routes have distURL', () => {
	/** @type {Map<string, URL[]>} */
	let assets;

	before(async () => {
		const fixture = await loadFixture({
			root,
			outDir: './dist/mega-static/dist-url',
			integrations: [
				{
					name: '@astrojs/distURL',
					hooks: {
						'astro:build:done': (params) => {
							assets = params.assets;
						},
					},
				},
			],
		});
		await fixture.build();
	});

	it('Pages routes have distURL', async () => {
		assert.equal(assets.size > 0, true, 'Pages not found: build end hook not being called');
		for (const [p, distURL] of assets.entries()) {
			for (const url of distURL) {
				assert.equal(url instanceof URL, true, `${p.pathname} doesn't include distURL`);
			}
		}
	});
});

describe('Mega static build: vite plugins included when required', () => {
	/** @type {Map<string, boolean>} */
	const pluginsCalled = new Map();
	/** @type {Map<string, boolean>} */
	const expectedPluginResult = new Map([
		['prepare-no-apply-plugin', true],
		['prepare-serve-plugin', false],
		['prepare-apply-fn-plugin', true],
		['prepare-dont-apply-fn-plugin', false],
		['prepare-build-plugin', true],
	]);

	before(async () => {
		const fixture = await loadFixture({
			root,
			outDir: './dist/mega-static/vite-plugins',
			integrations: [
				{
					name: '@astrojs/prepare-vite-plugins',
					hooks: {
						'astro:config:setup': ({ updateConfig }) => {
							pluginsCalled.set('prepare-no-apply-plugin', false);
							pluginsCalled.set('prepare-serve-plugin', false);
							pluginsCalled.set('prepare-apply-fn-plugin', false);
							pluginsCalled.set('prepare-dont-apply-fn-plugin', false);
							pluginsCalled.set('prepare-build-plugin', false);
							updateConfig({
								vite: {
									plugins: [
										{
											name: 'prepare-no-apply-plugin',
											configResolved: () => {
												pluginsCalled.set('prepare-no-apply-plugin', true);
											},
										},
										{
											name: 'prepare-serve-plugin',
											apply: 'serve',
											configResolved: () => {
												pluginsCalled.set('prepare-serve-plugin', true);
											},
										},
										{
											name: 'prepare-apply-fn-plugin',
											apply: (_, { command }) => command === 'build',
											configResolved: () => {
												pluginsCalled.set('prepare-apply-fn-plugin', true);
											},
										},
										{
											name: 'prepare-dont-apply-fn-plugin',
											apply: (_, { command }) => command === 'serve',
											configResolved: () => {
												pluginsCalled.set('prepare-dont-apply-fn-plugin', true);
											},
										},
										{
											name: 'prepare-build-plugin',
											apply: 'build',
											configResolved: () => {
												pluginsCalled.set('prepare-build-plugin', true);
											},
										},
									],
								},
							});
						},
					},
				},
			],
		});
		await fixture.build();
	});

	it('Vite Plugins are included/excluded properly', async () => {
		assert.equal(pluginsCalled.size, expectedPluginResult.size, 'Not all plugins were initialized');
		Array.from(expectedPluginResult.entries()).forEach(([plugin, called]) =>
			assert.equal(
				pluginsCalled.get(plugin),
				called,
				`${plugin} was ${called ? 'not' : ''} called`,
			),
		);
	});
});

describe('Mega static build SSR public assets', () => {
	/** @type {import('./test-utils').Fixture} */
	let fixture;

	before(async () => {
		fixture = await loadFixture({
			root,
			output: 'server',
			adapter: node({ mode: 'middleware' }),
			outDir: './dist/mega-static/ssr-public',
		});
		await fixture.build();
	});

	it('Copies public files', async () => {
		assert.ok(await fixture.readFile('/client/nested/asset2.txt'));
		assert.ok(await fixture.readFile('/client/.well-known/apple-app-site-association'));
	});
});

describe('Mega static build with configured redirects', () => {
	const middlewarePath = path.join(
		'/Users/matthewphillips/src/astro/test-refactor/packages/astro/test/fixtures/mega-static',
		'src',
		'middleware.ts',
	);

	before(async () => {
		await fs.writeFile(
			middlewarePath,
			"import { defineMiddleware } from 'astro:middleware';\n\nexport const onRequest = defineMiddleware(({ isPrerendered }, next) => {\n\tif (!isPrerendered) {\n\t\tthrow new Error('This middleware should only run in prerendered mode.');\n\t}\n\treturn next();\n});\n",
		);
	});

	after(async () => {
		await fs.rm(middlewarePath, { force: true });
	});

	it('Sets isPrerendered true in middleware', async () => {
		const fixture = await loadFixture({
			root,
			outDir: './dist/mega-static/redirects',
			redirects: {
				'/configured-redirect': '/',
			},
		});

		await assert.doesNotReject(
			fixture.build(),
			'isPrerendered unexpectedly true during static build',
		);
	});
});
