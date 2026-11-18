import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import * as cheerio from 'cheerio';
import { type DevServer, type Fixture, loadFixture } from './test-utils.ts';

// Regression test for https://github.com/withastro/astro/issues/17312.
//
// With `vite.css.transformer: 'lightningcss'`, a React component that imports
// a CSS module and is rendered through the content-collection render path
// (`getCollection` + `render()` → `<Content />`) gets mismatched scoped class
// name hashes in dev: the element class and the injected `<style>` selector
// use different Lightning CSS hashes, so no rule matches and the component
// renders unstyled.
describe('lightningcss + CSS modules via content collection render path', () => {
	let fixture: Fixture;
	let devServer: DevServer;
	let $: cheerio.CheerioAPI;

	function getClassAndStyles(doc: cheerio.CheerioAPI) {
		const el = doc('div[class]').first();
		const className = el.attr('class')!;
		const styles = doc('style')
			.map((_, s) => doc(s).html())
			.get()
			.join('\n');

		return { className, styles };
	}

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/lightningcss-css-modules-content/',
		});
		devServer = await fixture.startDevServer();
		const html = await fixture.fetch('/test').then((res) => res.text());
		$ = cheerio.load(html);
	});

	after(async () => {
		await devServer.stop();
	});

	it('CSS module class name in element matches the selector in the injected style', () => {
		const { className, styles } = getClassAndStyles($);
		assert.ok(className, 'expected element to have a class attribute');

		assert.ok(
			styles.includes(`.${className}`),
			`expected injected <style> to contain selector ".${className}" but got:\n${styles}`,
		);
	});

	it('updates injected CSS when the CSS module changes', async () => {
		await fixture.editFile('/src/components/styles.module.css', (content) =>
			content.replace('display: grid;', 'display: block;'),
		);

		const html = await fixture.fetch('/test').then((res) => res.text());
		const { className, styles } = getClassAndStyles(cheerio.load(html));

		assert.ok(
			styles.includes(`.${className}`),
			`expected injected <style> to contain selector ".${className}" but got:\n${styles}`,
		);
		assert.match(styles, /display:\s*block/);
	});
});
