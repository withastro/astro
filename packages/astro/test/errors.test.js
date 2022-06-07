import { isWindows, loadFixture } from './test-utils.js';
import { expect } from 'chai';
import * as cheerio from 'cheerio';

describe('Error display', () => {
	if (isWindows) return;

	/** @type {import('./test-utils').Fixture} */
	let fixture;
	let devServer;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/errors',
		});
	});

	describe('Astro', async () => {
		it('properly detect syntax errors in template', async () => {
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

	describe('Astro import not found', async () => {
		it('shows useful error when frontmatter import is not found', async () => {
			try {
				devServer = await fixture.startDevServer();
			} catch (err) {
				return;
			}

			// This is new behavior in vite@2.9.x, previously the server would throw on startup
			const res = await fixture.fetch('/import-not-found');
			await devServer.stop();
			expect(res.status).to.equal(500, `Successfully responded with 500 Error for invalid file`);

			const resText = await res.text();
			expect(resText).to.contain('failed to load module for ssr: ../abc.astro');
		});
	});

	describe('Framework components', function () {
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
			await fixture.editFile('./src/components/SvelteSyntaxError.svelte', `<h1>No mismatch</h1>`);

			// 3. Verify that the file is fixed.
			html = await fixture.fetch('/svelte-syntax-error').then((res) => res.text());
			$ = cheerio.load(html);
			expect($('h1').text()).to.equal('No mismatch');
		});
	});
});
