import assert from 'node:assert/strict';
import { before, describe, it } from 'node:test';
import * as cheerio from 'cheerio';
import srcsetParse from 'srcset-parse';
import { loadFixture } from './test-utils.js';

// This package isn't real ESM, so have to coerce it
const matchSrcset = srcsetParse.default;

// Asset bundling
describe('Assets', () => {
	let fixture;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/astro-assets/',
		});
		await fixture.build();
	});

	it('built the base image', async () => {
		const html = await fixture.readFile('/index.html');
		const $ = cheerio.load(html);
		const imgPath = $('img').attr('src');
		const data = await fixture.readFile(imgPath);
		assert.equal(!!data, true);
	});

	it('built the 2x image', async () => {
		const html = await fixture.readFile('/index.html');
		const $ = cheerio.load(html);
		const srcset = $('img').attr('srcset');
		const candidates = matchSrcset(srcset);
		const match = candidates.find((a) => a.density === 2);
		const data = await fixture.readFile(match.url);
		assert.equal(!!data, true);
	});

	it('built the 3x image', async () => {
		const html = await fixture.readFile('/index.html');
		const $ = cheerio.load(html);
		const srcset = $('img').attr('srcset');
		const candidates = matchSrcset(srcset);
		const match = candidates.find((a) => a.density === 3);
		const data = await fixture.readFile(match.url);
		assert.equal(!!data, true);
	});

	it('built image from an import specifier', async () => {
		const html = await fixture.readFile('/index.html');
		const $ = cheerio.load(html);
		const src = $('#import-no-url').attr('src');
		const data = await fixture.readFile(src);
		assert.equal(!!data, true);
	});

	it('built image from an import specifier using ?url', async () => {
		const html = await fixture.readFile('/index.html');
		const $ = cheerio.load(html);
		const src = $('#import-url').attr('src');
		const data = await fixture.readFile(src);
		assert.equal(!!data, true);
	});
});
