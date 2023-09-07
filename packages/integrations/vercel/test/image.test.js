import { expect } from 'chai';
import * as cheerio from 'cheerio';
import { loadFixture } from './test-utils.js';

describe('Image', () => {
	/** @type {import('../../../astro/test/test-utils.js').Fixture} */
	let fixture;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/image/',
		});
		await fixture.build();
	});

	it('build successful', async () => {
		expect(await fixture.readFile('../.vercel/output/static/index.html')).to.be.ok;
	});

	it('has link to vercel in build with proper attributes', async () => {
		const html = await fixture.readFile('../.vercel/output/static/index.html');
		const $ = cheerio.load(html);
		const img = $('img');

		expect(img.attr('src').startsWith('/_vercel/image?url=_astr')).to.be.true;
		expect(img.attr('loading')).to.equal('lazy');
		expect(img.attr('width')).to.equal('225');
	});

	it('has proper vercel config', async () => {
		const vercelConfig = JSON.parse(await fixture.readFile('../.vercel/output/config.json'));

		expect(vercelConfig.images).to.deep.equal({
			sizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
			domains: ['astro.build'],
			remotePatterns: [
				{
					protocol: 'https',
					hostname: '**.amazonaws.com',
				},
			],
		});
	});

	describe('dev', () => {
		let devServer;

		before(async () => {
			devServer = await fixture.startDevServer();
		});

		after(async () => {
			await devServer.stop();
		});

		it('has link to local image in dev with proper attributes', async () => {
			const html = await fixture.fetch('/').then((res) => res.text());
			const $ = cheerio.load(html);
			const img = $('img');

			expect(img.attr('src').startsWith('/_image?href=')).to.be.true;
			expect(img.attr('loading')).to.equal('lazy');
			expect(img.attr('width')).to.equal('225');
		});
	});
});
