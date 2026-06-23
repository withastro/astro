import assert from 'node:assert/strict';
import { before, describe, it } from 'node:test';
import { load as cheerioLoad } from 'cheerio';
import { loadFixture, type Fixture } from './test-utils.ts';

describe('Solid island signals', () => {
	let fixture: Fixture;
	before(async () => {
		fixture = await loadFixture({
			root: new URL('./fixtures/signals/', import.meta.url),
		});
		await fixture.build();
	});

	it('Can use shared signals between islands', async () => {
		const html = await fixture.readFile('/index.html');
		const $ = cheerioLoad(html);
		assert.equal($('.solid-signal').length, 2);

		const sigs1Raw = $($('astro-island')[0]).attr('data-solid-signals')!;
		const sigs2Raw = $($('astro-island')[1]).attr('data-solid-signals')!;

		assert.notEqual(sigs1Raw, undefined);
		assert.notEqual(sigs2Raw, undefined);

		const sigs1 = JSON.parse(sigs1Raw);
		const sigs2 = JSON.parse(sigs2Raw);

		assert.notEqual(sigs1.count, undefined);
		assert.equal(sigs1.count, sigs2.count);
	});

	it('Can use signals in array', async () => {
		const html = await fixture.readFile('/index.html');
		const $ = cheerioLoad(html);
		const element = $('.solid-signal-array');
		assert.equal(element.length, 1);

		const sigs1Raw = $($('astro-island')[2]).attr('data-solid-signals')!;

		const sigs1 = JSON.parse(sigs1Raw);

		assert.deepEqual(sigs1, {
			signalsArray: [
				['sg0', 1],
				['sg0', 2],
				['sg1', 4],
			],
		});

		assert.equal(element.find('h1').text(), "I'm not a signal 12345");
		assert.equal(element.find('p').text(), '1-1-2');
	});

	it('Can use signals in object', async () => {
		const html = await fixture.readFile('/index.html');
		const $ = cheerioLoad(html);
		const element = $('.solid-signal-object');
		assert.equal(element.length, 1);

		const sigs1Raw = $($('astro-island')[3]).attr('data-solid-signals')!;

		const sigs1 = JSON.parse(sigs1Raw);

		assert.deepEqual(sigs1, {
			signalsObject: [['sg0', 'counter']],
		});

		assert.equal(element.find('h1').text(), 'I am a title');
		assert.equal(element.find('p').text(), '1');
	});
});
