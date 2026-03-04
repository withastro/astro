// @ts-check
import assert from 'node:assert/strict';
import { after, afterEach, before, describe, it } from 'node:test';
import * as cheerio from 'cheerio';
import { loadFixture } from './test-utils.js';

const root = new URL('./fixtures/astro-get-static-paths/', import.meta.url);

const paramsTypePlugin = (type = 'string') => ({
	name: 'vite-plugin-param-type',
	resolveId: {
		filter: {
			id: /^virtual:my:param:type$/,
		},
		handler() {
			return '\0virtual:my:param:type';
		},
	},
	load: {
		filter: {
			id: /^\0virtual:my:param:type$/,
		},
		handler() {
			return `export const paramType = ${JSON.stringify(type)}`;
		},
	},
});

function resetFlags() {
	// reset the flag used by [...calledTwiceTest].astro between each test
	globalThis.isCalledOnce = false;

	// reset the flag used by [...invalidParamsTypeTest].astro between each test
	globalThis.getStaticPathsParamsType = undefined;
}

describe('getStaticPaths - build calls', () => {
	/** @type {import('./test-utils').Fixture} */
	let fixture;

	before(async () => {
		fixture = await loadFixture({
			root,
			site: 'https://mysite.dev/',
			trailingSlash: 'never',
			base: '/blog',
			vite: {
				plugins: [paramsTypePlugin()],
			},
		});
		await fixture.build({});
	});

	afterEach(() => {
		resetFlags();
	});

	it('is only called once during build', () => {
		// useless expect; if build() throws in setup then this test fails
		assert.equal(true, true);
	});

	it('Astro.url sets the current pathname', async () => {
		const html = await fixture.readFile('/food/tacos/index.html');
		const $ = cheerio.load(html);

		assert.equal($('#url').text(), '/blog/food/tacos');
	});
});

describe('getStaticPaths - dev calls', () => {
	/** @type {import('./test-utils').Fixture} */
	let fixture;
	/** @type {import('./test-utils').DevServer} */
	let devServer;

	before(async () => {
		fixture = await loadFixture({
			root,
			site: 'https://mysite.dev/',
			vite: {
				plugins: [paramsTypePlugin()],
			},
		});
		devServer = await fixture.startDevServer();
	});

	afterEach(() => {
		resetFlags();
	});

	after(async () => {
		await devServer.stop();
	});

	it('only calls getStaticPaths once', async function () {
		let res = await fixture.fetch('/a');
		assert.equal(res.status, 200);

		res = await fixture.fetch('/b');
		assert.equal(res.status, 200);

		res = await fixture.fetch('/c');
		assert.equal(res.status, 200);
	});

	describe('404 behavior', () => {
		it('resolves 200 on matching static path - named params', async () => {
			const res = await fixture.fetch('/pizza/provolone-sausage');
			assert.equal(res.status, 200);
		});

		it('resolves 404 on pattern match without static path - named params', async () => {
			const res = await fixture.fetch('/pizza/provolone-pineapple');
			assert.equal(res.status, 404);
		});

		it('resolves 200 on matching static path - rest params', async () => {
			const res = await fixture.fetch('/pizza/grimaldis/new-york');
			assert.equal(res.status, 200);
		});

		it('resolves 404 on pattern match without static path - rest params', async () => {
			const res = await fixture.fetch('/pizza/pizza-hut');
			assert.equal(res.status, 404);
		});
	});

	describe('route params type validation', () => {
		it('resolves 200 on matching static path - string params', async () => {
			// route provided with { params: { year: "2022", slug: "post-2" }}
			const res = await fixture.fetch('/blog/2022/post-1');
			assert.equal(res.status, 200);
		});

		it('resolves 200 on matching static path - numeric params', async () => {
			// route provided with { params: { year: "2022", slug: "post-2" }}
			const res = await fixture.fetch('/blog/2022/post-2');
			assert.equal(res.status, 200);
		});
	});

	it('provides routePattern', async () => {
		const res = await fixture.fetch('/blog/2022/post-1');
		assert.equal(res.status, 200);

		const html = await res.text();
		const $ = cheerio.load(html);

		assert.equal($('#route-pattern').text(), '/blog/[year]/[slug]');
	});

	it('resolves 200 on matching static paths', async () => {
		// routes params provided for pages /posts/1, /posts/2, and /posts/3
		for (const page of [1, 2, 3]) {
			let res = await fixture.fetch(`/posts/${page}`);
			assert.equal(res.status, 200);

			const html = await res.text();
			const $ = cheerio.load(html);

			const canonical = $('link[rel=canonical]');
			assert.equal(
				canonical.attr('href'),
				`https://mysite.dev/posts/${page}`,
				`doesn't trim the /${page} route param`,
			);
		}
	});

	it('properly handles hyphenation in getStaticPaths', async () => {
		const res = await fixture.fetch('/pizza/parmesan-and-olives');
		assert.equal(res.status, 200);
	});

	it('warns if Astro.generator or Astro.site is accessed', async () => {
		const originalWarn = console.warn;
		/** @type {Array<string>} */
		const logs = [];
		console.warn = (...args) => {
			logs.push(...args);
			return originalWarn(...args);
		};
		const res = await fixture.fetch('/food/tacos');
		console.warn = originalWarn;
		assert.equal(res.status, 200);
		assert.deepStrictEqual(logs, [
			'Astro.generator inside getStaticPaths is deprecated and will be removed in a future major version of Astro.',
			'Astro.site inside getStaticPaths is deprecated and will be removed in a future major version of Astro. Use import.meta.env.SITE instead',
		]);

		const html = await res.text();
		const $ = cheerio.load(html);

		assert.equal($('#generator').text().startsWith('Astro v'), true);
		// For some reason site is always undefined
		assert.equal($('#site').text(), 'https://mysite.dev/');
	});
});

describe('throws if an invalid Astro property is accessed', () => {
	/** @type {import('./test-utils').Fixture} */
	let fixture;

	before(async () => {
		fixture = await loadFixture({
			root,
			site: 'https://mysite.dev/',
			vite: {
				plugins: [paramsTypePlugin()],
			},
		});
		await fixture.editFile(
			'/src/pages/food/[name].astro',
			(prev) => prev.replace('getStaticPaths() {', 'getStaticPaths() {\nAstro.getActionResult;'),
			false,
		);
	});

	after(async () => {
		fixture.resetAllFiles();
	});

	it('does not build', async () => {
		try {
			await fixture.build({});
			assert.fail();
		} catch (err) {
			assert.equal(err instanceof Error, true);
			// @ts-ignore
			assert.equal(err.title, 'Unavailable Astro global in getStaticPaths()');
		}
	});
});

describe('throws if an invalid params type is returned', () => {
	/**
	 * @param type {string}
	 */
	const build = async (type) => {
		try {
			globalThis.getStaticPathsParamsType = type;
			const fixture = await loadFixture({
				root,
				site: 'https://mysite.dev/',
				vite: {
					plugins: [paramsTypePlugin(type)],
				},
			});
			await fixture.build({});
		} catch (err) {
			return err;
		} finally {
			resetFlags();
		}
	};

	// Valid types
	it('does build for param type string', async () => {
		const err = await build('string');
		assert.equal(err, undefined);
	});

	it('does build for param type undefined', async () => {
		const err = await build('undefined');
		assert.equal(err, undefined);
	});

	// Invalid types
	it('does not build for param type number', async () => {
		const err = await build('number');
		assert.equal(err instanceof Error, true);
		// @ts-ignore
		assert.equal(err.title, 'Invalid route parameter returned by `getStaticPaths()`.');
	});

	it('does not build for param type boolean', async () => {
		const err = await build('boolean');
		assert.equal(err instanceof Error, true);
		// @ts-ignore
		assert.equal(err.title, 'Invalid route parameter returned by `getStaticPaths()`.');
	});

	it('does not build for param type array', async () => {
		const err = await build('array');
		assert.equal(err instanceof Error, true);
		// @ts-ignore
		assert.equal(err.title, 'Invalid route parameter returned by `getStaticPaths()`.');
	});

	it('does not build for param type null', async () => {
		const err = await build('null');
		assert.equal(err instanceof Error, true);
		// @ts-ignore
		assert.equal(err.title, 'Invalid route parameter returned by `getStaticPaths()`.');
	});

	it('does not build for param type object', async () => {
		const err = await build('object');
		assert.equal(err instanceof Error, true);
		// @ts-ignore
		assert.equal(err.title, 'Invalid route parameter returned by `getStaticPaths()`.');
	});

	it('does not build for param type bigint', async () => {
		const err = await build('bigint');
		assert.equal(err instanceof Error, true);
		// @ts-ignore
		assert.equal(err.title, 'Invalid route parameter returned by `getStaticPaths()`.');
	});

	it('does not build for param type function', async () => {
		const err = await build('function');
		assert.equal(err instanceof Error, true);
		// @ts-ignore
		assert.equal(err.title, 'Invalid route parameter returned by `getStaticPaths()`.');
	});
});
