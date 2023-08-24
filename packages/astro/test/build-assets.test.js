import { expect } from 'chai';
import * as cheerio from 'cheerio';
import { loadFixture } from './test-utils.js';
import { preact } from './fixtures/before-hydration/deps.mjs';
import testAdapter from './test-adapter.js';

describe('build assets (static)', () => {
	describe('with default configuration', () => {
		/** @type {import('./test-utils').Fixture} */
		let fixture;

		before(async () => {
			fixture = await loadFixture({
				root: './fixtures/build-assets/',
				integrations: [preact()],
				// test suite was authored when inlineStylesheets defaulted to never
				build: { inlineStylesheets: 'never' },
			});
			await fixture.build();
		});

		it('Populates /_astro directory', async () => {
			let files = await fixture.readdir('/_astro');
			expect(files.length).to.be.greaterThan(0);
		});

		it('Defaults to flat /_astro output', async () => {
			let files = await fixture.readdir('/_astro');
			for (const file of files) {
				expect(file.slice(1)).to.not.contain('/');
			}
		});

		it('emits CSS assets to /_astro', async () => {
			let html = await fixture.readFile('/index.html');
			let $ = cheerio.load(html);

			expect($('link[href$=".css"]').attr('href')).to.match(/^\/_astro\//);
		});

		it('emits JS assets to /_astro', async () => {
			let html = await fixture.readFile('/index.html');
			let $ = cheerio.load(html);

			const island = $('astro-island');
			expect(island.length).to.eq(1);
			expect(island.attr('component-url')).to.match(/^\/_astro\//);
			expect(island.attr('renderer-url')).to.match(/^\/_astro\//);
		});
	});

	describe('with custom configuration', () => {
		/** @type {import('./test-utils').Fixture} */
		let fixture;

		before(async () => {
			fixture = await loadFixture({
				root: './fixtures/build-assets/',
				integrations: [preact()],
				build: {
					assets: 'custom-assets',
					inlineStylesheets: 'never',
				},
			});
			await fixture.build();
		});

		it('Populates /custom-assets directory', async () => {
			let files = await fixture.readdir('/custom-assets');
			expect(files.length).to.be.greaterThan(0);
		});

		it('emits CSS assets to /custom-assets', async () => {
			let html = await fixture.readFile('/index.html');
			let $ = cheerio.load(html);

			expect($('link[href$=".css"]').attr('href')).to.match(/^\/custom-assets\//);
		});

		it('emits JS assets to /custom-assets', async () => {
			let html = await fixture.readFile('/index.html');
			let $ = cheerio.load(html);

			const island = $('astro-island');
			expect(island.length).to.eq(1);
			expect(island.attr('component-url')).to.match(/^\/custom-assets\//);
			expect(island.attr('renderer-url')).to.match(/^\/custom-assets\//);
		});
	});
});

describe('build assets (server)', () => {
	describe('with default configuration', () => {
		/** @type {import('./test-utils').Fixture} */
		let fixture;

		before(async () => {
			fixture = await loadFixture({
				root: './fixtures/build-assets/',
				integrations: [preact()],
				adapter: testAdapter(),
				// test suite was authored when inlineStylesheets defaulted to never
				build: { inlineStylesheets: 'never' },
			});
			await fixture.build();
		});

		it('Populates /_astro directory', async () => {
			let files = await fixture.readdir('/_astro');
			expect(files.length).to.be.greaterThan(0);
		});

		it('Defaults to flat /_astro output', async () => {
			let files = await fixture.readdir('/_astro');
			for (const file of files) {
				expect(file.slice(1)).to.not.contain('/');
			}
		});

		it('emits CSS assets to /_astro', async () => {
			let html = await fixture.readFile('/index.html');
			let $ = cheerio.load(html);

			expect($('link[href$=".css"]').attr('href')).to.match(/^\/_astro\//);
		});

		it('emits JS assets to /_astro', async () => {
			let html = await fixture.readFile('/index.html');
			let $ = cheerio.load(html);

			const island = $('astro-island');
			expect(island.length).to.eq(1);
			expect(island.attr('component-url')).to.match(/^\/_astro\//);
			expect(island.attr('renderer-url')).to.match(/^\/_astro\//);
		});
	});

	describe('with custom configuration', () => {
		/** @type {import('./test-utils').Fixture} */
		let fixture;

		before(async () => {
			fixture = await loadFixture({
				root: './fixtures/build-assets/',
				integrations: [preact()],
				build: {
					assets: 'custom-assets',
					inlineStylesheets: 'never',
				},
				adapter: testAdapter(),
			});
			await fixture.build();
		});

		it('Populates /custom-assets directory', async () => {
			let files = await fixture.readdir('/custom-assets');
			expect(files.length).to.be.greaterThan(0);
		});

		it('emits CSS assets to /custom-assets', async () => {
			let html = await fixture.readFile('/index.html');
			let $ = cheerio.load(html);

			expect($('link[href$=".css"]').attr('href')).to.match(/^\/custom-assets\//);
		});

		it('emits JS assets to /custom-assets', async () => {
			let html = await fixture.readFile('/index.html');
			let $ = cheerio.load(html);

			const island = $('astro-island');
			expect(island.length).to.eq(1);
			expect(island.attr('component-url')).to.match(/^\/custom-assets\//);
			expect(island.attr('renderer-url')).to.match(/^\/custom-assets\//);
		});
	});
});
