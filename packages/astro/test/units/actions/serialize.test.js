// @ts-check
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import * as devalue from 'devalue';
import { serializeActionResult } from '../../../dist/actions/runtime/server.js';
import {
	ActionError,
	ActionInputError,
	deserializeActionResult,
} from '../../../dist/actions/runtime/client.js';

describe('serializeActionResult', () => {
	describe('data results', () => {
		it('serializes a string', () => {
			const result = serializeActionResult({ data: 'hello', error: undefined });
			assert.equal(result.type, 'data');
			assert.equal(result.status, 200);
			assert.equal(result.contentType, 'application/json+devalue');
			assert.equal(devalue.parse(result.body), 'hello');
		});

		it('serializes a number', () => {
			const result = serializeActionResult({ data: 42, error: undefined });
			assert.equal(result.type, 'data');
			assert.equal(result.status, 200);
			assert.equal(devalue.parse(result.body), 42);
		});

		it('serializes 0', () => {
			const result = serializeActionResult({ data: 0, error: undefined });
			assert.equal(result.type, 'data');
			assert.equal(result.status, 200);
			assert.equal(devalue.parse(result.body), 0);
		});

		it('serializes false', () => {
			const result = serializeActionResult({ data: false, error: undefined });
			assert.equal(result.type, 'data');
			assert.equal(result.status, 200);
			assert.equal(devalue.parse(result.body), false);
		});

		it('serializes null', () => {
			const result = serializeActionResult({ data: null, error: undefined });
			assert.equal(result.type, 'data');
			assert.equal(result.status, 200);
			assert.equal(devalue.parse(result.body), null);
		});

		it('serializes an object', () => {
			const result = serializeActionResult({
				data: { channel: 'bholmesdev', subscribeButtonState: 'smashed' },
				error: undefined,
			});
			assert.equal(result.type, 'data');
			assert.equal(result.status, 200);
			const parsed = devalue.parse(result.body);
			assert.equal(parsed.channel, 'bholmesdev');
			assert.equal(parsed.subscribeButtonState, 'smashed');
		});

		it('serializes complex values: Date, Set, URL', () => {
			const date = new Date('2024-01-01');
			const set = new Set([1, 2, 3]);
			const url = new URL('https://astro.build');

			const result = serializeActionResult({
				data: { date, set, url },
				error: undefined,
			});
			assert.equal(result.type, 'data');
			assert.equal(result.status, 200);
			assert.equal(result.contentType, 'application/json+devalue');

			const parsed = devalue.parse(result.body, {
				URL: (href) => new URL(href),
			});
			assert.ok(parsed.date instanceof Date);
			assert.equal(parsed.date.toISOString(), date.toISOString());
			assert.ok(parsed.set instanceof Set);
			assert.deepEqual([...parsed.set], [1, 2, 3]);
			assert.ok(parsed.url instanceof URL);
			assert.equal(parsed.url.href, 'https://astro.build/');
		});
	});

	describe('empty results', () => {
		it('returns type "empty" with status 204 when data is undefined', () => {
			const result = serializeActionResult({ data: undefined, error: undefined });
			assert.equal(result.type, 'empty');
			assert.equal(result.status, 204);
			assert.equal(result.body, undefined);
		});
	});

	describe('error results', () => {
		it('serializes an ActionError', () => {
			const error = new ActionError({ code: 'UNAUTHORIZED', message: 'Not logged in' });
			const result = serializeActionResult({ data: undefined, error });
			assert.equal(result.type, 'error');
			assert.equal(result.status, 401);
			assert.equal(result.contentType, 'application/json');

			const body = JSON.parse(result.body);
			assert.equal(body.type, 'AstroActionError');
			assert.equal(body.code, 'UNAUTHORIZED');
			assert.equal(body.message, 'Not logged in');
		});

		it('serializes an ActionInputError with issues and fields', () => {
			const issues = [
				{ code: 'invalid_type', expected: 'string', message: 'Required', path: ['comment'] },
			];
			const error = new ActionInputError(issues);
			const result = serializeActionResult({ data: undefined, error });
			assert.equal(result.type, 'error');
			assert.equal(result.status, 400);
			assert.equal(result.contentType, 'application/json');

			const body = JSON.parse(result.body);
			assert.equal(body.type, 'AstroActionInputError');
			assert.ok(Array.isArray(body.issues));
			assert.equal(body.issues[0].message, 'Required');
			assert.deepEqual(body.fields.comment, ['Required']);
		});

		it('uses correct status for different error codes', () => {
			const codes = [
				['BAD_REQUEST', 400],
				['NOT_FOUND', 404],
				['INTERNAL_SERVER_ERROR', 500],
				['CONTENT_TOO_LARGE', 413],
				['UNSUPPORTED_MEDIA_TYPE', 415],
			];
			for (const [code, expectedStatus] of codes) {
				const error = new ActionError({ code });
				const result = serializeActionResult({ data: undefined, error });
				assert.equal(result.status, expectedStatus, `Expected ${expectedStatus} for code ${code}`);
			}
		});
	});

	describe('invalid data', () => {
		it('throws when data contains a Response object', () => {
			assert.throws(
				() => serializeActionResult({ data: new Response('nope'), error: undefined }),
				/ActionsReturnedInvalidDataError/,
			);
		});
	});
});

describe('deserializeActionResult', () => {
	it('deserializes a data result', () => {
		const serialized = serializeActionResult({
			data: { channel: 'bholmesdev' },
			error: undefined,
		});
		const result = deserializeActionResult(serialized);
		assert.equal(result.error, undefined);
		assert.equal(result.data.channel, 'bholmesdev');
	});

	it('deserializes an empty result', () => {
		const serialized = serializeActionResult({ data: undefined, error: undefined });
		const result = deserializeActionResult(serialized);
		assert.equal(result.data, undefined);
		assert.equal(result.error, undefined);
	});

	it('deserializes an ActionError result', () => {
		const serialized = serializeActionResult({
			data: undefined,
			error: new ActionError({ code: 'UNAUTHORIZED', message: 'Not logged in' }),
		});
		const result = deserializeActionResult(serialized);
		assert.equal(result.data, undefined);
		assert.ok(result.error instanceof ActionError);
		assert.equal(result.error.code, 'UNAUTHORIZED');
		assert.equal(result.error.message, 'Not logged in');
	});

	it('deserializes an ActionInputError result', () => {
		const issues = [
			{ code: 'invalid_type', expected: 'string', message: 'Required', path: ['name'] },
		];
		const serialized = serializeActionResult({
			data: undefined,
			error: new ActionInputError(issues),
		});
		const result = deserializeActionResult(serialized);
		assert.equal(result.data, undefined);
		assert.ok(result.error instanceof ActionInputError);
		assert.equal(result.error.code, 'BAD_REQUEST');
		assert.ok(Array.isArray(result.error.issues));
	});

	it('roundtrips complex data types', () => {
		const date = new Date('2024-06-15');
		const set = new Set(['a', 'b']);

		const serialized = serializeActionResult({ data: { date, set }, error: undefined });
		const result = deserializeActionResult(serialized);

		assert.ok(result.data.date instanceof Date);
		assert.equal(result.data.date.toISOString(), date.toISOString());
		assert.ok(result.data.set instanceof Set);
		assert.deepEqual([...result.data.set], ['a', 'b']);
	});

	it('roundtrips 0 and false', () => {
		const zero = deserializeActionResult(serializeActionResult({ data: 0, error: undefined }));
		assert.equal(zero.data, 0);

		const f = deserializeActionResult(serializeActionResult({ data: false, error: undefined }));
		assert.equal(f.data, false);
	});

	it('handles malformed error body gracefully', () => {
		const result = deserializeActionResult({
			type: 'error',
			status: 500,
			contentType: 'application/json',
			body: 'not valid json',
		});
		assert.ok(result.error instanceof ActionError);
		assert.equal(result.error.code, 'INTERNAL_SERVER_ERROR');
		assert.equal(result.error.message, 'not valid json');
	});
});
