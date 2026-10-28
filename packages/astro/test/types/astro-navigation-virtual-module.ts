import { describe, it } from 'node:test';
import { expectTypeOf } from 'expect-type';
import '../../client.d.ts';
import { notFound, NotFoundError } from 'astro:navigation';

describe('astro:navigation types', () => {
	it('notFound types', () => {
		expectTypeOf(notFound).toBeFunction();
		expectTypeOf(notFound).returns.toBeNever();

		expectTypeOf(NotFoundError).toBeConstructibleWith('msg', 'title');

		const err = new NotFoundError('Not found', 'Custom');
		expectTypeOf(err.name).toEqualTypeOf<string>();
		expectTypeOf(err.message).toEqualTypeOf<string>();
		expectTypeOf(err.title).toEqualTypeOf<string | undefined>();
	});
});
