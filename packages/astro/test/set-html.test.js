import { expect } from 'chai';
import * as cheerio from 'cheerio';
import { loadFixture } from './test-utils.js';

describe('set:html', () => {
	/** @type {import('./test-utils').Fixture} */
	let fixture;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/set-html/',
		});
	});

	describe('Development', () => {
		/** @type {import('./test-utils').DevServer} */
		let devServer;

		before(async () => {
			devServer = await fixture.startDevServer();
			globalThis.TEST_FETCH = (fetch, url, init) => {
				return fetch(fixture.resolveUrl(url), init);
			};
		});

		after(async () => {
			await devServer.stop();
		});

		it('can take a fetch()', async () => {
			let res = await fixture.fetch('/fetch');
			expect(res.status).to.equal(200);
			let html = await res.text();
			const $ = cheerio.load(html);
			expect($('#fetched-html')).to.have.a.lengthOf(1);
			expect($('#fetched-html').text()).to.equal('works');
		});
		it('test Fragment when Fragment is as a slot', async () => {
			let res = await fixture.fetch('/children');
			expect(res.status).to.equal(200);
			let html = await res.text();
			expect(html).include('Test');
		})
	});

	describe('Build', () => {
		before(async () => {
			await fixture.build();
		});

		it('can take a string of HTML', async () => {
			const html = await fixture.readFile('/index.html');
			const $ = cheerio.load(html);
			expect($('#html-inner')).to.have.a.lengthOf(1);
		});

		it('can take a Promise to a string of HTML', async () => {
			const html = await fixture.readFile('/index.html');
			const $ = cheerio.load(html);
			expect($('#promise-html-inner')).to.have.a.lengthOf(1);
		});

		it('can take a Response to a string of HTML', async () => {
			const html = await fixture.readFile('/index.html');
			const $ = cheerio.load(html);
			expect($('#response-html-inner')).to.have.a.lengthOf(1);
		});

		it('can take an Iterator', async () => {
			const html = await fixture.readFile('/index.html');
			const $ = cheerio.load(html);
			expect($('#iterator-num')).to.have.a.lengthOf(5);
		});

		it('Can take an AsyncIterator', async () => {
			const html = await fixture.readFile('/index.html');
			const $ = cheerio.load(html);
			expect($('#asynciterator-num')).to.have.a.lengthOf(5);
		});

		it('Can take a ReadableStream', async () => {
			const html = await fixture.readFile('/index.html');
			const $ = cheerio.load(html);
			expect($('#readable-inner')).to.have.a.lengthOf(1);
		});

		it('test Fragment when Fragment is as a slot', async () => {
			let res = await fixture.readFile('/children/index.html');
			expect(res).include('Test');
		})
	});
});
