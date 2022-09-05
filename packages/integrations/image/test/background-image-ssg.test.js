import { expect } from 'chai';
import * as cheerio from 'cheerio';
import { loadFixture } from './test-utils.js';

describe('SSG image with background', function () {
	let fixture;
	let devServer;
	let $;

	before(async () => {
		fixture = await loadFixture({ root: './fixtures/background-image/' });
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
		it(title, () => {
			const image = $(id);
			const src = image.attr('src');
			const [_, params] = src.split('?');
			const searchParams = new URLSearchParams(params);
			expect(searchParams.get('bg')).to.equal(bg);
		});
	});
});
