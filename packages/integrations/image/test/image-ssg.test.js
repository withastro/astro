import { expect } from 'chai';
import * as cheerio from 'cheerio';
import sizeOf from 'image-size';
import { fileURLToPath } from 'url';
import { loadFixture } from './test-utils.js';

describe('SSG images - dev', function () {
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

	describe('Local images', () => {
		it('includes <img> attributes', () => {
			const image = $('#social-jpg');

			const src = image.attr('src');
			const [route, params] = src.split('?');

			expect(route).to.equal('/@astroimage/assets/social.jpg');

			const searchParams = new URLSearchParams(params);

			expect(searchParams.get('f')).to.equal('jpg');
			expect(searchParams.get('w')).to.equal('506');
			expect(searchParams.get('h')).to.equal('253');
		});
	});

	describe('Local images with inline imports', () => {
		it('includes <img> attributes', () => {
			const image = $('#inline');

			const src = image.attr('src');
			const [route, params] = src.split('?');

			expect(route).to.equal('/@astroimage/assets/social.jpg');

			const searchParams = new URLSearchParams(params);

			expect(searchParams.get('f')).to.equal('jpg');
			expect(searchParams.get('w')).to.equal('506');
			expect(searchParams.get('h')).to.equal('253');
		});
	});

	describe('Remote images', () => {
		it('includes <img> attributes', () => {
			const image = $('#google');

			const src = image.attr('src');
			const [route, params] = src.split('?');

			expect(route).to.equal('/_image');

			const searchParams = new URLSearchParams(params);

			expect(searchParams.get('f')).to.equal('webp');
			expect(searchParams.get('w')).to.equal('544');
			expect(searchParams.get('h')).to.equal('184');
			expect(searchParams.get('href')).to.equal(
				'https://www.google.com/images/branding/googlelogo/2x/googlelogo_color_272x92dp.png'
			);
		});
	});

	describe('/public images', () => {
		it('includes <img> attributes', () => {
			const image = $('#hero');

			const src = image.attr('src');
			const [route, params] = src.split('?');

			expect(route).to.equal('/_image');

			const searchParams = new URLSearchParams(params);

			expect(searchParams.get('href')).to.equal('/hero.jpg');
			expect(searchParams.get('f')).to.equal('webp');
			expect(searchParams.get('w')).to.equal('768');
			expect(searchParams.get('h')).to.equal('414');
		});
	});
});

describe('SSG images with subpath - dev', function () {
	let fixture;
	let devServer;
	let $;

	before(async () => {
		fixture = await loadFixture({ root: './fixtures/basic-image/', base: '/docs' });
		devServer = await fixture.startDevServer();
		const html = await fixture.fetch('/docs/').then((res) => res.text());
		$ = cheerio.load(html);
	});

	after(async () => {
		await devServer.stop();
	});

	describe('Local images', () => {
		it('includes <img> attributes', () => {
			const image = $('#social-jpg');

			const src = image.attr('src');
			const [route, params] = src.split('?');

			expect(route).to.equal('/@astroimage/assets/social.jpg');

			const searchParams = new URLSearchParams(params);

			expect(searchParams.get('f')).to.equal('jpg');
			expect(searchParams.get('w')).to.equal('506');
			expect(searchParams.get('h')).to.equal('253');
		});
	});

	describe('Local images with inline imports', () => {
		it('includes <img> attributes', () => {
			const image = $('#inline');

			const src = image.attr('src');
			const [route, params] = src.split('?');

			expect(route).to.equal('/@astroimage/assets/social.jpg');

			const searchParams = new URLSearchParams(params);

			expect(searchParams.get('f')).to.equal('jpg');
			expect(searchParams.get('w')).to.equal('506');
			expect(searchParams.get('h')).to.equal('253');
		});
	});

	describe('Remote images', () => {
		it('includes <img> attributes', () => {
			const image = $('#google');

			const src = image.attr('src');
			const [route, params] = src.split('?');

			expect(route).to.equal('/_image');

			const searchParams = new URLSearchParams(params);

			expect(searchParams.get('f')).to.equal('webp');
			expect(searchParams.get('w')).to.equal('544');
			expect(searchParams.get('h')).to.equal('184');
			expect(searchParams.get('href')).to.equal(
				'https://www.google.com/images/branding/googlelogo/2x/googlelogo_color_272x92dp.png'
			);
		});
	});

	describe('/public images', () => {
		it('includes <img> attributes', () => {
			const image = $('#hero');

			const src = image.attr('src');
			const [route, params] = src.split('?');

			expect(route).to.equal('/_image');

			const searchParams = new URLSearchParams(params);

			expect(searchParams.get('href')).to.equal('/hero.jpg');
			expect(searchParams.get('f')).to.equal('webp');
			expect(searchParams.get('w')).to.equal('768');
			expect(searchParams.get('h')).to.equal('414');
		});
	});
});

describe('SSG images - build', function () {
	let fixture;
	let $;
	let html;

	before(async () => {
		fixture = await loadFixture({ root: './fixtures/basic-image/' });
		await fixture.build();

		html = await fixture.readFile('/index.html');
		$ = cheerio.load(html);
	});

	function verifyImage(pathname, expected) {
		const url = new URL('./fixtures/basic-image/dist/' + pathname, import.meta.url);
		const dist = fileURLToPath(url);
		const result = sizeOf(dist);
		expect(result).to.deep.equal(expected);
	}

	describe('Local images', () => {
		it('includes <img> attributes', () => {
			const image = $('#social-jpg');

			expect(image.attr('src')).to.equal('/social.cece8c77_1zwatP.jpg');
			expect(image.attr('width')).to.equal('506');
			expect(image.attr('height')).to.equal('253');
		});

		it('built the optimized image', () => {
			verifyImage('social.cece8c77_1zwatP.jpg', { width: 506, height: 253, type: 'jpg' });
		});
	});

	describe('Inline imports', () => {
		it('includes <img> attributes', () => {
			const image = $('#inline');

			expect(image.attr('src')).to.equal('/social.cece8c77_Z2tF99.jpg');
			expect(image.attr('width')).to.equal('506');
			expect(image.attr('height')).to.equal('253');
		});

		it('built the optimized image', () => {
			verifyImage('social.cece8c77_Z2tF99.jpg', { width: 506, height: 253, type: 'jpg' });
		});
	});

	describe('Remote images', () => {
		// Hard-coding in the test! These should never change since the hash is based
		// on the static `src` string
		const HASH = 'Z1RBHqs';
		const HASH_WITH_QUERY = 'Z17oujH';

		it('includes <img> attributes', () => {
			const image = $('#google');

			expect(image.attr('src')).to.equal(`/googlelogo_color_272x92dp_${HASH}.webp`);
			expect(image.attr('width')).to.equal('544');
			expect(image.attr('height')).to.equal('184');
		});

		it('built the optimized image', () => {
			verifyImage(`/googlelogo_color_272x92dp_${HASH}.webp`, {
				width: 544,
				height: 184,
				type: 'webp',
			});
		});

		it('removes query strings', () => {
			verifyImage(`/googlelogo_color_272x92dp_${HASH_WITH_QUERY}.webp`, {
				width: 544,
				height: 184,
				type: 'webp',
			});
		});
	});

	describe('/public images', () => {
		it('includes <img> attributes', () => {
			const image = $('#hero');

			expect(image.attr('src')).to.equal('/hero_Z2k1JGN.webp');
			expect(image.attr('width')).to.equal('768');
			expect(image.attr('height')).to.equal('414');
		});

		it('built the optimized image', () => {
			verifyImage('hero_Z2k1JGN.webp', { width: 768, height: 414, type: 'webp' });
		});
	});
});

describe('SSG images with subpath - build', function () {
	let fixture;
	let $;
	let html;

	before(async () => {
		fixture = await loadFixture({ root: './fixtures/basic-image/', base: '/docs' });
		await fixture.build();

		html = await fixture.readFile('/index.html');
		$ = cheerio.load(html);
	});

	function verifyImage(pathname, expected) {
		const url = new URL('./fixtures/basic-image/dist/' + pathname, import.meta.url);
		const dist = fileURLToPath(url);
		const result = sizeOf(dist);
		expect(result).to.deep.equal(expected);
	}

	describe('Local images', () => {
		it('includes <img> attributes', () => {
			const image = $('#social-jpg');

			expect(image.attr('src')).to.equal('/docs/social.cece8c77_iK4oy.jpg');
			expect(image.attr('width')).to.equal('506');
			expect(image.attr('height')).to.equal('253');
		});

		it('built the optimized image', () => {
			verifyImage('social.cece8c77_iK4oy.jpg', { width: 506, height: 253, type: 'jpg' });
		});
	});

	describe('Inline imports', () => {
		it('includes <img> attributes', () => {
			const image = $('#inline');

			expect(image.attr('src')).to.equal('/docs/social.cece8c77_1YIUw1.jpg');
			expect(image.attr('width')).to.equal('506');
			expect(image.attr('height')).to.equal('253');
		});

		it('built the optimized image', () => {
			verifyImage('social.cece8c77_1YIUw1.jpg', { width: 506, height: 253, type: 'jpg' });
		});
	});

	describe('Remote images', () => {
		// Hard-coding in the test! These should never change since the hash is based
		// on the static `src` string
		const HASH = 'Z1RBHqs';
		const HASH_WITH_QUERY = 'Z17oujH';

		it('includes <img> attributes', () => {
			const image = $('#google');

			expect(image.attr('src')).to.equal(`/docs/googlelogo_color_272x92dp_${HASH}.webp`);
			expect(image.attr('width')).to.equal('544');
			expect(image.attr('height')).to.equal('184');
		});

		it('built the optimized image', () => {
			verifyImage(`/googlelogo_color_272x92dp_${HASH}.webp`, {
				width: 544,
				height: 184,
				type: 'webp',
			});
		});

		it('removes query strings', () => {
			verifyImage(`/googlelogo_color_272x92dp_${HASH_WITH_QUERY}.webp`, {
				width: 544,
				height: 184,
				type: 'webp',
			});
		});
	});

	describe('/public images', () => {
		it('includes <img> attributes', () => {
			const image = $('#hero');

			expect(image.attr('src')).to.equal('/docs/hero_Z2k1JGN.webp');
			expect(image.attr('width')).to.equal('768');
			expect(image.attr('height')).to.equal('414');
		});

		it('built the optimized image', () => {
			verifyImage('hero_Z2k1JGN.webp', { width: 768, height: 414, type: 'webp' });
		});
	});
});
