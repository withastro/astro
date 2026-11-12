import { describe, it } from 'node:test';
import { expectTypeOf } from 'expect-type';
import type { Kebab, KebabKeys } from '../../dist/type-utils.js';

declare const marker: unique symbol;

describe('CSS kebab-case keys', () => {
	it('converts CSS names including vendor prefixes', () => {
		expectTypeOf<Kebab<'backgroundColor'>>().toEqualTypeOf<'background-color'>();
		expectTypeOf<KebabKeys<{ WebkitLineClamp: number; color: string }>>().toEqualTypeOf<{
			'-webkit-line-clamp': number;
			color: string;
		}>();
	});

	it('preserves property modifiers and non-string keys', () => {
		expectTypeOf<KebabKeys<{ readonly backgroundColor?: string }>>().toEqualTypeOf<{
			readonly 'background-color'?: string;
		}>();
		expectTypeOf<KebabKeys<{ 0: number; [marker]: boolean }>>().toEqualTypeOf<{
			0: number;
			[marker]: boolean;
		}>();
	});

	it('rejects a camel-case key in the mapped object', () => {
		expectTypeOf<{ backgroundColor: string }>().not.toExtend<
			KebabKeys<{ backgroundColor: string }>
		>();
	});
});
