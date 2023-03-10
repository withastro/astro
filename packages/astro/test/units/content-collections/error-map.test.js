import { z } from '../../../zod.mjs';
import { errorMap } from '../../../dist/content/index.js';
import { fixLineEndings } from '../../test-utils.js';
import { expect } from 'chai';

describe('Content Collections - error map', () => {
	it('Prefixes messages with object key', () => {
		const error = getParseError(
			z.object({
				base: z.string(),
				nested: z.object({
					key: z.string(),
				}),
				union: z.union([z.string(), z.number()]),
			}),
			{ base: 1, nested: { key: 2 }, union: true }
		);
		const msgs = messages(error).sort();
		expect(msgs).to.have.length(3);
		// expect "**" for bolding
		expect(msgs[0].startsWith('**base**')).to.equal(true);
		expect(msgs[1].startsWith('**nested.key**')).to.equal(true);
		expect(msgs[2].startsWith('**union**')).to.equal(true);
	});
	it('Returns formatted error for type mismatch', () => {
		const error = getParseError(
			z.object({
				foo: z.string(),
			}),
			{ foo: 1 }
		);
		expect(messages(error)).to.deep.equal(['**foo**: Expected type `"string"`, received "number"']);
	});
	it('Returns formatted error for literal mismatch', () => {
		const error = getParseError(
			z.object({
				lang: z.literal('en'),
			}),
			{ lang: 'es' }
		);
		expect(messages(error)).to.deep.equal(['**lang**: Expected `"en"`, received "es"']);
	});
	it('Replaces undefined errors with "Required"', () => {
		const error = getParseError(
			z.object({
				foo: z.string(),
				bar: z.string(),
			}),
			{ foo: 'foo' }
		);
		expect(messages(error)).to.deep.equal(['**bar**: Required']);
	});
	it('Returns formatted error for basic union mismatch', () => {
		const error = getParseError(
			z.union([z.boolean(), z.number()]),
			'not a boolean or a number, oops!'
		);
		expect(messages(error)).to.deep.equal([
			fixLineEndings(
				'Did not match union:\n> Expected type `"boolean" | "number"`, received "string"'
			),
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
			{ type: 'integration-guide' }
		);
		expect(messages(error)).to.deep.equal([
			fixLineEndings(
				'Did not match union:\n> **type**: Expected `"tutorial" | "article"`, received "integration-guide"'
			),
		]);
	});
	it('Lets unhandled errors fall through', () => {
		const error = getParseError(
			z.object({
				lang: z.enum(['en', 'fr']),
			}),
			{ lang: 'jp' }
		);
		expect(messages(error)).to.deep.equal([
			"**lang**: Invalid enum value. Expected 'en' | 'fr', received 'jp'",
		]);
	});
});

/**
 * @param {z.ZodError} error
 * @returns string[]
 */
function messages(error) {
	return error.errors.map((e) => e.message);
}

function getParseError(schema, entry, parseOpts = { errorMap }) {
	const res = schema.safeParse(entry, parseOpts);
	expect(res.success).to.equal(false, 'Schema should raise error');
	return res.error;
}
