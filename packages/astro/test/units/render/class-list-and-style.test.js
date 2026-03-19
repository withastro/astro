// @ts-check
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import * as cheerio from 'cheerio';
import { addAttribute } from '../../../dist/runtime/server/index.js';
import { toStyleString } from '../../../dist/runtime/server/render/util.js';
import { createTestApp, createPage, createMultiChildPage, spreadPropsSpan } from '../mocks.js';

describe('class:list', () => {
	it('handles a plain string', () => {
		const result = addAttribute('test expression', 'class:list');
		assert.equal(result.toString(), ' class="test expression"');
	});

	it('handles an array of strings', () => {
		const result = addAttribute(['test', 'set'], 'class:list');
		assert.equal(result.toString(), ' class="test set"');
	});

	it('handles an object with boolean values', () => {
		const result = addAttribute({ test: true, true: true, false: false }, 'class:list');
		assert.equal(result.toString(), ' class="test true"');
	});

	it('handles an object with truthy/falsy values', () => {
		const result = addAttribute(
			{ test: 1, truthy: '0', noshow1: 0, noshow2: '', noshow3: null, noshow4: undefined },
			'class:list',
		);
		assert.equal(result.toString(), ' class="test truthy"');
	});

	it('handles nested arrays and objects', () => {
		const result = addAttribute(
			['hello goodbye', { hello: true, world: true }, ['hello', 'friend']],
			'class:list',
		);
		assert.equal(result.toString(), ' class="hello goodbye hello world hello friend"');
	});

	it('handles conditional expressions in arrays', () => {
		const result = addAttribute(['foo', false && 'bar', true && 'baz'], 'class:list');
		assert.equal(result.toString(), ' class="foo baz"');
	});

	it('returns empty string when all values are falsy', () => {
		const result = addAttribute([false && 'empty'], 'class:list');
		assert.equal(result.toString(), '');
	});

	it('returns empty string for null', () => {
		const result = addAttribute(null, 'class:list');
		assert.equal(result.toString(), '');
	});

	it('returns empty string for undefined', () => {
		const result = addAttribute(undefined, 'class:list');
		assert.equal(result.toString(), '');
	});
});

describe('toStyleString', () => {
	it('converts camelCase to kebab-case', () => {
		assert.equal(toStyleString({ backgroundColor: 'green' }), 'background-color:green');
	});

	it('preserves CSS custom properties', () => {
		assert.equal(toStyleString({ '--my-var': 'red' }), '--my-var:red');
	});

	it('joins multiple properties with semicolons', () => {
		assert.equal(
			toStyleString({ backgroundColor: 'green', color: 'red' }),
			'background-color:green;color:red',
		);
	});

	it('handles numeric values', () => {
		assert.equal(toStyleString({ zIndex: 10 }), 'z-index:10');
	});

	it('handles zero as a value', () => {
		assert.equal(toStyleString({ margin: 0 }), 'margin:0');
	});

	it('filters out empty string values', () => {
		assert.equal(toStyleString({ color: '', background: 'red' }), 'background:red');
	});

	it('filters out whitespace-only string values', () => {
		assert.equal(toStyleString({ color: '  ', background: 'red' }), 'background:red');
	});

	it('filters out null/undefined/boolean values', () => {
		assert.equal(
			toStyleString({ color: null, background: undefined, display: false, margin: 'auto' }),
			'margin:auto',
		);
	});

	it('preserves quoted values', () => {
		assert.equal(toStyleString({ backgroundImage: 'url("a")' }), 'background-image:url("a")');
	});
});

describe('style object via addAttribute', () => {
	it('converts style object to attribute string', () => {
		const result = addAttribute({ backgroundColor: 'green' }, 'style');
		assert.equal(result.toString(), ' style="background-color:green"');
	});

	it('converts style object with multiple properties', () => {
		const result = addAttribute({ backgroundColor: 'blue', color: 'white' }, 'style');
		assert.equal(result.toString(), ' style="background-color:blue;color:white"');
	});

	it('handles url() with quotes in style object', () => {
		const result = addAttribute({ backgroundImage: 'url("a")' }, 'style');
		assert.equal(result.toString(), ' style="background-image:url(&#34;a&#34;)"');
	});

	it('passes through string style values unchanged', () => {
		const result = addAttribute('background-color:red', 'style');
		assert.equal(result.toString(), ' style="background-color:red"');
	});

	it('handles style array [object, string] syntax', () => {
		const result = addAttribute([{ color: 'red' }, 'font-size:16px'], 'style');
		assert.equal(result.toString(), ' style="color:red;font-size:16px"');
	});
});

describe('class:list forwarded to components', () => {
	it('forwards class:list values through component props', async () => {
		const page = createMultiChildPage(spreadPropsSpan, [
			{ class: 'test control' },
			{ 'class:list': 'test expression' },
			{ 'class:list': { test: true, true: true, false: false } },
			{
				'class:list': {
					test: 1,
					truthy: '0',
					noshow1: 0,
					noshow2: '',
					noshow3: null,
					noshow4: undefined,
				},
			},
			{ 'class:list': ['test', 'set'] },
			{ 'class:list': ['hello goodbye', { hello: true, world: true }, ['hello', 'friend']] },
			{ 'class:list': ['foo', false && 'bar', true && 'baz'] },
			{ 'class:list': [false && 'empty'] },
		]);
		const app = createTestApp([createPage(page, { route: '/test' })]);
		const response = await app.render(new Request('http://example.com/test'));
		const html = await response.text();
		const $ = cheerio.load(html);

		assert.equal($('[class="test control"]').length, 1);
		assert.equal($('[class="test expression"]').length, 1);
		assert.equal($('[class="test true"]').length, 1);
		assert.equal($('[class="test truthy"]').length, 1);
		assert.equal($('[class="test set"]').length, 1);
		assert.equal($('[class="hello goodbye hello world hello friend"]').length, 1);
		assert.equal($('[class="foo baz"]').length, 1);
		assert.equal($('span:not([class])').length, 1);

		assert.equal($('[class="test control"]').text(), 'test control');
		assert.equal($('[class="test expression"]').text(), 'test expression');
		assert.equal($('[class="test true"]').text(), 'test true');
		assert.equal($('[class="test truthy"]').text(), 'test truthy');
		assert.equal($('[class="test set"]').text(), 'test set');
		assert.equal(
			$('[class="hello goodbye hello world hello friend"]').text(),
			'hello goodbye hello world hello friend',
		);
		assert.equal($('[class="foo baz"]').text(), 'foo baz');
		assert.equal($('span:not([class])').text(), '');
	});
});

describe('style object forwarded to components', () => {
	it('forwards style values through component props', async () => {
		const page = createMultiChildPage(spreadPropsSpan, [
			{ style: 'background-color:green' },
			{ style: 'background-color:red' },
			{ style: { backgroundColor: 'blue' } },
			{ style: { backgroundImage: 'url("a")' } },
		]);
		const app = createTestApp([createPage(page, { route: '/test' })]);
		const response = await app.render(new Request('http://example.com/test'));
		const html = await response.text();
		const $ = cheerio.load(html);

		assert.equal($('[style="background-color:green"]').length, 1);
		assert.equal($('[style="background-color:red"]').length, 1);
		assert.equal($('[style="background-color:blue"]').length, 1);
		assert.equal($(`[style='background-image:url("a")']`).length, 1);
	});
});
