import { expect } from 'chai';
import * as cheerio from 'cheerio';
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

	[
		{
			title: 'Named color',
			id: '#named',
			query: {
				f: 'jpeg',
				w: '256',
				h: '256',
				href: /^\/_astro\/file-icon.\w{8}.png/,
				bg: 'dimgray',
			},
		},
		{
			title: 'Hex color',
			id: '#hex',
			query: {
				f: 'jpeg',
				w: '256',
				h: '256',
				href: /^\/_astro\/file-icon.\w{8}.png/,
				bg: '#696969',
			},
		},
		{
			title: 'Hex color short',
			id: '#hex-short',
			query: {
				f: 'jpeg',
				w: '256',
				h: '256',
				href: /^\/_astro\/file-icon.\w{8}.png/,
				bg: '#666',
			},
		},
		{
			title: 'RGB color',
			id: '#rgb',
			query: {
				f: 'jpeg',
				w: '256',
				h: '256',
				href: /^\/_astro\/file-icon.\w{8}.png/,
				bg: 'rgb(105,105,105)',
			},
		},
		{
			title: 'RGB color with spaces',
			id: '#rgb-spaced',
			query: {
				f: 'jpeg',
				w: '256',
				h: '256',
				href: /^\/_astro\/file-icon.\w{8}.png/,
				bg: 'rgb(105, 105, 105)',
			},
		},
		{
			title: 'RGBA color',
			id: '#rgba',
			query: {
				f: 'jpeg',
				w: '256',
				h: '256',
				href: /^\/_astro\/file-icon.\w{8}.png/,
				bg: 'rgb(105,105,105,0.5)',
			},
		},
		{
			title: 'RGBA color with spaces',
			id: '#rgba-spaced',
			query: {
				f: 'jpeg',
				w: '256',
				h: '256',
				href: /^\/_astro\/file-icon.\w{8}.png/,
				bg: 'rgb(105, 105, 105, 0.5)',
			},
		},
	].forEach(({ title, id, query }) => {
		it(title, async () => {
			const app = await fixture.loadTestAdapterApp();

			const request = new Request('http://example.com/');
			const response = await app.render(request);
			const html = await response.text();
			const $ = cheerio.load(html);

			const image = $(id);
			const src = image.attr('src');
			const [, params] = src.split('?');

			const searchParams = new URLSearchParams(params);

			for (const [key, value] of Object.entries(query)) {
				if (typeof value === 'string') {
					expect(searchParams.get(key)).to.equal(value);
				} else {
					expect(searchParams.get(key)).to.match(value);
				}
			}
		});
	});
});
