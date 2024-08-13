import assert from 'node:assert/strict';
import { before, describe, it } from 'node:test';
import * as cheerio from 'cheerio';
import { loadFixture } from './test-utils.js';

const hashDelimiterDefaultRegex = /_[a-zA-Z0-9]+\.[a-zA-Z0-9]{3,5}$/;
const hashDelimiterDashRegex = /-[a-zA-Z0-9]+\.[a-zA-Z0-9]{3,5}$/;

// Asset bundling
describe('Assets default hash delimiter', () => {
	let fixture;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/astro-assets-hash-delimiter-default/',
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

	it('check for default delimiter', async () => {
		const html = await fixture.readFile('/index.html');
		const $ = cheerio.load(html);
		const imgPath = $('img').attr('src');
		assert.match(imgPath, hashDelimiterDefaultRegex);
	});
});

describe('Assets dash hash delimiter', () => {
	let fixture;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/astro-assets-hash-delimiter-dash/',
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

	it('check for dash delimiter', async () => {
		const html = await fixture.readFile('/index.html');
		const $ = cheerio.load(html);
		const imgPath = $('img').attr('src');
		assert.match(imgPath, hashDelimiterDashRegex);
	});
});
