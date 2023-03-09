import mdx from '@astrojs/mdx';
import { expect } from 'chai';
import { parseHTML } from 'linkedom';
import { loadFixture } from '../../../astro/test/test-utils.js';

const FIXTURE_ROOT = new URL('./fixtures/mdx-script-style-raw/', import.meta.url);

describe('MDX script style raw', () => {
	describe('dev', () => {
		let fixture;
		let devServer;

		before(async () => {
			fixture = await loadFixture({
				root: FIXTURE_ROOT,
				integrations: [mdx()],
			});
			devServer = await fixture.startDevServer();
		});

		after(async () => {
			await devServer.stop();
		});

		it('works with with raw script and style strings', async () => {
			const res = await fixture.fetch('/index.html');
			expect(res.status).to.equal(200);

			const html = await res.text();
			const { document } = parseHTML(html);

			const scriptContent = document.getElementById('test-script').innerHTML;
			expect(scriptContent).to.include(
				"console.log('raw script')",
				'script should not be html-escaped'
			);

			const styleContent = document.getElementById('test-style').innerHTML;
			expect(styleContent).to.include(
				'h1[id="script-style-raw"]',
				'style should not be html-escaped'
			);
		});
	});

	describe('build', () => {
		it('works with with raw script and style strings', async () => {
			const fixture = await loadFixture({
				root: FIXTURE_ROOT,
				integrations: [mdx()],
			});
			await fixture.build();

			const html = await fixture.readFile('/index.html');
			const { document } = parseHTML(html);

			const scriptContent = document.getElementById('test-script').innerHTML;
			expect(scriptContent).to.include(
				"console.log('raw script')",
				'script should not be html-escaped'
			);

			const styleContent = document.getElementById('test-style').innerHTML;
			expect(styleContent).to.include(
				'h1[id="script-style-raw"]',
				'style should not be html-escaped'
			);
		});
	});
});
