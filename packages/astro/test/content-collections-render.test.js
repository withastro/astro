import { expect } from 'chai';
import * as cheerio from 'cheerio';
import { loadFixture, isWindows } from './test-utils.js';
import testAdapter from './test-adapter.js';

const describe = isWindows ? global.describe.skip : global.describe;

describe('Content Collections - render()', () => {
	describe('Build - SSG', () => {
		/** @type {import('./test-utils').Fixture} */
		let fixture;

		before(async () => {
			fixture = await loadFixture({
				root: './fixtures/content/',
			});
			await fixture.build();
		});

		it('Includes CSS for rendered entry', async () => {
			const html = await fixture.readFile('/launch-week/index.html');
			const $ = cheerio.load(html);

			// Renders content
			expect($('ul li')).to.have.a.lengthOf(3);

			// Includes styles
			expect($('link[rel=stylesheet]')).to.have.a.lengthOf(1);
		});

		it('Excludes CSS for non-rendered entries', async () => {
			const html = await fixture.readFile('/index.html');
			const $ = cheerio.load(html);

			// Excludes styles
			expect($('link[rel=stylesheet]')).to.have.a.lengthOf(0);
		});

		it('Includes component scripts for rendered entry', async () => {
			const html = await fixture.readFile('/launch-week-component-scripts/index.html');
			const $ = cheerio.load(html);

			const allScripts = $('head > script[type="module"]');
			expect(allScripts).to.have.length;

			// Includes hoisted script
			expect(
				[...allScripts].find((script) =>
					$(script).text().includes('document.querySelector("#update-me")')
				),
				'`WithScripts.astro` hoisted script missing from head.'
			).to.not.be.undefined;

			// Includes inline script
			expect($('script[data-is-inline]')).to.have.a.lengthOf(1);
		});

		// TODO: Script bleed isn't solved for prod builds.
		// Tackling in separate PR.
		it.skip('Excludes component scripts for non-rendered entries', async () => {
			const html = await fixture.readFile('/index.html');
			const $ = cheerio.load(html);

			const allScripts = $('head > script[type="module"]');

			// Excludes hoisted script
			expect(
				[...allScripts].find((script) =>
					$(script).text().includes('document.querySelector("#update-me")')
				),
				'`WithScripts.astro` hoisted script included unexpectedly.'
			).to.be.undefined;
		});
	});

	describe('Build - SSR', () => {
		/** @type {import('./test-utils').Fixture} */
		let fixture;

		before(async () => {
			fixture = await loadFixture({
				output: 'server',
				root: './fixtures/content/',
				adapter: testAdapter(),
			});
			await fixture.build();
		});

		it('Includes CSS for rendered entry', async () => {
			const app = await fixture.loadTestAdapterApp();
			const request = new Request('http://example.com/launch-week');
			const response = await app.render(request);
			const html = await response.text();
			const $ = cheerio.load(html);

			// Renders content
			expect($('ul li')).to.have.a.lengthOf(3);

			// Includes styles
			expect($('link[rel=stylesheet]')).to.have.a.lengthOf(1);
		});

		it('Exclude CSS for non-rendered entries', async () => {
			const app = await fixture.loadTestAdapterApp();
			const request = new Request('http://example.com/');
			const response = await app.render(request);
			const html = await response.text();
			const $ = cheerio.load(html);

			// Includes styles
			expect($('link[rel=stylesheet]')).to.have.a.lengthOf(0);
		});
	});

	describe('Dev - SSG', () => {
		let devServer;
		/** @type {import('./test-utils').Fixture} */
		let fixture;

		before(async () => {
			fixture = await loadFixture({
				root: './fixtures/content/',
			});
			devServer = await fixture.startDevServer();
		});

		after(async () => {
			await devServer.stop();
		});

		it('Includes CSS for rendered entry', async () => {
			const response = await fixture.fetch('/launch-week', { method: 'GET' });
			expect(response.status).to.equal(200);

			const html = await response.text();
			const $ = cheerio.load(html);

			// Renders content
			expect($('ul li')).to.have.a.lengthOf(3);

			// Includes styles
			expect($('head > style')).to.have.a.lengthOf(1);
			expect($('head > style').text()).to.include("font-family: 'Comic Sans MS'");
		});

		it('Includes component scripts for rendered entry', async () => {
			const response = await fixture.fetch('/launch-week-component-scripts', { method: 'GET' });
			expect(response.status).to.equal(200);

			const html = await response.text();
			const $ = cheerio.load(html);

			const allScripts = $('head > script[src]');
			expect(allScripts).to.have.length;

			// Includes hoisted script
			expect(
				[...allScripts].find((script) => script.attribs.src.includes('WithScripts.astro')),
				'`WithScripts.astro` hoisted script missing from head.'
			).to.not.be.undefined;

			// Includes inline script
			expect($('script[data-is-inline]')).to.have.a.lengthOf(1);
		});
	});
});
