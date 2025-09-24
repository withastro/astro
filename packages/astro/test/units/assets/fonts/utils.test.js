// @ts-check
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
	isFontType,
	isGenericFontFamily,
	renderFontSrc,
	renderFontWeight,
	sortObjectByKey,
	unifontFontFaceDataToProperties,
} from '../../../../dist/assets/fonts/utils.js';

describe('fonts utils', () => {
	it('isFontType()', () => {
		assert.equal(isFontType('woff2'), true);
		assert.equal(isFontType('woff'), true);
		assert.equal(isFontType('otf'), true);
		assert.equal(isFontType('ttf'), true);
		assert.equal(isFontType('eot'), true);
		assert.equal(isFontType(''), false);
	});

	it('isGenericFontFamily()', () => {
		assert.equal(isGenericFontFamily('serif'), true);
		assert.equal(isGenericFontFamily('sans-serif'), true);
		assert.equal(isGenericFontFamily('monospace'), true);
		assert.equal(isGenericFontFamily('cursive'), true);
		assert.equal(isGenericFontFamily('fantasy'), true);
		assert.equal(isGenericFontFamily('system-ui'), true);
		assert.equal(isGenericFontFamily('ui-serif'), true);
		assert.equal(isGenericFontFamily('ui-sans-serif'), true);
		assert.equal(isGenericFontFamily('ui-monospace'), true);
		assert.equal(isGenericFontFamily('ui-rounded'), true);
		assert.equal(isGenericFontFamily('emoji'), true);
		assert.equal(isGenericFontFamily('math'), true);
		assert.equal(isGenericFontFamily('fangsong'), true);
		assert.equal(isGenericFontFamily(''), false);
	});

	describe('renderFontSrc()', () => {
		it('does not output tech(undefined) if key is present without value', () => {
			assert.equal(
				renderFontSrc([{ url: 'test', tech: undefined }]).includes('tech(undefined)'),
				false,
			);
		});

		it('wraps format in quotes', () => {
			assert.equal(
				renderFontSrc([{ url: 'test', format: 'woff2' }]).includes('format("woff2")'),
				true,
			);
		});

		it('does not wrap tech in quotes', () => {
			assert.equal(renderFontSrc([{ url: 'test', tech: 'x' }]).includes('tech(x)'), true);
		});

		it('returns local if it has a name', () => {
			assert.equal(renderFontSrc([{ name: 'Arial' }]), 'local("Arial")');
		});
	});

	it('renderFontWeight()', () => {
		assert.equal(renderFontWeight(undefined), undefined);
		assert.equal(renderFontWeight('400'), '400');
		assert.equal(renderFontWeight(400), '400');
		assert.equal(renderFontWeight([300, 500]), '300 500');
	});

	it('unifontFontFaceDataToProperties()', () => {
		assert.deepStrictEqual(
			unifontFontFaceDataToProperties({
				display: 'auto',
				unicodeRange: ['foo', 'bar'],
				weight: '400',
				style: 'normal',
				stretch: 'condensed',
				featureSettings: 'foo',
				variationSettings: 'bar',
			}),
			{
				src: undefined,
				'font-display': 'auto',
				'unicode-range': 'foo,bar',
				'font-weight': '400',
				'font-style': 'normal',
				'font-stretch': 'condensed',
				'font-feature-settings': 'foo',
				'font-variation-settings': 'bar',
			},
		);
		assert.deepStrictEqual(
			unifontFontFaceDataToProperties({
				unicodeRange: [],
			}),
			{
				src: undefined,
				'font-weight': undefined,
				'font-style': undefined,
				'font-stretch': undefined,
				'font-feature-settings': undefined,
				'font-variation-settings': undefined,
				'unicode-range': undefined,
				'font-display': 'swap',
			},
		);
		assert.deepStrictEqual(
			unifontFontFaceDataToProperties({
				unicodeRange: undefined,
			}),
			{
				src: undefined,
				'font-weight': undefined,
				'font-style': undefined,
				'font-stretch': undefined,
				'font-feature-settings': undefined,
				'font-variation-settings': undefined,
				'unicode-range': undefined,
				'font-display': 'swap',
			},
		);
	});

	it('sortObjectByKey()', () => {
		assert.equal(
			JSON.stringify(
				sortObjectByKey({
					b: '',
					d: '',
					e: [
						{
							b: '',
							d: '',
							a: '',
							c: {
								b: '',
								d: '',
								a: '',
								c: {},
							},
						},
						{
							b: '',
							d: '',
							a: '',
							c: {
								b: '',
								d: '',
								a: '',
								c: {},
							},
						},
					],
					a: '',
					c: {
						b: '',
						d: '',
						a: '',
						c: {},
					},
				}),
			),
			JSON.stringify({
				a: '',
				b: '',
				c: {
					a: '',
					b: '',
					c: {},
					d: '',
				},
				d: '',
				e: [
					{
						a: '',
						b: '',
						c: {
							a: '',
							b: '',
							c: {},
							d: '',
						},
						d: '',
					},
					{
						a: '',
						b: '',
						c: {
							a: '',
							b: '',
							c: {},
							d: '',
						},
						d: '',
					},
				],
			}),
		);
	});
});
