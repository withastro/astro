import assert from 'node:assert/strict';
import { before, describe, it } from 'node:test';
import * as cheerio from 'cheerio';
import { type Fixture, loadFixture } from './test-utils.ts';

describe('Duplicate named slots with expressions', () => {
	let fixture: Fixture;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/astro-duplicate-slots/',
			outDir: './dist/astro-duplicate-slots/',
		});
		await fixture.build();
	});

	it('renders multiple plain elements into the same named slot', async () => {
		const html = await fixture.readFile('/index.html');
		const $ = cheerio.load(html);
		const section = $('#plain section');
		assert.equal(section.find('div').length, 2);
		assert.equal(section.find('div').eq(0).text(), 'foo');
		assert.equal(section.find('div').eq(1).text(), 'bar');
	});

	it('renders multiple expression-wrapped elements into the same named slot', async () => {
		const html = await fixture.readFile('/index.html');
		const $ = cheerio.load(html);
		const section = $('#expression section');
		assert.equal(section.find('div').length, 2, 'both divs should render');
		assert.equal(section.find('div').eq(0).text(), 'foo');
		assert.equal(section.find('div').eq(1).text(), 'bar');
	});

	it('renders three expression-wrapped elements into the same named slot', async () => {
		const html = await fixture.readFile('/index.html');
		const $ = cheerio.load(html);
		const section = $('#three section');
		assert.equal(section.find('div').length, 3, 'all three divs should render');
		assert.equal(section.find('div').eq(0).text(), 'one');
		assert.equal(section.find('div').eq(1).text(), 'two');
		assert.equal(section.find('div').eq(2).text(), 'three');
	});

	it('respects falsy conditions in expression-wrapped slot elements', async () => {
		const html = await fixture.readFile('/index.html');
		const $ = cheerio.load(html);
		const section = $('#conditional section');
		assert.equal(section.find('div').length, 1, 'only truthy element should render');
		assert.equal(section.find('div').eq(0).text(), 'visible');
	});
});
