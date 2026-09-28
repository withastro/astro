import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import * as cheerio from 'cheerio';
import { type DevServer, type Fixture, loadFixture } from './test-utils.ts';

// CSS Modules hash class names from file content, so any edit renames every
// class in the file. Client-side HMR updates the hydrated instance, but
// non-hydrated markup keeps the old, now-undefined name.
describe('CSS Module HMR with a non-hydrated and a hydrated instance', () => {
	let fixture: Fixture;
	let devServer: DevServer;
	let cardClassName: string;
	let styleHref: string;

	before(async () => {
		fixture = await loadFixture({ root: './fixtures/css-module-hydration-mismatch/' });
		devServer = await fixture.startDevServer();

		const html = await fixture.fetch('/').then((res) => res.text());
		const $ = cheerio.load(html);

		const nonHydratedClass = $('#non-hydrated [class]').first().attr('class');
		const hydratedClass = $('#hydrated [class]').first().attr('class');
		assert.ok(nonHydratedClass, 'expected the non-hydrated card to have a class attribute');
		assert.equal(
			nonHydratedClass,
			hydratedClass,
			'both instances import the same CSS Module and should share a class name',
		);
		cardClassName = nonHydratedClass;

		styleHref = $(`style[data-vite-dev-id$="Card.module.css"]`).attr('data-vite-dev-id')!;
		assert.ok(styleHref, 'expected an injected <style> tag for Card.module.css');
	});

	after(async () => {
		await devServer.stop();
	});

	it('keeps the class name already rendered in the DOM valid after an unrelated CSS edit', async () => {
		await fixture.editFile('/src/components/Card.module.css', (content) =>
			content.replace('background: red;', 'background: blue;'),
		);

		// This is what the browser's client-side CSS HMR fetches to refresh the
		// injected <style> tag in place, without re-rendering the already-sent, non-hydrated markup.
		const updatedCss = await fixture.fetch(styleHref).then((res) => res.text());

		assert.match(updatedCss, /background:\s*blue/, 'expected the CSS edit to take effect');
		assert.ok(
			updatedCss.includes(`.${cardClassName}`),
			`expected the class name already in the DOM ("${cardClassName}") to still be defined in the updated stylesheet, but got:\n${updatedCss}`,
		);
	});
});
