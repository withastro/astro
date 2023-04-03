import { expect } from 'chai';
import { loadFixture } from './test-utils.js';
import * as cheerio from 'cheerio';

describe('Environment Variables when use --mode flag', () => {
	/** @type {import('./test-utils').Fixture} */
	let fixture;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/astro-mode-envs/',
		});
	});

	describe('Build', () => {
		before(async () => {
			await fixture.build({mode: 'test'});
		});

		it('does render public env and private env', async () => {
			let indexHtml = await fixture.readFile('/index.html');
			expect(indexHtml).to.include('test');
			expect(indexHtml).to.include('BLUE_BAYOU');
		});

	
	});

	describe('Development', () => {
		/** @type {import('./test-utils').DevServer} */
		let devServer;
		before(async () => {
			devServer = await fixture.startDevServer({mode: 'test'});
		});
		after(async () => {
			await devServer.stop();
		});

		it('does render public env and private env', async () => {
			let res = await fixture.fetch('/index.html');
			let test = await res.text();
			expect(test).to.include('test');
			expect(test).to.include('BLUE_BAYOU');
		});
	});
});
