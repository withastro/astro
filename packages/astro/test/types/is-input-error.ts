import { expectTypeOf } from 'expect-type';
import { isInputError, defineAction } from '../../dist/actions/runtime/virtual/server.js';
import { z } from '../../zod.mjs';

const exampleAction = defineAction({
	input: z.object({
		name: z.string(),
	}),
	handler: () => {},
});

const result = await exampleAction.safe({ name: 'Alice' });

// `isInputError` narrows unknown error types
try {
	await exampleAction({ name: 'Alice' });
} catch (e) {
	if (isInputError(e)) {
		expectTypeOf(e.fields).toEqualTypeOf<Record<string, string[] | undefined>>();
	}
}

// `isInputError` preserves `fields` object type for ActionError objects
if (isInputError(result.error)) {
	expectTypeOf(result.error.fields).toEqualTypeOf<{ name?: string[] }>();
}
