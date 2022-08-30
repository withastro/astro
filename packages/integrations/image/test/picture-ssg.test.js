import { expect } from 'chai';
import * as cheerio from 'cheerio';
import fs from 'fs';
import sizeOf from 'image-size';
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

	describe('Local images', () => {
		it('includes sources', () => {
			const sources = $('#social-jpg source');

			expect(sources.length).to.equal(3);

			// TODO: better coverage to verify source props
		});

		it('includes <img> attributes', () => {
			const image = $('#social-jpg img');

			const src = image.attr('src');
			const [route, params] = src.split('?');

			expect(route).to.equal('/@astroimage/assets/social.jpg');

			const searchParams = new URLSearchParams(params);

			expect(searchParams.get('f')).to.equal('jpg');
			expect(searchParams.get('w')).to.equal('506');
			expect(searchParams.get('h')).to.equal('253');
			expect(image.attr('alt')).to.equal('Social image');
		});
	});

	describe('Local images with inline imports', () => {
		it('includes sources', () => {
			const sources = $('#inline source');

			expect(sources.length).to.equal(3);

			// TODO: better coverage to verify source props
		});

		it('includes <img> attributes', () => {
			const image = $('#inline img');

			const src = image.attr('src');
			const [route, params] = src.split('?');

			expect(route).to.equal('/@astroimage/assets/social.jpg');

			const searchParams = new URLSearchParams(params);

			expect(searchParams.get('f')).to.equal('jpg');
			expect(searchParams.get('w')).to.equal('506');
			expect(searchParams.get('h')).to.equal('253');
			expect(image.attr('alt')).to.equal('Inline social image');
		});
	});

	describe('Remote images', () => {
		it('includes sources', () => {
			const sources = $('#google source');

			expect(sources.length).to.equal(3);

			// TODO: better coverage to verify source props
		});

		it('includes <img> attributes', () => {
			const image = $('#google img');

			const src = image.attr('src');
			const [route, params] = src.split('?');

			expect(route).to.equal('/_image');

			const searchParams = new URLSearchParams(params);

			expect(searchParams.get('f')).to.equal('png');
			expect(searchParams.get('w')).to.equal('544');
			expect(searchParams.get('h')).to.equal('184');
			expect(searchParams.get('href')).to.equal(
				'https://www.google.com/images/branding/googlelogo/2x/googlelogo_color_272x92dp.png'
			);
			expect(image.attr('alt')).to.equal('Google logo');
		});
	});

	describe('/public images', () => {
		it('includes sources', () => {
			const sources = $('#hero source');

			expect(sources.length).to.equal(3);

			// TODO: better coverage to verify source props
		});

		it('includes <img> attributes', () => {
			const image = $('#hero img');

			const src = image.attr('src');
			const [route, params] = src.split('?');

			expect(route).to.equal('/_image');

			const searchParams = new URLSearchParams(params);

			expect(searchParams.get('f')).to.equal('jpg');
			expect(searchParams.get('w')).to.equal('768');
			expect(searchParams.get('h')).to.equal('414');
			expect(image.attr('alt')).to.equal('Hero image');
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

	describe('Local images', () => {
		it('includes sources', () => {
			const sources = $('#social-jpg source');

			expect(sources.length).to.equal(3);

			// TODO: better coverage to verify source props
		});

		it('includes <img> attributes', () => {
			const image = $('#social-jpg img');

			const src = image.attr('src');
			const [route, params] = src.split('?');

			expect(route).to.equal('/@astroimage/assets/social.jpg');

			const searchParams = new URLSearchParams(params);

			expect(searchParams.get('f')).to.equal('jpg');
			expect(searchParams.get('w')).to.equal('506');
			expect(searchParams.get('h')).to.equal('253');
			expect(image.attr('alt')).to.equal('Social image');
		});
	});

	describe('Local images with inline imports', () => {
		it('includes sources', () => {
			const sources = $('#inline source');

			expect(sources.length).to.equal(3);

			// TODO: better coverage to verify source props
		});

		it('includes <img> attributes', () => {
			const image = $('#inline img');

			const src = image.attr('src');
			const [route, params] = src.split('?');

			expect(route).to.equal('/@astroimage/assets/social.jpg');

			const searchParams = new URLSearchParams(params);

			expect(searchParams.get('f')).to.equal('jpg');
			expect(searchParams.get('w')).to.equal('506');
			expect(searchParams.get('h')).to.equal('253');
			expect(image.attr('alt')).to.equal('Inline social image');
		});
	});

	describe('Remote images', () => {
		it('includes sources', () => {
			const sources = $('#google source');

			expect(sources.length).to.equal(3);

			// TODO: better coverage to verify source props
		});

		it('includes <img> attributes', () => {
			const image = $('#google img');

			const src = image.attr('src');
			const [route, params] = src.split('?');

			expect(route).to.equal('/_image');

			const searchParams = new URLSearchParams(params);

			expect(searchParams.get('f')).to.equal('png');
			expect(searchParams.get('w')).to.equal('544');
			expect(searchParams.get('h')).to.equal('184');
			expect(searchParams.get('href')).to.equal(
				'https://www.google.com/images/branding/googlelogo/2x/googlelogo_color_272x92dp.png'
			);
			expect(image.attr('alt')).to.equal('Google logo');
		});
	});

	describe('/public images', () => {
		it('includes sources', () => {
			const sources = $('#hero source');

			expect(sources.length).to.equal(3);

			// TODO: better coverage to verify source props
		});

		it('includes <img> attributes', () => {
			const image = $('#hero img');

			const src = image.attr('src');
			const [route, params] = src.split('?');

			expect(route).to.equal('/_image');

			const searchParams = new URLSearchParams(params);

			expect(searchParams.get('f')).to.equal('jpg');
			expect(searchParams.get('w')).to.equal('768');
			expect(searchParams.get('h')).to.equal('414');
			expect(image.attr('alt')).to.equal('Hero image');
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

	describe('Local images', () => {
		it('includes sources', () => {
			const sources = $('#social-jpg source');

			expect(sources.length).to.equal(3);

			// TODO: better coverage to verify source props
		});

		it('includes <img> attributes', () => {
			const image = $('#social-jpg img');

			expect(image.attr('src')).to.equal('/social.cece8c77_isw36.jpg');
			expect(image.attr('width')).to.equal('506');
			expect(image.attr('height')).to.equal('253');
			expect(image.attr('alt')).to.equal('Social image');
		});

		it('built the optimized image', () => {
			verifyImage('social.cece8c77_Z1qCkLW.avif', { width: 253, height: 127, type: 'avif' });
			verifyImage('social.cece8c77_ZHhvOb.webp', { width: 253, height: 127, type: 'webp' });
			verifyImage('social.cece8c77_ZwfMjf.jpg', { width: 253, height: 127, type: 'jpg' });
			verifyImage('social.cece8c77_6t5Xo.avif', { width: 506, height: 253, type: 'avif' });
			verifyImage('social.cece8c77_ONTVa.webp', { width: 506, height: 253, type: 'webp' });
			verifyImage('social.cece8c77_isw36.jpg', { width: 506, height: 253, type: 'jpg' });
		});
	});

	describe('Inline imports', () => {
		it('includes sources', () => {
			const sources = $('#inline source');

			expect(sources.length).to.equal(3);

			// TODO: better coverage to verify source props
		});

		it('includes <img> attributes', () => {
			const image = $('#inline img');

			expect(image.attr('src')).to.equal('/social.cece8c77_isw36.jpg');
			expect(image.attr('width')).to.equal('506');
			expect(image.attr('height')).to.equal('253');
			expect(image.attr('alt')).to.equal('Inline social image');
		});

		it('built the optimized image', () => {
			verifyImage('social.cece8c77_Z1qCkLW.avif', { width: 253, height: 127, type: 'avif' });
			verifyImage('social.cece8c77_ZHhvOb.webp', { width: 253, height: 127, type: 'webp' });
			verifyImage('social.cece8c77_ZwfMjf.jpg', { width: 253, height: 127, type: 'jpg' });
			verifyImage('social.cece8c77_6t5Xo.avif', { width: 506, height: 253, type: 'avif' });
			verifyImage('social.cece8c77_ONTVa.webp', { width: 506, height: 253, type: 'webp' });
			verifyImage('social.cece8c77_isw36.jpg', { width: 506, height: 253, type: 'jpg' });
		});
	});

	describe('Remote images', () => {
		// Hard-coding in the test! This should never change since the hash is based
		// on the static `src` string
		const HASH = 'ZWW1pg';

		it('includes sources', () => {
			const sources = $('#google source');

			expect(sources.length).to.equal(3);

			// TODO: better coverage to verify source props
		});

		it('includes <img> attributes', () => {
			const image = $('#google img');

			expect(image.attr('src')).to.equal(`/googlelogo_color_272x92dp_${HASH}.png`);
			expect(image.attr('width')).to.equal('544');
			expect(image.attr('height')).to.equal('184');
			expect(image.attr('alt')).to.equal('Google logo');
		});

		it('built the optimized image', () => {
			verifyImage(`googlelogo_color_272x92dp_1YsbPJ.avif`, {
				width: 272,
				height: 92,
				type: 'avif',
			});
			verifyImage(`googlelogo_color_272x92dp_1OJIxd.webp`, {
				width: 272,
				height: 92,
				type: 'webp',
			});
			verifyImage(`googlelogo_color_272x92dp_ZaELrV.png`, {
				width: 272,
				height: 92,
				type: 'png',
			});
			verifyImage(`googlelogo_color_272x92dp_I7OBe.avif`, {
				width: 544,
				height: 184,
				type: 'avif',
			});
			verifyImage(`googlelogo_color_272x92dp_ReA0T.webp`, {
				width: 544,
				height: 184,
				type: 'webp',
			});
			verifyImage(`googlelogo_color_272x92dp_ZWW1pg.png`, {
				width: 544,
				height: 184,
				type: 'png',
			});
		});
	});

	describe('/public images', () => {
		it('includes sources', () => {
			const sources = $('#hero source');

			expect(sources.length).to.equal(3);

			// TODO: better coverage to verify source props
		});

		it('includes <img> attributes', () => {
			const image = $('#hero img');

			expect(image.attr('src')).to.equal('/hero_1ql1f0.jpg');
			expect(image.attr('width')).to.equal('768');
			expect(image.attr('height')).to.equal('414');
			expect(image.attr('alt')).to.equal('Hero image');
		});

		it('built the optimized image', () => {
			verifyImage('hero_ZOXU0F.avif', { width: 384, height: 207, type: 'avif' });
			verifyImage('hero_ZFR9B0.webp', { width: 384, height: 207, type: 'webp' });
			verifyImage('hero_Z1rYjFx.jpg', { width: 384, height: 207, type: 'jpg' });
			verifyImage('hero_Z1kkIMd.avif', { width: 768, height: 414, type: 'avif' });
			verifyImage('hero_Z1bdXnx.webp', { width: 768, height: 414, type: 'webp' });
			verifyImage('hero_Z1Wl8s5.jpg', { width: 768, height: 414, type: 'jpg' });
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

	describe('Local images', () => {
		it('includes sources', () => {
			const sources = $('#social-jpg source');

			expect(sources.length).to.equal(3);

			// TODO: better coverage to verify source props
		});

		it('includes <img> attributes', () => {
			const image = $('#social-jpg img');

			expect(image.attr('src')).to.equal('/docs/social.cece8c77_VWX3S.jpg');
			expect(image.attr('width')).to.equal('506');
			expect(image.attr('height')).to.equal('253');
			expect(image.attr('alt')).to.equal('Social image');
		});

		it('built the optimized image', () => {
			verifyImage('social.cece8c77_2wbTqo.avif', { width: 253, height: 127, type: 'avif' });
			verifyImage('social.cece8c77_Z1OEppL.webp', { width: 253, height: 127, type: 'webp' });
			verifyImage('social.cece8c77_Z1xuFVD.jpg', { width: 253, height: 127, type: 'jpg' });
			verifyImage('social.cece8c77_Z10SMCc.avif', { width: 506, height: 253, type: 'avif' });
			verifyImage('social.cece8c77_ZhxXEq.webp', { width: 506, height: 253, type: 'webp' });
			verifyImage('social.cece8c77_Z1ks7l5.jpg', { width: 506, height: 253, type: 'jpg' });
		});
	});

	describe('Inline imports', () => {
		it('includes sources', () => {
			const sources = $('#inline source');

			expect(sources.length).to.equal(3);

			// TODO: better coverage to verify source props
		});

		it('includes <img> attributes', () => {
			const image = $('#inline img');

			expect(image.attr('src')).to.equal('/docs/social.cece8c77_VWX3S.jpg');
			expect(image.attr('width')).to.equal('506');
			expect(image.attr('height')).to.equal('253');
			expect(image.attr('alt')).to.equal('Inline social image');
		});

		it('built the optimized image', () => {
			verifyImage('social.cece8c77_2wbTqo.avif', { width: 253, height: 127, type: 'avif' });
			verifyImage('social.cece8c77_Z1OEppL.webp', { width: 253, height: 127, type: 'webp' });
			verifyImage('social.cece8c77_Z1xuFVD.jpg', { width: 253, height: 127, type: 'jpg' });
			verifyImage('social.cece8c77_Z10SMCc.avif', { width: 506, height: 253, type: 'avif' });
			verifyImage('social.cece8c77_ZhxXEq.webp', { width: 506, height: 253, type: 'webp' });
			verifyImage('social.cece8c77_Z1ks7l5.jpg', { width: 506, height: 253, type: 'jpg' });
		});
	});

	describe('Remote images', () => {
		// Hard-coding in the test! This should never change since the hash is based
		// on the static `src` string
		const HASH = 'ZWW1pg';

		it('includes sources', () => {
			const sources = $('#google source');

			expect(sources.length).to.equal(3);

			// TODO: better coverage to verify source props
		});

		it('includes <img> attributes', () => {
			const image = $('#google img');

			expect(image.attr('src')).to.equal(`/docs/googlelogo_color_272x92dp_${HASH}.png`);
			expect(image.attr('width')).to.equal('544');
			expect(image.attr('height')).to.equal('184');
			expect(image.attr('alt')).to.equal('Google logo');
		});

		it('built the optimized image', () => {
			verifyImage(`googlelogo_color_272x92dp_1YsbPJ.avif`, {
				width: 272,
				height: 92,
				type: 'avif',
			});
			verifyImage(`googlelogo_color_272x92dp_1OJIxd.webp`, {
				width: 272,
				height: 92,
				type: 'webp',
			});
			verifyImage(`googlelogo_color_272x92dp_ZaELrV.png`, {
				width: 272,
				height: 92,
				type: 'png',
			});
			verifyImage(`googlelogo_color_272x92dp_I7OBe.avif`, {
				width: 544,
				height: 184,
				type: 'avif',
			});
			verifyImage(`googlelogo_color_272x92dp_ReA0T.webp`, {
				width: 544,
				height: 184,
				type: 'webp',
			});
			verifyImage(`googlelogo_color_272x92dp_ZWW1pg.png`, {
				width: 544,
				height: 184,
				type: 'png',
			});
		});
	});

	describe('/public images', () => {
		it('includes sources', () => {
			const sources = $('#hero source');

			expect(sources.length).to.equal(3);

			// TODO: better coverage to verify source props
		});

		it('includes <img> attributes', () => {
			const image = $('#hero img');

			expect(image.attr('src')).to.equal('/docs/hero_1ql1f0.jpg');
			expect(image.attr('width')).to.equal('768');
			expect(image.attr('height')).to.equal('414');
			expect(image.attr('alt')).to.equal('Hero image');
		});

		it('built the optimized image', () => {
			verifyImage('hero_ZOXU0F.avif', { width: 384, height: 207, type: 'avif' });
			verifyImage('hero_ZFR9B0.webp', { width: 384, height: 207, type: 'webp' });
			verifyImage('hero_Z1rYjFx.jpg', { width: 384, height: 207, type: 'jpg' });
			verifyImage('hero_Z1kkIMd.avif', { width: 768, height: 414, type: 'avif' });
			verifyImage('hero_Z1bdXnx.webp', { width: 768, height: 414, type: 'webp' });
			verifyImage('hero_Z1Wl8s5.jpg', { width: 768, height: 414, type: 'jpg' });
		});
	});
});
