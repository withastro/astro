import { isWindows, loadFixture } from './test-utils.js';
import { expect } from 'chai';
import * as cheerio from 'cheerio';

describe('Error display', () => {
	if (isWindows) return;

	let fixture;
	let devServer;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/errors',
		});
	});

	describe('Astro', async () => {
		// This test is skipped because it will hang on vite@2.8.x
		// TODO: unskip test once vite@2.9.x lands
		// See pre-integration system test: https://github.com/withastro/astro/blob/0f376a7c52d3a22ff32b33e0afc34dd306ed70c4/packages/astro/test/errors.test.js
		it.skip('properly detect syntax errors in template', async () => {
			try {
				devServer = await fixture.startDevServer();
			} catch (err) {
				return;
			}

			// This is new behavior in vite@2.9.x, previously the server would throw on startup
			const res = await fixture.fetch('/astro-syntax-error');
			await devServer.stop();
			expect(res.status).to.equal(500, `Successfully responded with 500 Error for invalid file`);
		});
	});

	describe('Framework components', () => {
		let devServer;

		before(async () => {
			devServer = await fixture.startDevServer();
		});

		after(async () => {
			await devServer.stop();
		});

		it('Errors recover when fixed', async () => {
			let html = await fixture.fetch('/svelte-syntax-error').then((res) => res.text());

			// 1. Verify an error message is being shown.
			let $ = cheerio.load(html);
			expect($('.statusMessage').text()).to.equal('Internal Error');

			// 2. Edit the file, fixing the error
			let changeOccured = fixture.onNextChange();
			await fixture.editFile('./src/components/SvelteSyntaxError.svelte', `<h1>No mismatch</h1>`);
			await changeOccured;

			// 3. Verify that the file is fixed.
			html = await fixture.fetch('/svelte-syntax-error').then((res) => res.text());
			$ = cheerio.load(html);
			expect($('h1').text()).to.equal('No mismatch');
		});
	});
});
