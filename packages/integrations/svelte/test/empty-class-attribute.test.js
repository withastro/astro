import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import { load as cheerioLoad } from 'cheerio';
import { loadFixture } from '../../../astro/test/test-utils.js';

/**
 * @see https://github.com/withastro/astro/issues/15576
 *
 * Svelte components that extract the class property with a null default should not
 * render an empty class attribute when no class is provided. This matches native
 * Svelte behavior.
 */

describe('Empty class attribute', () => {
	describe('build', () => {
		let fixture;

		before(async () => {
			fixture = await loadFixture({
				root: new URL('./fixtures/empty-class/', import.meta.url),
			});
			await fixture.build();
		});

		it('should not render empty class attribute when class prop is not provided', async () => {
			const html = await fixture.readFile('/index.html');
			const $ = cheerioLoad(html);

			// Component without class prop should not have class attribute
			const withoutClass = $('#without-class');
			assert.ok(withoutClass.length > 0, 'Element with id="without-class" should exist');
			assert.strictEqual(
				withoutClass.attr('class'),
				undefined,
				'Element should not have a class attribute when none is provided',
			);
		});

		it('should render class attribute when class prop is provided', async () => {
			const html = await fixture.readFile('/index.html');
			const $ = cheerioLoad(html);

			// Component with class prop should have class attribute
			const withClass = $('#with-class');
			assert.ok(withClass.length > 0, 'Element with id="with-class" should exist');
			assert.strictEqual(
				withClass.attr('class'),
				'my-class',
				'Element should have class="my-class" when provided',
			);
		});
	});

	describe('dev', () => {
		let fixture;
		let devServer;

		before(async () => {
			fixture = await loadFixture({
				root: new URL('./fixtures/empty-class/', import.meta.url),
			});
			devServer = await fixture.startDevServer();
		});

		after(async () => {
			await devServer.stop();
		});

		it('should not render empty class attribute in dev mode', async () => {
			const html = await fixture.fetch('/').then((res) => res.text());
			const $ = cheerioLoad(html);

			const withoutClass = $('#without-class');
			assert.ok(withoutClass.length > 0, 'Element with id="without-class" should exist in dev');
			assert.strictEqual(
				withoutClass.attr('class'),
				undefined,
				'Element should not have a class attribute in dev mode',
			);
		});
	});
});
