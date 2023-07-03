import { expect } from 'chai';
import * as cheerio from 'cheerio';
import fs from 'fs';
import sizeOf from 'image-size';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { join } from 'node:path';
import { loadFixture } from './test-utils.js';
import srcsetParse from 'srcset-parse';

const matchSrcset = srcsetParse.default;

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const toAstroImage = (relpath) =>
	'/@astroimage' + pathToFileURL(join(__dirname, 'fixtures/basic-picture', relpath)).pathname;

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
			url: toAstroImage('src/assets/social.jpg'),
			query: { f: 'jpg', w: '506', h: '253' },
			alt: 'Social image',
		},
		{
			title: 'Filename with spaces',
			id: '#spaces',
			url: toAstroImage('src/assets/blog/introducing astro.jpg'),
			query: { f: 'jpg', w: '768', h: '414' },
			alt: 'spaces',
		},
		{
			title: 'File outside src',
			id: '#outside-src',
			url: toAstroImage('social.png'),
			query: { f: 'png', w: '768', h: '414' },
			alt: 'outside-src',
		},
		{
			title: 'Inline imports',
			id: '#inline',
			url: toAstroImage('src/assets/social.jpg'),
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
			const image = $(`${id}`);
			const picture = image.closest('picture');

			const sources = picture.children('source');
			expect(sources.length).to.equal(3);

			sources.each((_, el) => {
				const srcset = $(el).attr('srcset');
				expect(matchSrcset(srcset).length).to.equal(2);
			});

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
			url: toAstroImage('src/assets/social.jpg'),
			query: { f: 'jpg', w: '506', h: '253' },
			alt: 'Social image',
		},
		{
			title: 'Filename with spaces',
			id: '#spaces',
			url: toAstroImage('src/assets/blog/introducing astro.jpg'),
			query: { f: 'jpg', w: '768', h: '414' },
			alt: 'spaces',
		},
		{
			title: 'File outside src',
			id: '#outside-src',
			url: toAstroImage('social.png'),
			query: { f: 'png', w: '768', h: '414' },
			alt: 'outside-src',
		},
		{
			title: 'Inline imports',
			id: '#inline',
			url: toAstroImage('src/assets/social.jpg'),
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
			query: { f: 'jpg', w: '768', h: '414', href: '/docs/hero.jpg' },
			alt: 'Hero image',
		},
	].forEach(({ title, id, url, query, alt }) => {
		it(title, () => {
			const image = $(`${id}`);
			const picture = image.closest('picture');

			const sources = picture.children('source');
			expect(sources.length).to.equal(3);

			const src = image.attr('src');
			const [route, params] = src.split('?');

			for (const srcset of picture
				.children('source')
				.map((_, source) => source.attribs['srcset'])) {
				for (const pictureSrc of srcset.split(',')) {
					const pictureParams = pictureSrc.split('?')[1];

					const expected = new URLSearchParams(params).get('href');
					const actual = new URLSearchParams(pictureParams).get('href').replace(/\s+\d+w$/, '');
					expect(expected).to.equal(actual);
				}
			}

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
			regex: /^\/_astro\/social.\w{8}_\w{4,10}.jpg/,
			size: { width: 506, height: 253, type: 'jpg' },
			alt: 'Social image',
		},
		{
			title: 'Filename with spaces',
			id: '#spaces',
			regex: /^\/_astro\/introducing astro.\w{8}_\w{4,10}.jpg/,
			size: { width: 768, height: 414, type: 'jpg' },
			alt: 'spaces',
		},
		{
			title: 'File outside src',
			id: '#outside-src',
			regex: /^\/_astro\/social.\w{8}_\w{4,10}.png/,
			size: { type: 'png', width: 768, height: 414 },
			alt: 'outside-src',
		},
		{
			title: 'Inline images',
			id: '#inline',
			regex: /^\/_astro\/social.\w{8}_\w{4,10}.jpg/,
			size: { width: 506, height: 253, type: 'jpg' },
			alt: 'Inline social image',
		},
		{
			title: 'Remote images',
			id: '#google',
			regex: /^\/_astro\/googlelogo_color_272x92dp_\w{4,10}.png/,
			size: { width: 544, height: 184, type: 'png' },
			alt: 'Google logo',
		},
		{
			title: 'Remote without file extension',
			id: '#ipsum',
			regex: /^\/_astro\/200x300_\w{4,10}/,
			size: { width: 200, height: 300, type: 'jpg' },
			alt: 'ipsum',
		},
		{
			title: 'Public images',
			id: '#hero',
			regex: /^\/_astro\/hero_\w{4,10}.jpg/,
			size: { width: 768, height: 414, type: 'jpg' },
			alt: 'Hero image',
		},
	].forEach(({ title, id, regex, size, alt }) => {
		it(title, () => {
			const image = $(`${id}`);
			const picture = image.closest('picture');

			const sources = picture.children('source');
			expect(sources.length).to.equal(3);

			expect(image.attr('src')).to.match(regex);
			expect(image.attr('alt')).to.equal(alt);

			verifyImage(image.attr('src'), size);

			sources.each((_, el) => {
				const source = $(el);
				const srcset = source.attr('srcset');

				expect(matchSrcset(srcset).length).to.equal(2);

				for (const src of srcset.split(',')) {
					const segments = src.split(' ');

					// filenames may have a space in them, pop the last item for the
					// width and join the other segments back for the filepath
					const width = segments.pop();
					const pathname = segments.join(' ');

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
			regex: /^\/docs\/_astro\/social.\w{8}_\w{4,10}.jpg/,
			size: { width: 506, height: 253, type: 'jpg' },
			alt: 'Social image',
		},
		{
			title: 'File outside src',
			id: '#outside-src',
			regex: /^\/docs\/_astro\/social.\w{8}_\w{4,10}.png/,
			size: { type: 'png', width: 768, height: 414 },
			alt: 'outside-src',
		},
		{
			title: 'Inline images',
			id: '#inline',
			regex: /^\/docs\/_astro\/social.\w{8}_\w{4,10}.jpg/,
			size: { width: 506, height: 253, type: 'jpg' },
			alt: 'Inline social image',
		},
		{
			title: 'Remote images',
			id: '#google',
			regex: /^\/docs\/_astro\/googlelogo_color_272x92dp_\w{4,10}.png/,
			size: { width: 544, height: 184, type: 'png' },
			alt: 'Google logo',
		},
		{
			title: 'Remote without file extension',
			id: '#ipsum',
			regex: /^\/docs\/_astro\/200x300_\w{4,10}/,
			size: { width: 200, height: 300, type: 'jpg' },
			alt: 'ipsum',
		},
		{
			title: 'Public images',
			id: '#hero',
			regex: /^\/docs\/_astro\/hero_\w{4,10}.jpg/,
			size: { width: 768, height: 414, type: 'jpg' },
			alt: 'Hero image',
		},
	].forEach(({ title, id, regex, size, alt }) => {
		it(title, () => {
			const image = $(`${id}`);
			const picture = image.closest('picture');

			const sources = picture.children('source');
			expect(sources.length).to.equal(3);

			expect(image.attr('src')).to.match(regex);
			expect(image.attr('alt')).to.equal(alt);

			verifyImage(image.attr('src').replace('/docs', ''), size);

			sources.each((_, el) => {
				const source = $(el);
				const srcset = source.attr('srcset');

				expect(matchSrcset(srcset).length).to.equal(2);

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

describe('SSG pictures others - build', function () {
	let fixture;
	let $;
	let html;

	before(async () => {
		fixture = await loadFixture({ root: './fixtures/basic-picture/' });
		await fixture.build();

		html = await fixture.readFile('/index.html');
		$ = cheerio.load(html);
	});

	it('fallback image should share last source', async () => {
		const hero = $('#hero');
		const picture = hero.closest('picture');

		const source = picture.children('source').last();
		const image = picture.children('img').last();

		expect(source.attr('srcset')).to.include(image.attr('src'));
	});
});
