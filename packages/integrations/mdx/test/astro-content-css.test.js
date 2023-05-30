import { expect } from 'chai';
import * as cheerio from 'cheerio';
import { loadFixture } from '../../../astro/test/test-utils.js';
import mdx from '@astrojs/mdx';

describe('build css from the component', async () => {
	let fixture;

	before(async () => {
		fixture = await loadFixture({ root: new URL('./fixtures/astro-content-css/', import.meta.url),integrations: [mdx()], });
		await fixture.build();
	});

	describe('Build', () => {
		before(async () => {
			await fixture.build();
		});

		it('including css and js from the component in pro', async () => {
			const html = await fixture.readFile('/index.html');
			const $ = cheerio.load(html);
			expect($('link[href$=".css"]').attr('href')).to.match(/^\/_astro\//);
			expect($('script[src$=".js"]').attr('src')).to.match(/^\/_astro\//);
		});
	})

	describe('Dev', () => {
		let devServer
		before(async () => {
			devServer = await fixture.startDevServer();
		});

		after(async () => {
			devServer.stop();
		});

		it('ncluding css and js from the component in Dev', async () => {
			let res = await fixture.fetch(`/`);
			expect(res.status).to.equal(200);
			const html = await res.text();
			const $ = cheerio.load(html);
			expect($.html()).to.include('CornflowerBlue');
			expect($('script[src$=".js"]').attr('src')).to.include('astro');
		});
	})
})
