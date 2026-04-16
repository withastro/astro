import * as assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { errorMap } from '../dist/core/errors/zod-error-map.js';
import { z } from '../dist/zod.js';
import { fixLineEndings } from './test-utils.js';

describe('Content Collections - error map', () => {
	it('Returns formatted error for type mismatch', () => {
		const error = getParseError(
			z.object({
				foo: z.string(),
			}),
			{ foo: 1 },
		);
		assert.deepEqual(messages(error), ['**foo**: Expected type `"string"`, received `"number"`']);
	});
	it('Returns formatted error for literal mismatch', () => {
		const error = getParseError(
			z.object({
				lang: z.literal('en'),
			}),
			{ lang: 'es' },
		);
		assert.deepEqual(messages(error), ['Invalid input: expected "en"']);
	});
	it('Replaces undefined errors with "Required"', () => {
		const error = getParseError(
			z.object({
				foo: z.string(),
				bar: z.string(),
			}),
			{ foo: 'foo' },
		);
		assert.deepEqual(messages(error), ['**bar**: Required']);
	});
	it('Returns formatted error for basic union mismatch', () => {
		const error = getParseError(
			z.union([z.boolean(), z.number()]),
			'not a boolean or a number, oops!',
		);
		assert.deepEqual(messages(error), [
			fixLineEndings('Did not match union.\n> Expected type `"boolean"`, received `"string"`'),
		]);
	});
	it('Returns formatted error for union mismatch on nested object properties', () => {
		const error = getParseError(
			z.union([
				z.object({
					type: z.literal('tutorial'),
				}),
				z.object({
					type: z.literal('article'),
				}),
			]),
			{ type: 'integration-guide' },
		);
		assert.deepEqual(messages(error), [
			fixLineEndings(
				'Did not match union.\n' +
					'> Expected type `"tutorial" | "article"`\n' +
					'> Received `{ "type": "integration-guide" }`',
			),
		]);
	});
	it('Lets unhandled errors fall through', () => {
		const error = getParseError(
			z.object({
				lang: z.enum(['en', 'fr']),
			}),
			{ lang: 'jp' },
		);
		assert.deepEqual(messages(error), [`Invalid option: expected one of "en"|"fr"`]);
	});
});

/**
 * @param {z.ZodError} error
 * @returns string[]
 */
function messages(error) {
	return error.issues.map((e) => e.message);
}

function getParseError(schema, entry, parseOpts = { error: errorMap }) {
	const res = schema.safeParse(entry, parseOpts);
	assert.equal(res.success, false, 'Schema should raise error');
	return res.error;
}
