import { expect } from 'chai';
import * as cheerio from 'cheerio';
import sharp from 'sharp';
import { fileURLToPath } from 'url';
import { loadFixture } from './test-utils.js';

describe('SSG image with background - dev', function () {
	let fixture;
	let devServer;
	let $;

	before(async () => {
		fixture = await loadFixture({ root: './fixtures/background-color-image/' });
		devServer = await fixture.startDevServer();
		const html = await fixture.fetch('/').then((res) => res.text());
		$ = cheerio.load(html);
	});

	after(async () => {
		await devServer.stop();
	});

	[
		{
			title: 'Named color',
			id: '#named',
			bg: 'dimgray',
		},
		{
			title: 'Hex color',
			id: '#hex',
			bg: '#696969',
		},
		{
			title: 'Hex color short',
			id: '#hex-short',
			bg: '#666',
		},
		{
			title: 'RGB color',
			id: '#rgb',
			bg: 'rgb(105,105,105)',
		},
		{
			title: 'RGB color with spaces',
			id: '#rgb-spaced',
			bg: 'rgb(105, 105, 105)',
		},
	].forEach(({ title, id, bg }) => {
		it(title, async () => {
			const image = $(id);
			const src = image.attr('src');
			const [, params] = src.split('?');
			const searchParams = new URLSearchParams(params);
			expect(searchParams.get('bg')).to.equal(bg);
		});
	});
});

describe('SSG image with background - build', function () {
	let fixture;
	let $;
	let html;

	before(async () => {
		fixture = await loadFixture({ root: './fixtures/background-color-image/' });
		await fixture.build();

		html = await fixture.readFile('/index.html');
		$ = cheerio.load(html);
	});

	async function verifyImage(pathname, expectedBg) {
		const url = new URL('./fixtures/background-color-image/dist/' + pathname, import.meta.url);
		const dist = fileURLToPath(url);
		const data = await sharp(dist).raw().toBuffer();
		// check that the first RGB pixel indeed has the requested background color
		expect(data[0]).to.equal(expectedBg[0]);
		expect(data[1]).to.equal(expectedBg[1]);
		expect(data[2]).to.equal(expectedBg[2]);
	}

	[
		{
			title: 'Named color',
			id: '#named',
			bg: [105, 105, 105],
		},
		{
			title: 'Hex color',
			id: '#hex',
			bg: [105, 105, 105],
		},
		{
			title: 'Hex color short',
			id: '#hex-short',
			bg: [102, 102, 102],
		},
		{
			title: 'RGB color',
			id: '#rgb',
			bg: [105, 105, 105],
		},
		{
			title: 'RGB color with spaces',
			id: '#rgb-spaced',
			bg: [105, 105, 105],
		},

		{
			title: 'RGBA color',
			id: '#rgba',
			bg: [105, 105, 105],
		},
		{
			title: 'RGBA color with spaces',
			id: '#rgba-spaced',
			bg: [105, 105, 105],
		},
	].forEach(({ title, id, bg }) => {
		it(title, async () => {
			const image = $(id);
			const src = image.attr('src');
			await verifyImage(src, bg);
		});
	});
});
