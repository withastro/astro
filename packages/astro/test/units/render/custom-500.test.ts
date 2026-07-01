import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import * as cheerio from 'cheerio';
import {
	createComponent,
	maybeRenderHead,
	render,
	renderHead,
} from '../../../dist/runtime/server/index.js';
import { createPage, createTestApp } from '../mocks.ts';

// #region Components

/**
 * Index page that throws an error in its frontmatter.
 * Mirrors: `src/pages/index.astro` with `throw "some error"`.
 */
const ThrowingIndex = createComponent(() => {
	throw 'some error';
});

/**
 * Custom 500 page that renders the error from Astro.props.
 * Mirrors: `src/pages/500.astro` from the custom-500 fixture.
 */
const Custom500 = createComponent((result: any, props: any, slots: any) => {
	const Astro = result.createAstro(props, slots);
	const { error } = Astro.props;
	return render`<html lang="en">
<head>
  <title>Server error - Custom 500</title>
  <style>body{background-color:#fcc;color:#c00}h1{font-family:monospace}</style>
${renderHead()}
</head>
${maybeRenderHead()}
<body>
  <h1>Server error</h1>
  <p>${error}</p>
</body>
</html>`;
});

/**
 * Custom 500 page that itself throws.
 * Mirrors: `src/pages/500.astro` from the custom-500-failing fixture.
 */
const Failing500 = createComponent((_result: any) => {
	throw 'custom 500 fail';
});

// #endregion

// #region Tests

describe('Custom 500', () => {
	describe('SSR', () => {
		it('renders custom 500', async () => {
			const app = createTestApp([
				createPage(ThrowingIndex, { route: '/' }),
				createPage(Custom500, { route: '/500' }),
			]);

			const request = new Request('http://example.com/');
			const response = await app.render(request);
			assert.equal(response.status, 500);

			const html = await response.text();
			const $ = cheerio.load(html);

			assert.equal($('h1').text(), 'Server error');
			assert.equal($('p').text(), 'some error');
		});

		it('renders nothing if custom 500 throws', async () => {
			const app = createTestApp([
				createPage(ThrowingIndex, { route: '/' }),
				createPage(Failing500, { route: '/500' }),
			]);

			const request = new Request('http://example.com/');
			const response = await app.render(request);
			assert.equal(response.status, 500);

			const html = await response.text();
			assert.equal(html, '');
		});

		it('renders custom 500 with styles', async () => {
			const app = createTestApp([
				createPage(ThrowingIndex, { route: '/' }),
				createPage(Custom500, { route: '/500' }),
			]);

			const request = new Request('http://example.com/');
			const response = await app.render(request);
			assert.equal(response.status, 500);

			const html = await response.text();
			const $ = cheerio.load(html);

			const styles = $('style').text();
			assert.match(styles, /background-color.*#fcc/);
			assert.match(styles, /color.*#c00/);
			assert.match(styles, /font-family.*monospace/);
		});
	});
});

// #endregion
