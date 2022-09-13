import { expect } from 'chai';
import * as cheerio from 'cheerio';
import fs from 'fs';
import sizeOf from 'image-size';
import path from 'path';
import { fileURLToPath } from 'url';
import { loadFixture } from './test-utils.js';

describe('SSG pictures - dev', function () {
	let fixture;
	let devServer;
	let $;

	before(async () => {
		fixture = await loadFixture({ root: './fixtures/basic-picture/' });
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
			alt: 'Social image',
		},
		{
			title: 'Inline imports',
			id: '#inline',
			url: '/@astroimage/assets/social.jpg',
			query: { f: 'jpg', w: '506', h: '253' },
			alt: 'Inline social image',
		},
		{
			title: 'Remote images',
			id: '#google',
			url: '/_image',
			query: {
				f: 'png',
				w: '544',
				h: '184',
				href: 'https://www.google.com/images/branding/googlelogo/2x/googlelogo_color_272x92dp.png',
			},
			alt: 'Google logo',
		},
		{
			title: 'Public images',
			id: '#hero',
			url: '/_image',
			query: { f: 'jpg', w: '768', h: '414', href: '/hero.jpg' },
			alt: 'Hero image',
		},
		{
			title: 'Background color',
			id: '#bg-color',
			url: '/_image',
			query: {
				f: 'png',
				w: '544',
				h: '184',
				bg: 'rgb(51, 51, 51)',
				href: 'https://www.google.com/images/branding/googlelogo/2x/googlelogo_color_272x92dp.png',
			},
			alt: 'Google logo',
		},
	].forEach(({ title, id, url, query, alt }) => {
		it(title, () => {
			const sources = $(`${id} source`);
			expect(sources.length).to.equal(3);

			const image = $(`${id} img`);

			const src = image.attr('src');
			const [route, params] = src.split('?');

			expect(route).to.equal(url);

			const searchParams = new URLSearchParams(params);

			for (const [key, value] of Object.entries(query)) {
				expect(searchParams.get(key)).to.equal(value);
			}

			expect(image.attr('alt')).to.equal(alt);
		});
	});
});

describe('SSG pictures with subpath - dev', function () {
	let fixture;
	let devServer;
	let $;

	before(async () => {
		fixture = await loadFixture({ root: './fixtures/basic-picture/', base: '/docs' });
		devServer = await fixture.startDevServer();
		const html = await fixture.fetch('/docs/').then((res) => res.text());
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
			alt: 'Social image',
		},
		{
			title: 'Inline imports',
			id: '#inline',
			url: '/@astroimage/assets/social.jpg',
			query: { f: 'jpg', w: '506', h: '253' },
			alt: 'Inline social image',
		},
		{
			title: 'Remote images',
			id: '#google',
			url: '/_image',
			query: {
				f: 'png',
				w: '544',
				h: '184',
				href: 'https://www.google.com/images/branding/googlelogo/2x/googlelogo_color_272x92dp.png',
			},
			alt: 'Google logo',
		},
		{
			title: 'Public images',
			id: '#hero',
			url: '/_image',
			query: { f: 'jpg', w: '768', h: '414', href: '/hero.jpg' },
			alt: 'Hero image',
		},
	].forEach(({ title, id, url, query, alt }) => {
		it(title, () => {
			const sources = $(`${id} source`);
			expect(sources.length).to.equal(3);

			const image = $(`${id} img`);

			const src = image.attr('src');
			const [route, params] = src.split('?');

			expect(route).to.equal(url);

			const searchParams = new URLSearchParams(params);

			for (const [key, value] of Object.entries(query)) {
				expect(searchParams.get(key)).to.equal(value);
			}

			expect(image.attr('alt')).to.equal(alt);
		});
	});
});

describe('SSG pictures - build', function () {
	let fixture;
	let $;
	let html;

	before(async () => {
		fixture = await loadFixture({ root: './fixtures/basic-picture/' });
		await fixture.build();

		html = await fixture.readFile('/index.html');
		$ = cheerio.load(html);
	});

	function verifyImage(pathname, expected) {
		const url = new URL('./fixtures/basic-picture/dist/' + pathname, import.meta.url);
		const dist = fileURLToPath(url);

		// image-size doesn't support AVIF files
		if (expected.type !== 'avif') {
			const result = sizeOf(dist);
			expect(result).to.deep.equal(expected);
		} else {
			expect(fs.statSync(dist)).not.to.be.undefined;
		}
	}

	[
		{
			title: 'Local images',
			id: '#social-jpg',
			regex: /^\/assets\/social.\w{8}_\w{4,10}.jpg/,
			size: { width: 506, height: 253, type: 'jpg' },
			alt: 'Social image',
		},
		{
			title: 'Inline images',
			id: '#inline',
			regex: /^\/assets\/social.\w{8}_\w{4,10}.jpg/,
			size: { width: 506, height: 253, type: 'jpg' },
			alt: 'Inline social image',
		},
		{
			title: 'Remote images',
			id: '#google',
			regex: /^\/assets\/googlelogo_color_272x92dp_\w{4,10}.png/,
			size: { width: 544, height: 184, type: 'png' },
			alt: 'Google logo',
		},
		{
			title: 'Remote without file extension',
			id: '#ipsum',
			regex: /^\/assets\/300_\w{4,10}/,
			size: { width: 200, height: 300, type: 'jpg' },
			alt: 'ipsum',
		},
		{
			title: 'Public images',
			id: '#hero',
			regex: /^\/assets\/hero_\w{4,10}.jpg/,
			size: { width: 768, height: 414, type: 'jpg' },
			alt: 'Hero image',
		},
	].forEach(({ title, id, regex, size, alt }) => {
		it(title, () => {
			const sources = $(`${id} source`);
			expect(sources.length).to.equal(3);

			const image = $(`${id} img`);

			expect(image.attr('src')).to.match(regex);
			expect(image.attr('width')).to.equal(size.width.toString());
			expect(image.attr('height')).to.equal(size.height.toString());
			expect(image.attr('alt')).to.equal(alt);

			verifyImage(image.attr('src'), size);

			sources.each((_, el) => {
				const source = $(el);
				const srcset = source.attr('srcset');

				for (const src of srcset.split(',')) {
					const [pathname, width] = src.split(' ');
					const widthNum = parseInt(width.substring(0, width.length - 1));

					verifyImage(pathname, {
						width: widthNum,
						height: widthNum === size.width ? size.height : Math.round(size.height / 2),
						type: path.extname(pathname).substring(1),
					});
				}
			});
		});
	});
});

describe('SSG pictures with subpath - build', function () {
	let fixture;
	let $;
	let html;

	before(async () => {
		fixture = await loadFixture({ root: './fixtures/basic-picture/', base: '/docs' });
		await fixture.build();

		html = await fixture.readFile('/index.html');
		$ = cheerio.load(html);
	});

	function verifyImage(pathname, expected) {
		const url = new URL('./fixtures/basic-picture/dist/' + pathname, import.meta.url);
		const dist = fileURLToPath(url);

		// image-size doesn't support AVIF files
		if (expected.type !== 'avif') {
			const result = sizeOf(dist);
			expect(result).to.deep.equal(expected);
		} else {
			expect(fs.statSync(dist)).not.to.be.undefined;
		}
	}

	[
		{
			title: 'Local images',
			id: '#social-jpg',
			regex: /^\/docs\/assets\/social.\w{8}_\w{4,10}.jpg/,
			size: { width: 506, height: 253, type: 'jpg' },
			alt: 'Social image',
		},
		{
			title: 'Inline images',
			id: '#inline',
			regex: /^\/docs\/assets\/social.\w{8}_\w{4,10}.jpg/,
			size: { width: 506, height: 253, type: 'jpg' },
			alt: 'Inline social image',
		},
		{
			title: 'Remote images',
			id: '#google',
			regex: /^\/docs\/assets\/googlelogo_color_272x92dp_\w{4,10}.png/,
			size: { width: 544, height: 184, type: 'png' },
			alt: 'Google logo',
		},
		{
			title: 'Remote without file extension',
			id: '#ipsum',
			regex: /^\/docs\/assets\/300_\w{4,10}/,
			size: { width: 200, height: 300, type: 'jpg' },
			alt: 'ipsum',
		},
		{
			title: 'Public images',
			id: '#hero',
			regex: /^\/docs\/assets\/hero_\w{4,10}.jpg/,
			size: { width: 768, height: 414, type: 'jpg' },
			alt: 'Hero image',
		},
	].forEach(({ title, id, regex, size, alt }) => {
		it(title, () => {
			const sources = $(`${id} source`);
			expect(sources.length).to.equal(3);

			const image = $(`${id} img`);

			expect(image.attr('src')).to.match(regex);
			expect(image.attr('width')).to.equal(size.width.toString());
			expect(image.attr('height')).to.equal(size.height.toString());
			expect(image.attr('alt')).to.equal(alt);

			verifyImage(image.attr('src').replace('/docs', ''), size);

			sources.each((_, el) => {
				const source = $(el);
				const srcset = source.attr('srcset');

				for (const src of srcset.split(',')) {
					const [pathname, width] = src.split(' ');
					const widthNum = parseInt(width.substring(0, width.length - 1));

					verifyImage(pathname.replace('/docs', ''), {
						width: widthNum,
						height: widthNum === size.width ? size.height : Math.round(size.height / 2),
						type: path.extname(pathname).substring(1),
					});
				}
			});
		});
	});
});
