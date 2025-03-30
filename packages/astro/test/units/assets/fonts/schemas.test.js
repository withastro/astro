// @ts-check
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { sharedFontOptionsSchema, VALID_CHAR_RE } from '../../../../dist/assets/fonts/config.js';

describe('fonts schemas', () => {
	it('sharedFontOptionsSchema', () => {
		assert.deepStrictEqual(
			sharedFontOptionsSchema.safeParse({
				weights: ['400', 400, '500', 600, '100..900'],
				styles: ['normal', 'normal', 'oblique'],
				subsets: ['latin', 'latin', 'latin-extended'],
				fallbacks: ['Arial', 'Roboto', 'Arial'],
			}),
			{
				success: true,
				data: {
					weights: ['400', '500', '600', '100..900'],
					styles: ['normal', 'oblique'],
					subsets: ['latin', 'latin-extended'],
					fallbacks: ['Arial', 'Roboto'],
					automaticFallback: true,
				},
			},
		);
	});

	it('VALID_CHAR_RE', () => {
		assert.equal(VALID_CHAR_RE.test('abA _:8'), true);
		assert.equal(VALID_CHAR_RE.test('('), false);
	});
});
