import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import { load as cheerioLoad } from 'cheerio';
import { isWindows, loadFixture } from '../../../astro/test/test-utils.js';

let fixture;

describe('React App Entrypoint', () => {
	before(async () => {
		fixture = await loadFixture({
			root: new URL('./fixtures/react-app-entrypoint/', import.meta.url),
		});
	});

	describe('build', () => {
		before(async () => {
			await fixture.build();
		});

		it('Wraps React islands with the wrapper component', async () => {
			const html = await fixture.readFile('/index.html');
			const $ = cheerioLoad(html);

			// The wrapper component should wrap the counter
			const wrapper = $('[data-testid="wrapper"]');
			assert.equal(wrapper.length, 1);

			// The counter should be inside the wrapper
			const counter = wrapper.find('[data-testid="counter"]');
			assert.equal(counter.length, 1);

			// The counter should have access to the theme from context
			assert.equal(counter.attr('data-theme'), 'dark');
		});
	});

	if (isWindows) return;

	describe('dev', () => {
		let devServer;

		before(async () => {
			devServer = await fixture.startDevServer();
		});

		after(async () => {
			await devServer.stop();
		});

		it('Wraps React islands with the wrapper component in dev mode', async () => {
			const html = await fixture.fetch('/').then((res) => res.text());
			const $ = cheerioLoad(html);

			// The wrapper component should wrap the counter
			const wrapper = $('[data-testid="wrapper"]');
			assert.equal(wrapper.length, 1);

			// The counter should be inside the wrapper
			const counter = wrapper.find('[data-testid="counter"]');
			assert.equal(counter.length, 1);

			// The counter should have access to the theme from context
			assert.equal(counter.attr('data-theme'), 'dark');
		});
	});
});
