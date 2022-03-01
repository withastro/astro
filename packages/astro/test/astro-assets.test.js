import { expect } from 'chai';
import cheerio from 'cheerio';
import { loadFixture } from './test-utils.js';
import srcsetParse from 'srcset-parse';

// This package isn't real ESM, so have to coerce it
const matchSrcset = srcsetParse.default;

// Asset bundling
describe('Assets', () => {
	let fixture;

	before(async () => {
		fixture = await loadFixture({
			projectRoot: './fixtures/astro-assets/',
			vite: {
				build: {
					assetsInlineLimit: 0
				}
			}
		});
		await fixture.build();
	});

	it('built the base image', async () => {
		const html = await fixture.readFile('/index.html');
		const $ = cheerio.load(html);
		const imgPath = $('img').attr('src');
		const data = await fixture.readFile( imgPath);
		expect(!!data).to.equal(true);
	});

	it('built the 2x image', async () => {
		const html = await fixture.readFile('/index.html');
		const $ = cheerio.load(html);
		const srcset = $('img').attr('srcset');
		const candidates = matchSrcset(srcset);
		const match = candidates.find((a) => a.density === 2);
		const data = await fixture.readFile(match.url);
		expect(!!data).to.equal(true);
	});

	it('built the 3x image', async () => {
		const html = await fixture.readFile('/index.html');
		const $ = cheerio.load(html);
		const srcset = $('img').attr('srcset');
		const candidates = matchSrcset(srcset);
		const match = candidates.find((a) => a.density === 3);
		const data = await fixture.readFile(match.url);
		expect(!!data).to.equal(true);
	});

	it('built image from an import specifier', async () => {
		const html = await fixture.readFile('/index.html');
		const $ = cheerio.load(html);
		const src = $('#import-no-url').attr('src');
		const data = await fixture.readFile(src);
		expect(!!data).to.equal(true);
	});

	it('built image from an import specifier using ?url', async () => {
		const html = await fixture.readFile('/index.html');
		const $ = cheerio.load(html);
		const src = $('#import-url').attr('src');
		const data = await fixture.readFile(src);
		expect(!!data).to.equal(true);
	});
});
