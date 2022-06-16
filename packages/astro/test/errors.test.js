import { isWindows, isLinux, loadFixture } from './test-utils.js';
import { expect } from 'chai';
import * as cheerio from 'cheerio';

describe('Error display', () => {
	if (isWindows) return;

	// TODO: Ubuntu CI runs hit a reliability problem with more than one test in this suite.
	// Re-enable this suite once that issue is tracked down.
	if (isLinux) return;

	/** @type {import('./test-utils').Fixture} */
	let fixture;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/errors',
		});
	});

	describe('Astro', async () => {
		let devServer;

		beforeEach(async () => {
			devServer = await fixture.startDevServer();
		});

		afterEach(async () => {
			await devServer.stop();
		});

		it('properly detect syntax errors in template', async () => {
			let html = await fixture.fetch('/astro-syntax-error').then((res) => res.text());

			// 1. Verify an error message is being shown.
			let $ = cheerio.load(html);
			expect($('.statusMessage').text()).to.equal('Internal Error');
			expect($('.error-message').text()).to.contain('Unexpected "}"');

			// 2. Edit the file, fixing the error
			await fixture.editFile('./src/pages/astro-syntax-error.astro', `<h1>No syntax error</h1>`);

			// 3. Verify that the file is fixed.
			html = await fixture.fetch('/astro-syntax-error').then((res) => res.text());
			$ = cheerio.load(html);
			expect($('h1').text()).to.equal('No syntax error');
		});

		it('shows useful error when frontmatter import is not found', async () => {
			let html = await fixture.fetch('/import-not-found').then((res) => res.text());

			// 1. Verify an error message is being shown.
			let $ = cheerio.load(html);
			expect($('.statusMessage').text()).to.equal('Internal Error');
			expect($('.error-message').text()).to.equal('failed to load module for ssr: ../abc.astro');

			// 2. Edit the file, fixing the error
			await fixture.editFile('./src/pages/import-not-found.astro', '<h1>No import error</h1>');

			// 3. Verify that the file is fixed.
			html = await fixture.fetch('/import-not-found').then((res) => res.text());
			$ = cheerio.load(html);
			expect($('h1').text()).to.equal('No import error');
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
