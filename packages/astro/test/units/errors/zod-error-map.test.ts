import * as assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { errorMap } from '../../../dist/core/errors/zod-error-map.js';

/** Extract the message string from errorMap's return value. */
function getMessage(result: ReturnType<typeof errorMap>): string {
	if (typeof result === 'string') return result;
	if (result && typeof result === 'object' && 'message' in result) return result.message;
	throw new Error(`Expected a message, got ${JSON.stringify(result)}`);
}

// #region invalid_type
describe('errorMap — invalid_type', () => {
	it('formats expected vs received message', () => {
		const msg = getMessage(
			errorMap({
				code: 'invalid_type',
				expected: 'string',
				input: 42,
				path: [],
				message: '',
			}),
		);
		assert.match(msg, /Expected type `"string"`/);
		assert.match(msg, /received `"number"`/);
	});

	it('includes bold path prefix for nested paths', () => {
		const msg = getMessage(
			errorMap({
				code: 'invalid_type',
				expected: 'boolean',
				input: 'hello',
				path: ['config', 'enabled'],
				message: '',
			}),
		);
		assert.match(msg, /\*\*config\.enabled\*\*/);
		assert.match(msg, /Expected type `"boolean"`/);
	});

	it('shows "Required" when received is undefined', () => {
		const msg = getMessage(
			errorMap({
				code: 'invalid_type',
				expected: 'string',
				input: undefined,
				path: ['name'],
				message: 'Required',
			}),
		);
		assert.match(msg, /Required/);
	});

	it('handles root-level path (empty path)', () => {
		const msg = getMessage(
			errorMap({
				code: 'invalid_type',
				expected: 'object',
				input: 'bad',
				path: [],
				message: '',
			}),
		);
		// No bold prefix when path is empty
		assert.ok(!msg.includes('**'));
		assert.match(msg, /Expected type `"object"`/);
	});
});
// #endregion

// #region invalid_union
describe('errorMap — invalid_union', () => {
	it('deduplicates common type errors across union members', () => {
		const msg = getMessage(
			errorMap({
				code: 'invalid_union',
				input: 123,
				path: [],
				message: '',
				errors: [
					[
						{
							code: 'invalid_type',
							expected: 'string',
							received: 'number',
							input: 123,
							path: ['key'],
							message: '',
						} as any,
					],
					[
						{
							code: 'invalid_type',
							expected: 'string',
							received: 'number',
							input: 123,
							path: ['key'],
							message: '',
						} as any,
					],
				],
			}),
		);
		assert.match(msg, /Did not match union/);
		assert.match(msg, /\*\*key\*\*/);
		assert.match(msg, /Expected type/);
		assert.match(msg, /received/);
	});

	it('shows expected shapes when type errors differ across union members', () => {
		const msg = getMessage(
			errorMap({
				code: 'invalid_union',
				input: { wrong: true },
				path: [],
				message: '',
				errors: [
					[
						{
							code: 'invalid_type',
							expected: 'string',
							input: { wrong: true },
							path: ['a'],
							message: '',
						},
					],
					[
						{
							code: 'invalid_type',
							expected: 'number',
							input: { wrong: true },
							path: ['b'],
							message: '',
						},
					],
				],
			}),
		);
		assert.match(msg, /Did not match union/);
		assert.match(msg, /Expected type/);
	});

	it('handles nested path for union error', () => {
		const msg = getMessage(
			errorMap({
				code: 'invalid_union',
				input: 'bad',
				path: ['items', 0],
				message: '',
				errors: [
					[
						{
							code: 'invalid_type',
							expected: 'string',
							input: 'bad',
							path: ['items', 0, 'type'],
							message: '',
						},
					],
				],
			}),
		);
		assert.match(msg, /\*\*items\.0\*\*/);
	});
});
// #endregion

// #region fallback
describe('errorMap — fallback behavior', () => {
	it('returns message with path prefix for issues with a message', () => {
		const msg = getMessage(
			errorMap({
				code: 'custom' as any,
				path: ['setting'],
				message: 'Invalid value',
				input: undefined,
			}),
		);
		assert.match(msg, /\*\*setting\*\*: Invalid value/);
	});

	it('returns undefined for unknown code without message', () => {
		const result = errorMap({
			code: 'custom' as any,
			path: [],
			input: undefined,
			message: undefined as any,
		});
		assert.equal(result, undefined);
	});
});
// #endregion
