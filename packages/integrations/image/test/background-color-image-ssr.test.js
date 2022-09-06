import { expect } from 'chai';
import * as cheerio from 'cheerio';
import sharp from 'sharp';
import { loadFixture } from './test-utils.js';
import testAdapter from '../../../astro/test/test-adapter.js';

let fixture;

describe('SSR image with background', function () {
	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/background-color-image/',
			adapter: testAdapter({ streaming: false }),
			output: 'server',
		});
		await fixture.build();
	});

	async function verifyImage(pathname, expectedBg) {
		const url = new URL('./fixtures/background-color-image/dist/' + pathname, import.meta.url);
		const dist = fileURLToPath(url);
		const { data } = await sharp(dist).raw().toBuffer(/*{ resolveWithObject: true }*/);
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
	].forEach(({ title, id, bg }) => {
		it(title, async () => {
			const app = await fixture.loadTestAdapterApp();

			const request = new Request('http://example.com/');
			const response = await app.render(request);
			const html = await response.text();
			const $ = cheerio.load(html);

			const image = $(id);
			const src = image.attr('src');
			//await verifyImage(src, bg);
		});
	});
});
