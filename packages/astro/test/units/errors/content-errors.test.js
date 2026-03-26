import * as assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { z } from 'zod';
import { InvalidContentEntryDataError } from '../../../dist/core/errors/errors-data.js';

/**
 * Helper: produce a $ZodError for the given schema + bad input
 */
function zodError(schema, input) {
	const result = schema.safeParse(input);
	if (result.success) throw new Error('Expected safeParse to fail');
	return result.error;
}

describe('InvalidContentEntryDataError', () => {
	it('formats a single missing field as human-readable text', () => {
		const error = zodError(z.object({ title: z.string() }), {});
		const msg = InvalidContentEntryDataError.message('blog', 'post', error);
		assert.ok(msg.includes('**title**:'), `Expected "**title**:" in message, got:\n${msg}`);
		assert.ok(!msg.includes('[{'), `Expected no raw JSON in message, got:\n${msg}`);
	});

	it('formats multiple validation issues', () => {
		const error = zodError(z.object({ title: z.string(), count: z.number() }), { count: 'x' });
		const msg = InvalidContentEntryDataError.message('blog', 'post', error);
		assert.ok(msg.includes('**title**:'), `Missing "**title**:" in:\n${msg}`);
		assert.ok(msg.includes('**count**:'), `Missing "**count**:" in:\n${msg}`);
	});

	it('includes the collection and entry id in the message', () => {
		const error = zodError(z.object({ title: z.string() }), {});
		const msg = InvalidContentEntryDataError.message('my-collection', 'my-entry', error);
		assert.ok(msg.includes('my-collection'), `Missing collection name in:\n${msg}`);
		assert.ok(msg.includes('my-entry'), `Missing entry id in:\n${msg}`);
	});
});
