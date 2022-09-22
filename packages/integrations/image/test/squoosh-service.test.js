import { expect } from 'chai';
import * as cheerio from 'cheerio';
import { loadFixture } from './test-utils.js';

describe('Squoosh service', function () {
	let fixture;
	let devServer;
	let $;

	before(async () => {
		fixture = await loadFixture({ root: './fixtures/basic-image/' });
		devServer = await fixture.startDevServer();
		const html = await fixture.fetch('/').then((res) => res.text());
		$ = cheerio.load(html);
	});

	after(async () => {
		await devServer.stop();
	});

	[
		{
			title: 'Local images',
			id: '#social-jpg',
			url: '/@astroimage/assets/social.jpg',
			query: { f: 'jpg', w: '506', h: '253' },
		},
		{
			title: 'Remote images',
			id: '#google',
			url: '/_image',
			query: {
				f: 'webp',
				w: '544',
				h: '184',
				href: 'https://www.google.com/images/branding/googlelogo/2x/googlelogo_color_272x92dp.png',
			},
		},
		{
			title: 'Public images',
			id: '#hero',
			url: '/_image',
			query: { f: 'webp', w: '768', h: '414', href: '/hero.jpg' },
		},
	].forEach(({ title, id, url, query }) => {
		it(title, () => {
			const image = $(id);

			const src = image.attr('src');
			const [route, params] = src.split('?');

			expect(route).to.equal(url);

			const searchParams = new URLSearchParams(params);

			for (const [key, value] of Object.entries(query)) {
				expect(searchParams.get(key)).to.equal(value);
			}
		});
	});
});
