import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import * as cheerio from 'cheerio';
import { fixture } from './preludes/standard-static.prelude.ts';

describe('Slots', () => {
	it('Basic named slots work', async () => {
		const html = await fixture.readFile('/slots/index.html');
		const $ = cheerio.load(html);

		assert.equal($('#a').text().trim(), 'A');
		assert.equal($('#b').text().trim(), 'B');
		assert.equal($('#c').text().trim(), 'C');
		assert.equal($('#default').text().trim(), 'Default');
	});

	it('Dynamic named slots work', async () => {
		const html = await fixture.readFile('/slots/dynamic/index.html');
		const $ = cheerio.load(html);

		assert.equal($('#a').text().trim(), 'A');
		assert.equal($('#b').text().trim(), 'B');
		assert.equal($('#c').text().trim(), 'C');
		assert.equal($('#default').text().trim(), 'Default');
	});

	it('Conditional named slots work', async () => {
		const html = await fixture.readFile('/slots/conditional/index.html');
		const $ = cheerio.load(html);

		assert.equal($('#a').text().trim(), 'A');
		assert.equal($('#b').text().trim(), 'B');
		assert.equal($('#c').text().trim(), 'C');
		assert.equal($('#default').text().trim(), 'Default');
	});

	it('Slots of a component render fallback content by default', async () => {
		const html = await fixture.readFile('/slots/fallback/index.html');
		const $ = cheerio.load(html);

		assert.equal($('#default').length, 1);
	});

	it('Slots of a page render fallback content', async () => {
		const html = await fixture.readFile('/slots/fallback-own/index.html');
		const $ = cheerio.load(html);

		assert.equal($('#default').length, 1);
	});

	it('Slots override fallback content', async () => {
		const html = await fixture.readFile('/slots/fallback-override/index.html');
		const $ = cheerio.load(html);

		assert.equal($('#override').length, 1);
		assert.equal($('#fallback-2').text(), 'Slotty slot.');
	});

	it('Slots work with multiple elements', async () => {
		const html = await fixture.readFile('/slots/multiple/index.html');
		const $ = cheerio.load(html);

		assert.equal($('#a').text().trim(), 'ABC');
	});

	it('Slots work on Components', async () => {
		const html = await fixture.readFile('/slots/component/index.html');
		const $ = cheerio.load(html);

		// test 1: #a renders
		assert.equal($('#a').length, 1);

		// test 2: Slotted component into #a
		assert.equal($('#a').children('astro-component').length, 1);
		// test 3: Slotted component into default slot
		assert.equal($('#default').children('astro-component').length, 1);
	});

	describe('Slots API work on Components', () => {
		it('IDs will exist whether the slots are filled or not', async () => {
			const html = await fixture.readFile('/slots/slottedapi-default/index.html');
			const $ = cheerio.load(html);

			assert.equal($('#a').length, 1);
			assert.equal($('#b').length, 1);
			assert.equal($('#c').length, 1);
			assert.equal($('#default').length, 1);
		});

		it('IDs will not exist because the slots are not filled', async () => {
			const html = await fixture.readFile('/slots/slottedapi-empty/index.html');
			const $ = cheerio.load(html);

			assert.equal($('#a').length, 0);
			assert.equal($('#b').length, 0);
			assert.equal($('#c').length, 0);
			assert.equal($('#default').length, 0);
		});

		it('IDs will exist because the slots are filled', async () => {
			const html = await fixture.readFile('/slots/slottedapi-filled/index.html');
			const $ = cheerio.load(html);

			assert.equal($('#a').length, 1);
			assert.equal($('#b').length, 1);
			assert.equal($('#c').length, 1);

			assert.equal($('#default').length, 0); // the default slot is not filled
		});

		it('Default ID will exist because the default slot is filled', async () => {
			const html = await fixture.readFile('/slots/slottedapi-default-filled/index.html');
			const $ = cheerio.load(html);

			assert.equal($('#a').length, 0);
			assert.equal($('#b').length, 0);
			assert.equal($('#c').length, 0);

			assert.equal($('#default').length, 1); // the default slot is not filled
		});
	});

	it('Slots.render() API', async () => {
		// Simple imperative slot render
		{
			const html = await fixture.readFile('/slots/slottedapi-render/index.html');
			const $ = cheerio.load(html);

			assert.equal($('#render').length, 1);
			assert.equal($('#render').text(), 'render');
		}

		// Child function render without args
		{
			const html = await fixture.readFile('/slots/slottedapi-render/index.html');
			const $ = cheerio.load(html);

			assert.equal($('#render-fn').length, 1);
			assert.equal($('#render-fn').text(), 'render-fn');
		}

		// Child function render with args
		{
			const html = await fixture.readFile('/slots/slottedapi-render/index.html');
			const $ = cheerio.load(html);

			assert.equal($('#render-args').length, 1);
			assert.equal($('#render-args span').length, 1);
			assert.equal($('#render-args').text(), 'render-args');
		}

		{
			const html = await fixture.readFile('/slots/rendered-multiple-times/index.html');
			const $ = cheerio.load(html);

			const elements = $('div');
			assert.equal(elements.length, 10);

			const first = elements.eq(0);
			const second = elements.eq(1);
			const third = elements.eq(2);

			assert.notEqual(first.text(), second.text());
			assert.notEqual(second.text(), third.text());
			assert.notEqual(third.text(), first.text());
		}
	});

	it('Arguments can be passed to named slots with Astro.slots.render()', async () => {
		const html = await fixture.readFile('/slots/slotted-named-functions/index.html');
		const $ = cheerio.load(html);
		const beforeDiv = $('div#before > div');
		assert.deepEqual(beforeDiv.text(), 'Test Content BEFORE');
		const afterDiv = $('div#after > div');
		assert.deepEqual(afterDiv.text(), 'Test Content AFTER');
	});

	it('Arguments can be passed to conditional named slots with Astro.slots.render()', async () => {
		const html = await fixture.readFile('/slots/conditional-slotted-callback/index.html');
		const $ = cheerio.load(html);

		assert.equal($('#conditional-block').text(), 'Block: block');
	});

	it('Unused slot builds without error', async () => {
		const html = await fixture.readFile('/slots/unused-slot/index.html');
		const $ = cheerio.load(html);
		// No children, slot rendered as empty
		assert.equal($('body p').children().length, 0);
	});
});
