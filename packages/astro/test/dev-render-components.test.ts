import * as assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import * as cheerio from 'cheerio';
import { type DevServer, type Fixture, loadFixture } from './test-utils.ts';

describe('core/render components', () => {
	let fixture: Fixture;
	let devServer: DevServer;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/dev-render/',
			logLevel: 'silent',
		});
		devServer = await fixture.startDevServer();
	});

	after(async () => {
		await devServer.stop();
	});

	it('should sanitize dynamic tags', async () => {
		const res = await fixture.fetch('/');
		const html = await res.text();
		const $ = cheerio.load(html);
		const target = $('#target');

		assert.ok(target);
		assert.equal(target.attr('id'), 'target');
		assert.equal(typeof target.attr('style'), 'undefined');
		assert.equal($('#pwnd').length, 0);
	});

	it('should merge `class` and `class:list`', async () => {
		const res = await fixture.fetch('/class-merge');
		const html = await res.text();
		const $ = cheerio.load(html);

		const check = (name: string) => JSON.parse($(name).text() || '{}');

		const Class = check('#class');
		const ClassList = check('#class-list');
		const BothLiteral = check('#both-literal');
		const BothFlipped = check('#both-flipped');
		const BothSpread = check('#both-spread');

		assert.deepEqual(Class, { class: 'red blue' }, '#class');
		assert.deepEqual(ClassList, { class: 'red blue' }, '#class-list');
		assert.deepEqual(BothLiteral, { class: 'red blue' }, '#both-literal');
		assert.deepEqual(BothFlipped, { class: 'red blue' }, '#both-flipped');
		assert.deepEqual(BothSpread, { class: 'red blue' }, '#both-spread');
	});

	it('should render component with `null` response', async () => {
		const res = await fixture.fetch('/null-component');
		const html = await res.text();
		const $ = cheerio.load(html);

		assert.equal($('body').text().trim(), '');
		assert.equal(res.status, 200);
	});

	it('should render custom element attributes as strings instead of boolean attributes', async () => {
		const res = await fixture.fetch('/custom-elements');
		const html = await res.text();

		const hasSelectedBlue = html.includes('selected="blue"');
		const hasAutoplay2000 = html.includes('autoplay="2000"');
		const hasBooleanSelected = html.includes('<color-picker selected>');
		const hasBooleanAutoplay = html.includes('<test-a autoplay>');

		assert.ok(hasSelectedBlue, 'selected="blue"');
		assert.ok(hasAutoplay2000, 'autoplay="2000"');
		assert.ok(!hasBooleanSelected, 'no boolean selected');
		assert.ok(!hasBooleanAutoplay, 'no boolean autoplay');
	});
});
