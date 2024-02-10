import assert from 'node:assert/strict';
import { describe, before, it } from 'node:test';
import * as cheerio from 'cheerio';
import { loadFixture } from './test-utils.js';

describe('Class List', async () => {
	let fixture;

	before(async () => {
		fixture = await loadFixture({ root: './fixtures/astro-class-list/' });
		await fixture.build();
	});

	it('Passes class:list attributes as expected to elements', async () => {
		const html = await fixture.readFile('/index.html');
		const $ = cheerio.load(html);

		assert.strictEqual($('[class="test control"]').length, 1, '[class="test control"]');
		assert.strictEqual($('[class="test expression"]').length, 1, '[class="test expression"]');
		assert.strictEqual($('[class="test true"]').length, 1, '[class="test true"]');
		assert.strictEqual($('[class="test truthy"]').length, 1, '[class="test truthy"]');
		assert.strictEqual($('[class="test set"]').length, 1, '[class="test set"]');
		assert.strictEqual(
			$('[class="hello goodbye hello world hello friend"]').length,
			1,
			'[class="hello goodbye hello world hello friend"]'
		);
		assert.strictEqual($('[class="foo baz"]').length, 1, '[class="foo baz"]');
		assert.strictEqual($('span:not([class])').length, 1, 'span:not([class])');

		assert.strictEqual($('.false, .noshow1, .noshow2, .noshow3, .noshow4').length, 0);
	});

	it('Passes class:list attributes as expected to components', async () => {
		const html = await fixture.readFile('/component/index.html');
		const $ = cheerio.load(html);

		assert.strictEqual($('[class="test control"]').length, 1, '[class="test control"]');
		assert.strictEqual($('[class="test expression"]').length, 1, '[class="test expression"]');
		assert.strictEqual($('[class="test true"]').length, 1, '[class="test true"]');
		assert.strictEqual($('[class="test truthy"]').length, 1, '[class="test truthy"]');
		assert.strictEqual($('[class="test set"]').length, 1, '[class="test set"]');
		assert.strictEqual(
			$('[class="hello goodbye hello world hello friend"]').length,
			1,
			'[class="hello goodbye hello world hello friend"]'
		);
		assert.strictEqual($('[class="foo baz"]').length, 1, '[class="foo baz"]');
		assert.strictEqual($('span:not([class])').length, 1, 'span:not([class])');

		assert.strictEqual($('[class="test control"]').text(), 'test control');
		assert.strictEqual($('[class="test expression"]').text(), 'test expression');
		assert.strictEqual($('[class="test true"]').text(), 'test true');
		assert.strictEqual($('[class="test truthy"]').text(), 'test truthy');
		assert.strictEqual($('[class="test set"]').text(), 'test set');
		assert.strictEqual(
			$('[class="hello goodbye hello world hello friend"]').text(),
			'hello goodbye hello world hello friend'
		);
		assert.strictEqual($('[class="foo baz"]').text(), 'foo baz');
		assert.strictEqual($('span:not([class])').text(), '');
	});
});
