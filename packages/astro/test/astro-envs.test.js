import { expect } from 'chai';
import { loadFixture } from './test-utils.js';
import * as cheerio from 'cheerio';

describe('Environment Variables', () => {
	/** @type {import('./test-utils').Fixture} */
	let fixture;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/astro-envs/',
		});
	});

	describe('Build', () => {
		before(async () => {
			await fixture.build();
		});

		it('builds without throwing', async () => {
			expect(true).to.equal(true);
		});

		it('does render public env and private env', async () => {
			let indexHtml = await fixture.readFile('/index.html');

			expect(indexHtml).to.include('CLUB_33');
			expect(indexHtml).to.include('BLUE_BAYOU');
		});

		it('does render destructured public env and private env', async () => {
			let indexHtml = await fixture.readFile('/destructured/index.html');

			expect(indexHtml).to.include('CLUB_33');
			expect(indexHtml).to.include('BLUE_BAYOU');
		});

		it('does render builtin SITE env', async () => {
			let indexHtml = await fixture.readFile('/index.html');
			expect(indexHtml).to.include('http://example.com');
		});

		it('does render destructured builtin SITE env', async () => {
			let indexHtml = await fixture.readFile('/destructured/index.html');

			expect(indexHtml).to.include('http://example.com');
		});

		it('does render builtin BASE_URL env', async () => {
			let indexHtml = await fixture.readFile('/index.html');
			expect(indexHtml).to.include('/blog');
		});

		it('includes public env in client-side JS', async () => {
			let dirs = await fixture.readdir('/');
			let found = false;

			// Look in all of the .js files to see if the public env is inlined.
			// Testing this way prevents hardcoding expected js files.
			// If we find it in any of them that's good enough to know its working.
			await Promise.all(
				dirs.map(async (path) => {
					if (path.endsWith('.js')) {
						let js = await fixture.readFile(`/${path}`);
						if (js.includes('BLUE_BAYOU')) {
							found = true;
						}
					}
				})
			);

			expect(found).to.equal(true, 'found the public env variable in the JS build');
		});

		it('does not include private env in client-side JS', async () => {
			let dirs = await fixture.readdir('/');
			let found = false;

			// Look in all of the .js files to see if the public env is inlined.
			// Testing this way prevents hardcoding expected js files.
			// If we find it in any of them that's good enough to know its NOT working.
			await Promise.all(
				dirs.map(async (path) => {
					if (path.endsWith('.js')) {
						let js = await fixture.readFile(`/${path}`);
						if (js.includes('CLUB_33')) {
							found = true;
						}
					}
				})
			);

			expect(found).to.equal(false, 'found the private env variable in the JS build');
		});
	});

	describe('Development', () => {
		/** @type {import('./test-utils').DevServer} */
		let devServer;
		before(async () => {
			devServer = await fixture.startDevServer();
		});
		after(async () => {
			await devServer.stop();
		});

		it('does render builtin BASE_URL env', async () => {
			let res = await fixture.fetch('/blog/');
			expect(res.status).to.equal(200);
			let indexHtml = await res.text();
			let $ = cheerio.load(indexHtml);
			expect($('#base-url').text()).to.equal('/blog/');
		});

		it('does render destructured builtin SITE env', async () => {
			let res = await fixture.fetch('/blog/destructured/');
			expect(res.status).to.equal(200);
			let indexHtml = await res.text();
			let $ = cheerio.load(indexHtml);
			expect($('#base-url').text()).to.equal('/blog/');
		});
	});
});
